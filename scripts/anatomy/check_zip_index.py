"""Inspect ZIP directory with HTTP Range, without downloading mesh payloads."""
import urllib.request, struct, json, hashlib
from pathlib import Path
root = Path(__file__).resolve().parents[2] / 'data/source/bodyparts3d-4.0'
root.mkdir(parents=True, exist_ok=True)
base = 'https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/'
results = []
for name in ['isa_BP3D_4.0_obj_99.zip', 'partof_BP3D_4.0_obj_99.zip']:
    req = urllib.request.Request(base + name, headers={'Range': 'bytes=-524288'})
    with urllib.request.urlopen(req, timeout=45) as response:
        if response.status != 206:
            print(name, 'Range unsupported', response.status, flush=True)
            continue
        content_range = response.headers['Content-Range']
        data = response.read()
    start = int(content_range.split()[1].split('-')[0])
    end = data.rfind(b'PK\x05\x06')
    eocd = struct.unpack_from('<4s4H2LH', data, end)
    count, size, offset = eocd[4], eocd[5], eocd[6]
    pos = offset - start
    assert pos >= 0, 'Central directory exceeds range'
    entries = []
    for _ in range(count):
        assert data[pos:pos+4] == b'PK\x01\x02'
        fields = struct.unpack_from('<4s6H3L5H2L', data, pos)
        n, extra, comment = fields[10:13]
        filename = data[pos+46:pos+46+n].decode('utf-8')
        entries.append({'name': filename, 'crc32': fields[7], 'uncompressed_bytes': fields[9]})
        pos += 46+n+extra+comment
    objs = [e for e in entries if e['name'].lower().endswith('.obj')]
    result = {'archive': name, 'url': base+name, 'content_range': content_range,
              'verification': 'ZIP central directory only; not full payload CRC verification',
              'directory_entries': count, 'obj_files': len(objs),
              'unique_mesh_ids': len({Path(e['name']).stem for e in objs}), 'meshes': objs}
    results.append(result)
    print(name, len(objs), 'OBJ entries', flush=True)
(root / 'zip-index-audit.json').write_text(json.dumps(results, indent=2), encoding='utf-8')
