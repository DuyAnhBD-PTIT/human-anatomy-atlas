import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { Document, NodeIO } from "@gltf-transform/core";
import {
  KHRMaterialsUnlit,
  EXTMeshoptCompression,
} from "@gltf-transform/extensions";
import { weld } from "@gltf-transform/functions";
import { MeshoptEncoder } from "meshoptimizer";
const root = process.cwd(),
  source = path.join(root, "data/source/bodyparts3d-4.0"),
  out = path.join(root, "public/anatomy");
fs.mkdirSync(out, { recursive: true });
const rows = (name) =>
  fs
    .readFileSync(path.join(source, name), "utf8")
    .trim()
    .split(/\r?\n/)
    .slice(1)
    .map((x) => x.split("\t"));
const concepts = new Map();
function concept(id, en) {
  if (!concepts.has(id))
    concepts.set(id, {
      id,
      en,
      vi: null,
      la: null,
      meshIds: new Set(),
      parents: new Set(),
    });
  return concepts.get(id);
}
for (const prefix of ["isa", "partof"]) {
  for (const [id, , en] of rows(`${prefix}_parts_list_e.txt`)) concept(id, en);
  for (const [id, en, mesh] of rows(`${prefix}_element_parts.txt`))
    concept(id, en).meshIds.add(mesh);
  for (const [parent, pname, child, cname] of rows(
    `${prefix}_inclusion_relation_list.txt`,
  )) {
    concept(parent, pname);
    concept(child, cname).parents.add(parent);
  }
}
const systems = [
  ["skeleton", "Xương", "#c5b89b", ["FMA23881", "FMA5018"]],
  ["muscles", "Cơ", "#b96f62", ["FMA5022"]],
  ["heart", "Tim", "#a64e4c", ["FMA7088"]],
  ["respiratory", "Hô hấp", "#91ada9", ["FMA7158"]],
  ["digestive", "Tiêu hóa", "#c39c76", ["FMA7152", "FMA7197"]],
  ["urinary", "Tiết niệu", "#b69aad", ["FMA7159", "FMA7203"]],
  ["arteries", "Động mạch", "#b95e58", ["FMA50720"]],
  ["veins", "Tĩnh mạch", "#6b91aa", ["FMA50723"]],
  ["nervous", "Thần kinh", "#c8ad62", ["FMA7157", "FMA65132", "FMA50801"]],
  ["endocrine", "Nội tiết", "#ad96b8", ["FMA9668"]],
  ["reproductive", "Sinh dục", "#bf91a0", ["FMA7160"]],
  ["skin", "Da", "#d5b49c", ["FMA7163"]],
  ["sensory", "Giác quan", "#acc6cd", []],
  ["connective", "Mô liên kết", "#d7d5bc", ["FMA9640"]],
  ["lymphatic", "Bạch huyết", "#8cab85", []],
  ["other", "Chưa phân nhóm", "#b4b3ac", []],
].map(([id, name, color, roots]) => ({ id, name, color, roots }));
const terms = {
  FMA7088: ["Tim", "Cor"],
  FMA7197: ["Gan", "Hepar"],
  FMA7196: ["Lách", "Splen"],
  FMA7203: ["Thận", "Ren"],
  FMA50801: ["Não", "Encephalon"],
  FMA7163: ["Da", "Cutis"],
};
for (const [id, [vi, la]] of Object.entries(terms)) {
  const c = concepts.get(id);
  if (c) {
    c.vi = vi;
    c.la = la;
    c.translationStatus = "draft";
  }
}
const candidates = new Map();
for (const c of concepts.values())
  for (const id of c.meshIds) {
    if (!candidates.has(id)) candidates.set(id, []);
    candidates.get(id).push(c);
  }
const ids = fs
  .readdirSync(path.join(root, "data/work/obj"))
  .filter((x) => x.endsWith(".obj"))
  .map((x) => x.slice(0, -4))
  .sort();
assert.equal(ids.length, 2234);
for (const id of candidates.keys())
  assert(ids.includes(id), `Missing mesh ${id}`);
