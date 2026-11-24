"""Smoke-test a release XPI in a fresh, disposable Zotero profile.

python acceptance/host_smoke.py /path/to/zotero dist/astermargin.xpi
Use --settings-locale en-US, zh-CN, or zh-TW to exercise settings and the reader homepage.
Use --zotero-locale to start in a different host language, then change the
plugin's language from its settings and reopen the same isolated profile.
Pass --upgrade-from /path/to/previous.xpi for manual installation over a previous build.
Pass --update-from /path/to/previous.xpi to exercise Zotero's background updater
against the final XPI's public update feed. Add --reject-update hash or compatibility
to serve a deliberately invalid feed to a disposable Zotero profile.
On Linux without a display, run the command under xvfb-run -a.
"""
import argparse
from contextlib import suppress
import hashlib
from http.server import BaseHTTPRequestHandler, HTTPServer
import json
from pathlib import Path
import shutil
import socket
import subprocess
import tempfile
import time
from threading import Thread
from urllib.request import ProxyHandler, Request, build_opener
from uuid import uuid4
from zipfile import ZipFile


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("zotero", type=Path)
    parser.add_argument("xpi", type=Path)
    parser.add_argument("--settings-locale", choices=("en-US", "zh-CN", "zh-TW"))
    parser.add_argument("--zotero-locale", choices=("en-US", "zh-CN", "zh-TW"))
    previous = parser.add_mutually_exclusive_group()
    previous.add_argument("--upgrade-from", type=Path)
    previous.add_argument("--update-from", type=Path)
    parser.add_argument("--reject-update", choices=("hash", "compatibility"))
    args = parser.parse_args()
    if args.zotero_locale and (not args.settings_locale or args.upgrade_from or args.update_from):
        parser.error("--zotero-locale requires --settings-locale and a fresh profile")
    if args.reject_update and not args.update_from:
        parser.error("--reject-update requires --update-from")
    binary = args.zotero.resolve()
    if binary.suffix == ".app":
        binary = binary / "Contents/MacOS/zotero"
    xpi = args.xpi.resolve()
    with ZipFile(xpi) as package:
        manifest = json.loads(package.read("manifest.json"))
    host = manifest["applications"]["zotero"]
    assert host["id"] == "astermargin@astermargin.local"
    root = Path(tempfile.mkdtemp(prefix="astermargin-host-")).resolve()
    profile = root / "profile"
    data = root / "data"
    extensions = profile / "extensions"
    extensions.mkdir(parents=True)
    data.mkdir()
    with socket.socket() as port_probe:
        port_probe.bind(("127.0.0.1", 0))
        port = port_probe.getsockname()[1]
    prefs = {
        "extensions.zotero.dataDir": str(data),
        "extensions.zotero.useDataDir": True,
        "extensions.zotero.httpServer.port": port,
        "extensions.zotero.httpServer.enabled": True,
        "extensions.zotero.httpServer.localAPI.enabled": True,
        "extensions.zotero.astermargin.mcpServerEnabled": True,
        "extensions.autoDisableScopes": 0,
        "extensions.enabledScopes": 15,
        "extensions.update.enabled": bool(args.update_from),
        "extensions.update.autoUpdateDefault": bool(args.update_from),
        "app.update.auto": False,
        "extensions.zotero.firstRun": False,
        "extensions.zotero.firstRun2": False,
        "extensions.zotero.automaticScraperUpdates": False,
        "extensions.zotero.sync.autoSync": False,
        "extensions.zoteroMacWordIntegration.skipInstallation": True,
        "extensions.zoteroOpenOfficeIntegration.skipInstallation": True,
    }
    if args.settings_locale:
        prefs["intl.locale.requested"] = args.zotero_locale or args.settings_locale
    if args.settings_locale and (args.update_from or args.upgrade_from):
        prefs["extensions.zotero.astermargin.interfaceLanguage"] = (
            "en" if args.settings_locale == "en-US" else args.settings_locale
        )
    (profile / "user.js").write_text("".join(
        f"user_pref({json.dumps(k)}, {json.dumps(v)});\n" for k, v in prefs.items()
    ), encoding="utf-8")
    initial_package = (args.upgrade_from or args.update_from or xpi).resolve()
    install_path = extensions / "astermargin@astermargin.local.xpi"
    server = None
    requests = []
    with ZipFile(initial_package) as previous_package:
        previous_manifest = json.loads(previous_package.read("manifest.json"))
        previous_version = previous_manifest["version"]
        if args.update_from:
            assert previous_version != manifest["version"], "Use an older XPI for automatic update testing"
            assert previous_manifest["applications"]["zotero"]["id"] == host["id"]
            feed_url = host["update_url"]
            assert feed_url.startswith("https://"), feed_url
            if args.reject_update:
                with build_opener(ProxyHandler({})).open(feed_url, timeout=20) as response:
                    feed = json.load(response)
                published = feed["addons"][host["id"]]["updates"][0]
                assert published["version"] == manifest["version"]
                if args.reject_update == "compatibility":
                    published["applications"]["zotero"]["strict_max_version"] = "9.0.*"
                else:
                    published["update_hash"] = "sha256:" + "0" * 64
                body = json.dumps(feed).encode("utf-8")

                class TestFeed(BaseHTTPRequestHandler):
                    def do_GET(self):
                        if self.path != "/update.json":
                            self.send_error(404)
                            return
                        requests.append(self.path)
                        self.send_response(200)
                        self.send_header("Content-Type", "application/json")
                        self.send_header("Content-Length", str(len(body)))
                        self.end_headers()
                        self.wfile.write(body)

                server = HTTPServer(("127.0.0.1", 0), TestFeed)
                feed_url = f"http://127.0.0.1:{server.server_port}/update.json"
            previous_manifest["applications"]["zotero"]["update_url"] = feed_url
            with ZipFile(install_path, "w") as patched:
                for entry in previous_package.infolist():
                    patched.writestr(entry, json.dumps(previous_manifest) if entry.filename == "manifest.json" else previous_package.read(entry))
        else:
            shutil.copy2(initial_package, install_path)
    initial_hash = hashlib.sha256(install_path.read_bytes()).hexdigest()
    final_hash = hashlib.sha256(xpi.read_bytes()).hexdigest()
    driver_id = "host-smoke@astermargin.local"
    marker = "AsterMargin smoke " + uuid4().hex
    script = Path(__file__).with_name("host_smoke.js").read_text(encoding="utf-8")
    if args.settings_locale:
        script += Path(__file__).with_name("host_settings.js").read_text(encoding="utf-8")
        script += Path(__file__).with_name("host_home.js").read_text(encoding="utf-8")
    fixture = Path(__file__).resolve().parents[1] / "tests/fixtures/pdfs/ocr-renderer/sideways-90.pdf"
    for key, value in {"__DATA__": str(data), "__RESULT__": str(root / "result.json"),
                       "__STOP__": str(root / "finished"), "__MARKER__": marker,
                       "__UPGRADE_XPI__": str(xpi) if args.upgrade_from else None,
                       "__BACKGROUND_UPDATE__": (args.reject_update or "install") if args.update_from else None,
                       "__ZOTERO_LOCALE__": args.zotero_locale,
                       "__LOCALE_SAVED__": str(root / "locale-saved"),
                       "__HOME_PDF__": str(fixture),
                       "__SETTINGS_LOCALE__": args.settings_locale}.items():
        script = script.replace(key, json.dumps(value))
    with ZipFile(extensions / (driver_id + ".xpi"), "w") as package:
        package.writestr("bootstrap.js", script)
        package.writestr("manifest.json", json.dumps({
            "name": "AsterMargin isolated host check", "version": "1", "manifest_version": 2,
            "applications": {"zotero": {"id": driver_id, "strict_min_version": "7.0",
                "strict_max_version": "10.*", "update_url": "https://acceptance.invalid/update.json"}}
        }))
    print("Isolated profile and logs:", root, flush=True)
    command = [str(binary), "-no-remote", "-profile", str(profile),
               "-datadir", str(data), "-ZoteroDebugText"]
    if server:
        Thread(target=server.serve_forever, daemon=True).start()
    with (root / "host.log").open("wb") as log:
        if args.zotero_locale:
            first = subprocess.Popen(command, stdout=log, stderr=log)
            try:
                status = first.wait(timeout=180)
                assert status == 0 and (root / "locale-saved").is_file(), (
                    (root / "result.json").read_text() if (root / "result.json").exists() else status
                )
            finally:
                if first.poll() is None:
                    first.terminate()
                    first.wait(timeout=10)
        proc = subprocess.Popen(command, stdout=log, stderr=log)
        try:
            for _ in range(900):
                if (root / "result.json").exists():
                    break
                if proc.poll() is not None:
                    raise RuntimeError(f"Zotero exited before reporting readiness (status {proc.returncode})")
                time.sleep(.2)
            result = json.loads((root / "result.json").read_text(encoding="utf-8"))
            expected_version = previous_version if args.reject_update else manifest["version"]
            assert result.get("plugin") == expected_version and result.get("ready"), result
            assert result["sidebar"] and result["quick"] == "compose" and result["window"], result
            if args.settings_locale:
                assert result["settings"]["locale"] == args.settings_locale, result
                assert result["settings"]["entryPoints"] == ["sidebar menu", "Zotero preferences button"], result
                assert result["home"]["categories"] and result["home"]["readerChip"], result
                if args.zotero_locale:
                    assert result["settings"]["hostLocale"] == args.zotero_locale, result
            if args.upgrade_from or args.update_from:
                assert result["upgradedFrom"] == previous_version, result
            if args.reject_update:
                assert requests, "Zotero did not fetch the negative-test update manifest"
            actual_hash = hashlib.sha256(install_path.read_bytes()).hexdigest()
            assert actual_hash == (initial_hash if args.reject_update else final_hash), "Installed XPI bytes differed from the expected archive"
            request = Request(f"http://127.0.0.1:{port}/astermargin/mcp",
                data=json.dumps({"jsonrpc":"2.0","id":1,"method":"tools/call","params":{
                    "name":"search_by_metadata","arguments":{"title_query": marker}}}).encode(),
                headers={"Content-Type":"application/json"})
            with build_opener(ProxyHandler({})).open(request, timeout=15) as response:
                reply = json.load(response)
            assert result["itemKey"] in json.dumps(reply["result"]), reply
            result.update(mcp=True, xpi_sha256=actual_hash)
            (root / "receipt.json").write_text(json.dumps(result, indent=2), encoding="utf-8")
            print(json.dumps(result, ensure_ascii=False))
        finally:
            (root / "finished").touch()
            try:
                proc.wait(timeout=10)
            except subprocess.TimeoutExpired:
                proc.terminate()
                with suppress(subprocess.TimeoutExpired):
                    proc.wait(timeout=10)
            if server:
                server.shutdown()
                server.server_close()


if __name__ == "__main__":
    main()

