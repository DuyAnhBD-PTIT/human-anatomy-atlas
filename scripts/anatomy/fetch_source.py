"""Fetch pinned BodyParts3D inputs and extract OBJ files; no third-party packages.

Usage: python scripts/anatomy/fetch_source.py [--offline]
Existing inputs are hash-checked. Changed upstream files fail instead of repinning.
"""
import argparse
import hashlib
import json
from pathlib import Path
import shutil
import urllib.request
import zipfile

ROOT = Path(__file__).resolve().parents[2]


def verify(path, entry):
    if path.stat().st_size != entry['bytes']:
        raise ValueError(f"Size mismatch: {path.name}")
    with path.open('rb') as stream:
        digest = hashlib.file_digest(stream, 'sha256').hexdigest()
    if digest != entry['sha256']:
        raise ValueError(f"SHA256 mismatch: {path.name}")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--offline', action='store_true')
    args = parser.parse_args()
    manifest = json.loads((ROOT / 'data/source-manifest.json').read_text())
    dest = ROOT / 'data/source/bodyparts3d-4.0'
    dest.mkdir(parents=True, exist_ok=True)
    for entry in manifest['files']:
        name = entry['name']
        if Path(name).name != name:
            raise ValueError('Manifest filenames must be flat')
        target = dest / name
        if not target.exists():
            if args.offline:
                raise FileNotFoundError(f'Missing offline input: {target}')
            temporary = target.with_suffix(target.suffix + '.partial')
            # Fixed-size ranges avoid proxy truncation of the large ZIP.
            with temporary.open('wb') as output:
                for start in range(0, entry['bytes'], 4 * 1024 * 1024):
                    end = min(entry['bytes'] - 1, start + 4 * 1024 * 1024 - 1)
                    request = urllib.request.Request(entry['url'], headers={'Range': f'bytes={start}-{end}'})
                    with urllib.request.urlopen(request, timeout=120) as response:
                        block = response.read()
                        if response.status == 200 and start == 0 and len(block) == entry['bytes']:
                            output.write(block)
                            break
                        expected = f"bytes {start}-{end}/{entry['bytes']}"
                        if response.status != 206 or response.headers.get('Content-Range') != expected or len(block) != end - start + 1:
                            raise ValueError(f'Unexpected range response: {name}')
                        output.write(block)
            verify(temporary, entry)
            temporary.replace(target)
        verify(target, entry)
        print(f'Verified {name}', flush=True)
    output = ROOT / 'data/work/obj'
    output.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(dest / 'isa_BP3D_4.0_obj_99.zip') as archive:
        if archive.testzip() is not None:
            raise ValueError('ZIP CRC verification failed')
        members = [m for m in archive.infolist() if m.filename.lower().endswith('.obj')]
        names = [Path(m.filename).name for m in members]
        if len(names) != 2234 or len(set(names)) != len(names):
            raise ValueError('Unexpected mesh count or duplicate filenames')
        for member, name in zip(members, names):
            if not name.startswith('FJ') or not name[2:-4].isalnum():
                raise ValueError(f'Unexpected OBJ filename: {name}')
            with archive.open(member) as source, (output / name).open('wb') as target:
                shutil.copyfileobj(source, target)
    print(f'Extracted {len(names)} OBJ files to {output}')


if __name__ == '__main__':
    main()
