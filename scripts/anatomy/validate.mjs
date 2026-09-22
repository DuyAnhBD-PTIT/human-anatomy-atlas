import fs from "node:fs";
import assert from "node:assert/strict";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { MeshoptDecoder } from "meshoptimizer";
await MeshoptDecoder.ready;
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ "meshopt.decoder": MeshoptDecoder });
const catalog = JSON.parse(
  fs.readFileSync("public/anatomy/catalog.json", "utf8"),
);
const expected = new Set(catalog.meshes.map((m) => m.id));
const found = new Set();
let triangles = 0,
  bytes = 0;
for (const system of catalog.systems) {
  const filename = `public/anatomy/${system.id}.glb`;
  const doc = await io.read(filename);
  bytes += fs.statSync(filename).size;
  for (const node of doc.getRoot().listNodes()) {
    const id = node.getExtras().meshId;
    if (!node.getMesh()) continue;
    assert(expected.has(id));
    assert(!found.has(id));
    found.add(id);
    for (const primitive of node.getMesh().listPrimitives()) {
      const position = primitive.getAttribute("POSITION");
      assert(position.getCount() > 0);
      for (const value of position.getArray()) assert(Number.isFinite(value));
      triangles +=
        (primitive.getIndices()?.getCount() ?? position.getCount()) / 3;
    }
  }
}
assert.equal(found.size, 2234);
assert.equal(triangles, catalog.totalTriangles);
for (const c of catalog.concepts) {
  assert(c.meshIds.length);
  for (const id of c.meshIds) assert(found.has(id));
}
const report = {
  meshes: found.size,
  concepts: catalog.concepts.length,
  triangles,
  glbBytes: bytes,
  missingReferences: 0,
  duplicateMeshIds: 0,
  nonFinitePositions: 0,
};
fs.writeFileSync("docs/asset-validation.json", JSON.stringify(report, null, 2));
console.log(report);
