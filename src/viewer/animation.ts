import { animate } from "animejs";
import { Vector3, type Euler } from "three";
import type { ExplodeOptions } from "./types";

/** No React dependency: reuse in any Three.js host. Retarget by stopping the old tween. */
export function animateRotation(
  rotation: Euler,
  angle: number,
  invalidate: () => void,
) {
  const animation = animate(rotation, {
    y: angle,
    duration: matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 350,
    ease: "outCubic",
    onUpdate: invalidate,
  });
  return () => {
    animation.pause();
  };
}

/** Stable hash avoids random movement on rerenders and keeps reset reproducible. */
function hash(id: string) {
  let value = 2166136261;
  for (const character of id)
    value = Math.imul(value ^ character.charCodeAt(0), 16777619);
  return value >>> 0;
}

/**
 * Visualization layout, NOT a physical disassembly path or collision solver.
 * Radial spread is about 4.9x / 7.5x / 3.8x the former X/Y/Z displacement.
 * Group lanes and small piece offsets reveal structures with similar centers.
 * Return a displacement only; callers always add it to the immutable rest pose.
 */
export function explosionOffset(
  midpoint: Vector3,
  center: Vector3,
  height: number,
  meshId: string,
  groupIndex: number,
  groupCount: number,
  options: ExplodeOptions = {},
) {
  const phase = (groupIndex / Math.max(groupCount, 1)) * Math.PI * 2;
  const groupDistance = height * (options.groupSpacing ?? 0.36);
  const pieceDistance = height * (options.pieceSpacing ?? 0.065);
  const seed = hash(meshId);
  const jitter = (shift: number) => (((seed >>> shift) & 255) / 255 - 0.5) * 2;
  return new Vector3(
    (midpoint.x - center.x) * 2.2 +
      Math.cos(phase) * groupDistance +
      jitter(0) * pieceDistance,
    (midpoint.y - center.y) * 0.9 + jitter(8) * pieceDistance,
    (midpoint.z - center.z) * 2.5 +
      Math.sin(phase) * groupDistance +
      jitter(16) * pieceDistance,
  ).multiplyScalar(options.strength ?? 1);
}
