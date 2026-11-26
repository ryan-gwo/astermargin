import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Zip from "adm-zip";

const repository = "ryan-gwo/astermargin";
const tag = process.argv[2];
const stableTag = /^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
assert(tag && stableTag.test(tag), "Usage: npm run release -- vX.Y.Z");

function output(command, ...args) {
    return execFileSync(command, args, { encoding: "utf8" }).trim();
}

function git(...args) {
    return output("git", ...args);
}

function gh(...args) {
    return output("gh", ...args);
}

function compareTags(left, right) {
    const a = stableTag.exec(left).slice(1).map(BigInt);
    const b = stableTag.exec(right).slice(1).map(BigInt);
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return a[i] > b[i] ? 1 : -1;
    }
    return 0;
}

async function sha256(file) {
    return createHash("sha256").update(await readFile(file)).digest("hex");
}

const version = tag.slice(1);
const commit = git("rev-parse", "HEAD");
const tagRef = `refs/tags/${tag}`;
assert.equal(git("status", "--porcelain"), "", "Build from a clean checkout");
assert.equal(git("cat-file", "-t", tagRef), "tag", "Use an annotated tag");
assert.equal(git("rev-parse", `${tagRef}^{commit}`), commit, "Check out the release tag");
git("fetch", "origin", "refs/heads/main:refs/remotes/origin/main");
git("merge-base", "--is-ancestor", commit, "origin/main");
const remoteTag = git("ls-remote", "--tags", "origin", tagRef);
assert.equal(remoteTag, `${git("rev-parse", tagRef)}\t${tagRef}`, "Push the exact release tag first");

const pkg = JSON.parse(await readFile("package.json", "utf8"));
const previous = JSON.parse(git("show", "HEAD^:package.json"));
const lock = JSON.parse(await readFile("package-lock.json", "utf8"));
assert.equal(pkg.version, version, "Tag does not match package.json");
assert.equal(lock.version, version, "Tag does not match package-lock.json");
assert.equal(lock.packages[""].version, version, "Tag does not match the lockfile root package");
assert(compareTags(tag, `v${previous.version}`) > 0, "Tag must point to the commit that increased the version");
const releases = JSON.parse(gh("release", "list", "--repo", repository, "--limit", "100", "--json", "tagName,isDraft,isPrerelease,isLatest"));
for (const release of releases) {
    if (release.tagName === tag) {
        assert(release.isDraft, `${tag} is already published`);
    } else if (!release.isDraft && !release.isPrerelease) {
        assert(compareTags(tag, release.tagName) > 0, "The new version must exceed all published stable releases");
    }
}
// The Actions token has contents access. Reading the repository setting requires admin access.
if (process.env.GITHUB_ACTIONS !== "true") {
    const immutable = JSON.parse(gh("api", `repos/${repository}/immutable-releases`));
    assert.equal(immutable.enabled, true, "Enable immutable releases before publishing");
}

for (const task of ["build", "test"]) {
    execFileSync("npm", ["run", task], { stdio: "inherit" });
}
assert.equal(git("status", "--porcelain"), "", "The production build changed tracked source");

const xpi = "dist/astermargin.xpi";
const archive = new Zip(await readFile(xpi));
const manifest = JSON.parse(archive.readAsText("manifest.json"));
const host = manifest.applications.zotero;
assert.equal(manifest.version, version);
assert.equal(host.id, pkg.config.addonID);
const updateEndpoint = `https://github.com/${repository}/releases/latest/download/update.json`;
assert.equal(host.update_url, updateEndpoint);
const updateFile = "dist/update.json";
const updates = {
    addons: {
        [host.id]: {
            updates: [{
                version,
                update_link: `https://github.com/${repository}/releases/download/${tag}/astermargin.xpi`,
                update_hash: `sha256:${await sha256(xpi)}`,
                update_info_url: `https://github.com/${repository}/releases/tag/${tag}`,
                applications: {
                    zotero: {
                        strict_min_version: host.strict_min_version,
                        strict_max_version: host.strict_max_version,
                    },
                },
            }],
        },
    },
};
await writeFile(updateFile, JSON.stringify(updates, null, 2) + "\n");

const scratch = await mkdtemp(join(tmpdir(), "astermargin-release-"));
if (!releases.some(release => release.tagName === tag)) {
    const body = git("for-each-ref", "--format=%(contents:body)", tagRef);
    const notes = join(scratch, "release-notes.md");
    if (body) await writeFile(notes, body + "\n");
    gh("release", "create", tag, "--repo", repository, "--draft", "--verify-tag",
        "--title", tag, ...(body ? ["--notes-file", notes] : ["--generate-notes"]));
}
const draft = JSON.parse(gh("release", "view", tag, "--repo", repository, "--json", "isDraft"));
assert(draft.isDraft, "Only draft assets can be uploaded");
const assets = [xpi, updateFile];
// Retries may rebuild with a different timestamp. Replace draft assets together,
// then verify both bytes before publication. Immutable releases protect public assets.
gh("release", "upload", tag, ...assets, "--repo", repository, "--clobber");
gh("release", "download", tag, "--repo", repository, "--dir", scratch,
    "--pattern", "astermargin.xpi", "--pattern", "update.json");
for (const file of assets) {
    const assetName = file.split("/").at(-1);
    assert.equal(await sha256(join(scratch, assetName)), await sha256(file), `Draft asset mismatch: ${assetName}`);
}
const url = gh("release", "edit", tag, "--repo", repository, "--draft=false", "--latest");
const published = JSON.parse(gh("api", `repos/${repository}/releases/tags/${tag}`));
assert(!published.draft && published.immutable, "The published release must be immutable");
console.log(`Published ${tag} from ${commit}: ${url}`);
