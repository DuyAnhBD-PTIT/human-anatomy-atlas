import { useEffect, useRef, useState } from "react";
import {
  Box3,
  Matrix4,
  Mesh,
  MeshMatcapMaterial,
  Vector3,
  type Group,
  type Texture,
} from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import type { ModelAsset } from "./types";

/** Traverse once at load, then reuse this flat list for picking/state updates. */
export type LoadedPart = {
  mesh: Mesh;
  rest: Vector3;
  midpoint: Vector3;
  color: string;
  inverseParent: Matrix4;
};
export type LoadedAsset = { group: Group; parts: LoadedPart[] };

/** Frees GPU resources on viewer disposal or when an obsolete request finishes late. */
function disposeGroup(group: Group) {
  group.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    object.geometry.dispose();
    const materials = Array.isArray(object.material)
      ? object.material
      : [object.material];
    materials.forEach((material) => material.dispose());
  });
}

/**
 * Per-viewer cache: assets load only when made visible and stay reusable until unmount.
 * URLs may be absolute (CDN/host app) or relative. Changing the dataset should remount
 * ModelViewer using a new React key; visibility changes never destroy cached meshes.
 */
export function useModelAssets(
  assets: ModelAsset[],
  visible: string[],
  retry: number,
  matcap: Texture,
  onLoading: (delta: number) => void,
  onError: (message: string) => void,
  invalidate: () => void,
) {
  const [loaded, setLoaded] = useState<Record<string, LoadedAsset>>({});
  const cache = useRef<Record<string, LoadedAsset>>({});
  const pending = useRef(new Set<string>());
  const generation = useRef(0);
  // Callback refs prevent host rerenders from restarting network effects.
  const callbacks = useRef({ onLoading, onError });
  callbacks.current = { onLoading, onError };
  useEffect(() => {
    const token = ++generation.current;
    return () => {
      if (generation.current === token) generation.current++;
      callbacks.current.onLoading(-pending.current.size);
      pending.current.clear();
      Object.values(cache.current).forEach(({ group }) => disposeGroup(group));
      cache.current = {};
    };
  }, []);

  useEffect(() => {
    const token = generation.current;
    for (const id of visible) {
      if (cache.current[id] || pending.current.has(id)) continue;
      const asset = assets.find((item) => item.id === id);
      if (!asset || asset.count === 0) continue;
      pending.current.add(id);
      callbacks.current.onLoading(1);
      new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).load(
        asset.url,
        (gltf) => {
          if (token !== generation.current) {
            disposeGroup(gltf.scene);
            return;
          }
          pending.current.delete(id);
          const parts: LoadedPart[] = [];
          gltf.scene.updateMatrixWorld(true);
          gltf.scene.traverse((object) => {
            if (!(object instanceof Mesh)) return;
            const old = Array.isArray(object.material)
              ? object.material
              : [object.material];
            old.forEach((material) => material.dispose());
            object.material = new MeshMatcapMaterial({
              color: asset.color,
              matcap,
            });
            // Preserve the parent basis for GLBs with nested static rotations/scales.
            parts.push({
              mesh: object,
              rest: object.position.clone(),
              inverseParent:
                object.parent?.matrixWorld.clone().invert() ?? new Matrix4(),
              midpoint: new Box3()
                .setFromObject(object)
                .getCenter(new Vector3()),
              color: asset.color,
            });
          });
          cache.current[id] = { group: gltf.scene, parts };
          setLoaded({ ...cache.current });
          callbacks.current.onLoading(-1);
          invalidate();
        },
        undefined,
        () => {
          if (token !== generation.current) return;
          pending.current.delete(id);
          callbacks.current.onLoading(-1);
          callbacks.current.onError(`Không tải được nhóm ${asset.name}.`);
        },
      );
    }
  }, [assets, visible, retry, matcap, invalidate]);
  return loaded;
}
