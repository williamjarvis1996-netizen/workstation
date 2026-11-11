"""Keep fingerprinted assets usable by HTML cached from recent releases."""
import json
import re
import shutil
import sys
import tarfile
from pathlib import Path

INVENTORY = "asset-inventory.json"
ASSET = re.compile(r"[A-Za-z0-9_.-]+\.(?:css|js|woff2?)\Z")


def record_assets(dist):
    assets = dist / "_astro"
    names = sorted(path.name for path in assets.iterdir() if path.is_file() and ASSET.fullmatch(path.name))
    (dist / INVENTORY).write_text(json.dumps(names) + "\n")


def restore_assets(dist, archive):
    assets = dist / "_astro"
    restored = 0
    with tarfile.open(archive, "r:*") as source:
        members = {member.name.removeprefix("./"): member for member in source if member.isfile()}
        inventory = members.get(INVENTORY)
        original_names = None
        if inventory:
            with source.extractfile(inventory) as file:
                original_names = set(json.load(file))
        for path, member in members.items():
            if not path.startswith("_astro/"):
                continue
            name = path.removeprefix("_astro/")
            if not ASSET.fullmatch(name) or (original_names is not None and name not in original_names):
                continue
            destination = assets / name
            if destination.exists():
                continue
            with source.extractfile(member) as file, destination.open("xb") as target:
                shutil.copyfileobj(file, target)
            restored += 1
    print(f"Restored {restored} prior assets from {archive.parent.name}.")


if __name__ == "__main__":
    dist = Path(sys.argv[1])
    record_assets(dist)
    for archive in sys.argv[2:]:
        restore_assets(dist, Path(archive))