// Classify from the original DBCLS ontology only. Breadth-first traversal keeps
// multiple parents, detects cycles via visited IDs, and prefers the nearest root.
// These are display groups, not a clinically reviewed replacement for the ontology.
function classify(candidates) {
  // Element tables contain type concepts even when a fragmented organ has no
  // path to a whole-organ root. Match those ORIGINAL labels before region roots
  // (e.g. an artery inside the lung should remain in the arterial display group).
  const labels = candidates.map((c) => c.en.toLowerCase()).join(" | ");
  const typeRules = [
    ["arteries", /\b(artery|arteries|arterial)\b/],
    ["veins", /\b(vein|veins|venous)\b/],
    ["nervous", /\b(nerve|neural|ganglion|spinal cord|brain)\b/],
    ["heart", /\b(heart|cardiac)\b/],
    ["muscles", /\b(muscle|muscular|musculature)\b/],
    ["skeleton", /\b(bone|tooth|teeth|cartilage|skeletal)\b/],
    ["skin", /\b(skin|integument|body surface|eyebrow|eyelash)\b/],
    [
      "sensory",
      /\b(eyeball|eyelid|retina|lacrimal|ciliaris|cochlea|inner ear|middle ear)\b/,
    ],
    ["lymphatic", /\b(lymphatic|lymph node|thoracic duct)\b/],
    ["connective", /\b(ligament|tendon|fascia|interosseous membrane)\b/],
    [
      "reproductive",
      /\b(testis|testes|penis|prostate|seminal|deferens|scrotum|pubic hair)\b/,
    ],
  ];
  for (const [system, pattern] of typeRules) {
    if (pattern.test(labels))
      return { system, root: pattern.source, depth: null };
  }
  const queue = candidates.map((c) => [c.id, 0]);
  const seen = new Set();
  for (let i = 0; i < queue.length; i++) {
    const [id, depth] = queue[i];
    if (seen.has(id)) continue;
    seen.add(id);
    const system = systems.find((s) => s.roots.includes(id));
    if (system) return { system: system.id, root: id, depth };
    for (const parent of concepts.get(id)?.parents ?? [])
      queue.push([parent, depth + 1]);
  }
  return { system: "other", root: null, depth: null };
}
const classificationReport = [];
const meshes = [];
const groups = new Map(systems.map((s) => [s.id, []]));
for (const id of ids) {
  const cc = (candidates.get(id) ?? []).sort(
    (a, b) => a.meshIds.size - b.meshIds.size || a.en.length - b.en.length,
  );
  assert(cc.length, `Unnamed ${id}`);
  const primary = cc[0];
  const classification = classify(cc);
  const system = classification.system;
  classificationReport.push({
    meshId: id,
    name: primary.en,
    ...classification,
  });
  const entry = {
    id,
    conceptId: primary.id,
    system,
    conceptIds: cc.map((c) => c.id),
  };
  meshes.push(entry);
  groups.get(system).push(entry);
}
await MeshoptEncoder.ready;
const io = new NodeIO()
  .registerExtensions([KHRMaterialsUnlit, EXTMeshoptCompression])
  .registerDependencies({ "meshopt.encoder": MeshoptEncoder });
let totalTriangles = 0;
const globalMin = [Infinity, Infinity, Infinity],
  globalMax = [-Infinity, -Infinity, -Infinity];
