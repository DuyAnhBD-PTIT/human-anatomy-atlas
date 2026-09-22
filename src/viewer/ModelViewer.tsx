import { useEffect, useMemo, useRef, type ComponentRef } from "react";
import { Canvas, useThree, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Group, MeshMatcapMaterial, Vector3 } from "three";
import { animateRotation, explosionOffset } from "./animation";
import { createMatcap } from "./materials";
import { useModelAssets } from "./useModelAssets";
import { RenderMetrics } from "./metrics";
import type { ModelViewerProps } from "./types";

/** Embeddable canvas; parent must supply a container with an explicit height. */
export function ModelViewer(props: ModelViewerProps) {
  return (
    <Canvas
      orthographic
      frameloop="demand"
      dpr={[1, props.maxDpr ?? 1.5]}
      camera={{ position: [0, 0, 8], zoom: 230, near: 0.01, far: 100 }}
      gl={{ antialias: true, alpha: true }}
      onPointerMissed={props.onMiss}
    >
      <ModelScene {...props} />
      {/* Opt-in instrumentation has no hooks or timers in normal application sessions. */}
      {new URLSearchParams(location.search).has("profile") && <RenderMetrics />}
    </Canvas>
  );
}

/** Scene-only entry point for hosts that already own an R3F Canvas. */
export function ModelScene(p: ModelViewerProps) {
  const { invalidate, camera, size, gl } = useThree();
  const group = useRef<Group>(null);
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const matcap = useMemo(createMatcap, []);
  const loaded = useModelAssets(
    p.assets,
    p.visible,
    p.retry,
    matcap,
    p.onLoading,
    p.onError,
    invalidate,
  );
  const height = Math.max(0.001, p.bounds.max[1] - p.bounds.min[1]);
  const scale = 2.7 / height;
  const center = useMemo(
    () => new Vector3(...p.bounds.min.map((v, i) => (v + p.bounds.max[i]) / 2)),
    [p.bounds],
  );
  const progress = Math.min(1, Math.max(0, p.explode));
  useEffect(() => () => matcap.dispose(), [matcap]);
  useEffect(() => {
    gl.domElement.style.cursor = p.hovered ? "pointer" : "grab";
    return () => {
      gl.domElement.style.cursor = "";
    };
  }, [p.hovered, gl]);

  // Offsets are calculated only when assets/layout options change, never on hover.
  const offsets = useMemo(
    () =>
      new Map(
        Object.entries(loaded).flatMap(([id, asset]) =>
          asset.parts.map((part) => {
            const displacement = explosionOffset(
              part.midpoint,
              center,
              height,
              part.mesh.name,
              p.assets.findIndex((a) => a.id === id),
              p.assets.length,
              p.explodeOptions,
            );
            // Convert a vector (not a point) from model space to the mesh parent's space.
            displacement
              .applyMatrix4(part.inverseParent)
              .sub(new Vector3().applyMatrix4(part.inverseParent));
            return [part.mesh.uuid, displacement] as const;
          }),
        ),
      ),
    [loaded, center, height, p.assets, p.explodeOptions],
  );

  // Structural layout is separate from colors: moving the mouse no longer recomputes positions.
  useEffect(() => {
    Object.entries(loaded).forEach(([id, asset]) => {
      asset.group.visible = p.visible.includes(id);
      asset.parts.forEach(({ mesh, rest }) => {
        mesh.visible = !p.isolated || p.selectedMeshes.has(mesh.name);
        mesh.position
          .copy(rest)
          .addScaledVector(offsets.get(mesh.uuid)!, progress);
      });
    });
    invalidate();
  }, [
    loaded,
    p.visible,
    p.isolated,
    p.selectedMeshes,
    offsets,
    progress,
    invalidate,
  ]);

  useEffect(() => {
    Object.values(loaded).forEach(({ parts }) =>
      parts.forEach(({ mesh, color }) => {
        (mesh.material as MeshMatcapMaterial).color.set(
          p.selectedMeshes.has(mesh.name)
            ? "#f0b85e"
            : p.hovered === mesh.name
              ? "#f5d5a0"
              : color,
        );
      }),
    );
    invalidate();
  }, [loaded, p.selectedMeshes, p.hovered, invalidate]);

  useEffect(() => {
    if (group.current)
      return animateRotation(group.current.rotation, p.angle, invalidate);
  }, [p.angle, invalidate]);

  // Pull back gradually while separating parts so the expanded layout stays readable.
  // This is an overview fit, not a strict guarantee that every long mesh stays on screen.
  const fit =
    (Math.min(size.height / 2.95, size.width / 1.5) * p.zoom) /
    (1 + progress * 0.9 * (p.explodeOptions?.strength ?? 1));
  const fitRef = useRef(fit);
  fitRef.current = fit;
  useEffect(() => {
    camera.zoom = fit;
    camera.updateProjectionMatrix();
    invalidate();
  }, [camera, fit, invalidate]);
  useEffect(() => {
    controls.current?.reset();
    // Controls restores its own saved zoom; reapply the host's current framing.
    camera.zoom = fitRef.current;
    camera.updateProjectionMatrix();
    invalidate();
  }, [p.resetKey, camera, invalidate]);

  return (
    <>
      <group ref={group}>
        <group
          scale={scale}
          position={[-center.x * scale, -center.y * scale, -center.z * scale]}
        >
          {Object.entries(loaded).map(([id, asset]) => (
            <primitive
              key={id}
              object={asset.group}
              onPointerMove={(event: ThreeEvent<PointerEvent>) => {
                if (!asset.group.visible || !event.object.visible) return;
                event.stopPropagation();
                p.onHover(event.object.name);
              }}
              onPointerOut={(event: ThreeEvent<PointerEvent>) => {
                if (p.hovered === event.object.name) p.onHover(null);
              }}
              onClick={(event: ThreeEvent<MouseEvent>) => {
                // Dragging the camera must not accidentally select the mesh underneath it.
                if (
                  event.delta > 5 ||
                  !asset.group.visible ||
                  !event.object.visible
                )
                  return;
                event.stopPropagation();
                p.onPick(event.object.name);
              }}
            />
          ))}
        </group>
      </group>
      <OrbitControls
        ref={controls}
        enablePan={false}
        minZoom={20}
        maxZoom={1600}
        enableDamping={false}
        onStart={() => p.onHover(null)}
        onChange={() => invalidate()}
      />
    </>
  );
}
