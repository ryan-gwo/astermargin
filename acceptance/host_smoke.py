"""Smoke-test a release XPI in a fresh, disposable Zotero profile.

python acceptance/host_smoke.py /path/to/zotero dist/astermargin.xpi
On Linux without a display, run the command under xvfb-run -a.
"""
import argparse
from contextlib import suppress
import hashlib
import json
from pathlib import Path
import shutil
import socket
import subprocess
import tempfile
import time
from urllib.request import ProxyHandler, Request, build_opener
from uuid import uuid4
from zipfile import ZipFile


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("zotero", type=Path)
    parser.add_argument("xpi", type=Path)
    args = parser.parse_args()
    binary = args.zotero.resolve()
    if binary.suffix == ".app":
        binary = binary / "Contents/MacOS/zotero"
    xpi = args.xpi.resolve()
    with ZipFile(xpi) as package:
        manifest = json.loads(package.read("manifest.json"))
    assert manifest["applications"]["zotero"]["id"] == "astermargin@astermargin.local"
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
        "extensions.update.enabled": False,
        "app.update.auto": False,
        "extensions.zotero.firstRun": False,
        "extensions.zotero.firstRun2": False,
        "extensions.zotero.automaticScraperUpdates": False,
        "extensions.zotero.sync.autoSync": False,
        "extensions.zoteroMacWordIntegration.skipInstallation": True,
        "extensions.zoteroOpenOfficeIntegration.skipInstallation": True,
    }
    (profile / "user.js").write_text("".join(
        f"user_pref({json.dumps(k)}, {json.dumps(v)});\n" for k, v in prefs.items()
    ), encoding="utf-8")
    shutil.copy2(xpi, extensions / "astermargin@astermargin.local.xpi")
    driver_id = "host-smoke@astermargin.local"
    marker = "AsterMargin smoke " + uuid4().hex
    script = (Path(__file__).with_name("host_smoke.js")).read_text(encoding="utf-8")
    for key, value in {"__DATA__": str(data), "__RESULT__": str(root / "result.json"),
                       "__STOP__": str(root / "finished"), "__MARKER__": marker}.items():
        script = script.replace(key, json.dumps(value))
    with ZipFile(extensions / (driver_id + ".xpi"), "w") as package:
        package.writestr("bootstrap.js", script)
        package.writestr("manifest.json", json.dumps({
            "name": "AsterMargin isolated host check", "version": "1", "manifest_version": 2,
            "applications": {"zotero": {"id": driver_id, "strict_min_version": "7.0",
                "strict_max_version": "10.*", "update_url": "https://acceptance.invalid/update.json"}}
        }))
    print("Isolated profile and logs:", root, flush=True)
    with (root / "host.log").open("wb") as log:
        proc = subprocess.Popen([str(binary), "-no-remote", "-profile", str(profile),
                                 "-datadir", str(data), "-ZoteroDebugText"], stdout=log, stderr=log)
        try:
            for _ in range(900):
                if (root / "result.json").exists():
                    break
                if proc.poll() is not None:
                    raise RuntimeError(f"Zotero exited before reporting readiness (status {proc.returncode})")
                time.sleep(.2)
            result = json.loads((root / "result.json").read_text(encoding="utf-8"))
            assert result.get("plugin") == manifest["version"] and result.get("ready"), result
            assert result["sidebar"] and result["quick"] == "compose" and result["window"], result
            request = Request(f"http://127.0.0.1:{port}/astermargin/mcp",
                data=json.dumps({"jsonrpc":"2.0","id":1,"method":"tools/call","params":{
                    "name":"search_by_metadata","arguments":{"title_query": marker}}}).encode(),
                headers={"Content-Type":"application/json"})
            with build_opener(ProxyHandler({})).open(request, timeout=15) as response:
                reply = json.load(response)
            assert result["itemKey"] in json.dumps(reply["result"]), reply
            result.update(mcp=True, xpi_sha256=hashlib.sha256(xpi.read_bytes()).hexdigest())
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


if __name__ == "__main__":
    main()