for (const system of systems) {
  // A previous classification may have produced this group. Never retain stale
  // geometry for a now-empty group, otherwise validators can see duplicate IDs.
  if (!groups.get(system.id).length) {
    fs.rmSync(path.join(out, `${system.id}.glb`), { force: true });
    continue;
  }
  const doc = new Document(),
    buffer = doc.createBuffer(),
    scene = doc.createScene();
  const ext = doc.createExtension(KHRMaterialsUnlit);
  const material = doc
    .createMaterial()
    .setExtension("KHR_materials_unlit", ext.createUnlit());
  for (const item of groups.get(system.id)) {
    const obj = new OBJLoader().parse(
      fs.readFileSync(
        path.join(root, "data/work/obj", `${item.id}.obj`),
        "utf8",
      ),
    );
    const mesh = doc.createMesh(item.id);
    let tris = 0;
    obj.traverse((child) => {
      if (!child.isMesh) return;
      const g = child.geometry,
        p = g.getAttribute("position"),
        a = new Float32Array(p.count * 3);
      for (let i = 0; i < p.count; i++) {
        const values = [p.getX(i), p.getZ(i), -p.getY(i)];
        for (let k = 0; k < 3; k++) {
          assert(Number.isFinite(values[k]));
          a[i * 3 + k] = values[k];
          globalMin[k] = Math.min(globalMin[k], values[k]);
          globalMax[k] = Math.max(globalMax[k], values[k]);
        }
      }
      const prim = doc
        .createPrimitive()
        .setAttribute(
          "POSITION",
          doc.createAccessor().setType("VEC3").setArray(a).setBuffer(buffer),
        )
        .setMaterial(material);
      const n = g.getAttribute("normal");
      if (n) {
        const normals = new Float32Array(n.count * 3);
        for (let i = 0; i < n.count; i++) {
          normals[i * 3] = n.getX(i);
          normals[i * 3 + 1] = n.getZ(i);
          normals[i * 3 + 2] = -n.getY(i);
        }
        prim.setAttribute(
          "NORMAL",
          doc
            .createAccessor()
            .setType("VEC3")
            .setArray(normals)
            .setBuffer(buffer),
        );
      }
      if (g.index)
        prim.setIndices(
          doc
            .createAccessor()
            .setType("SCALAR")
            .setArray(new Uint32Array(g.index.array))
            .setBuffer(buffer),
        );
      tris += (g.index ? g.index.count : p.count) / 3;
      mesh.addPrimitive(prim);
      g.dispose();
    });
    totalTriangles += tris;
    scene.addChild(
      doc
        .createNode(item.id)
        .setMesh(mesh)
        .setExtras({ meshId: item.id, conceptId: item.conceptId }),
    );
  }
  if (groups.get(system.id).length) {
    await doc.transform(weld());
    doc
      .createExtension(EXTMeshoptCompression)
      .setRequired(true)
      .setEncoderOptions({
        method: EXTMeshoptCompression.EncoderMethod.QUANTIZE,
      });
    await io.write(path.join(out, `${system.id}.glb`), doc);
    console.log(system.id, groups.get(system.id).length);
  }
}
const catalog = {
  version: "bodyparts3d-4.0",
  source: "https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html",
  systems: systems
    .filter((s) => groups.get(s.id).length)
    .map(({ roots: _roots, ...s }) => ({
      ...s,
      count: groups.get(s.id).length,
      url: `./anatomy/${s.id}.glb`,
    })),
  meshes,
  concepts: [...concepts.values()]
    .filter((c) => c.meshIds.size)
    .map((c) => ({
      ...c,
      meshIds: [...c.meshIds],
      parents: [...c.parents],
      systems: [
        ...new Set(
          [...c.meshIds].map((id) => meshes.find((m) => m.id === id)?.system),
        ),
      ],
    })),
  bounds: { min: globalMin, max: globalMax },
  totalTriangles,
};
fs.writeFileSync(path.join(out, "catalog.json"), JSON.stringify(catalog));
fs.writeFileSync(
  path.join(root, "docs/catalog-build.json"),
  JSON.stringify(
    {
      meshCount: meshes.length,
      conceptCount: catalog.concepts.length,
      totalTriangles,
      bounds: catalog.bounds,
      systemCounts: catalog.systems.map((s) => ({ id: s.id, count: s.count })),
      classification:
        "Display groups derived from DBCLS concept ancestry; unresolved items remain explicit. Medical review required.",
      translations: "Six illustrative VI/Latin labels are draft, not reviewed.",
    },
    null,
    2,
  ),
);
fs.writeFileSync(
  path.join(out, "NOTICE.txt"),
  "BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International.\nhttps://creativecommons.org/licenses/by/4.0/\nChanges: OBJ to GLB; common axis transform; display groups; draft translations.\n",
);
console.log(
  "Catalog:",
  meshes.length,
  "meshes",
  catalog.concepts.length,
  "concepts",
  totalTriangles,
  "triangles",
  globalMin,
  globalMax,
);

fs.writeFileSync(
  path.join(root, "docs/classification.json"),
  JSON.stringify(classificationReport, null, 2),
);
