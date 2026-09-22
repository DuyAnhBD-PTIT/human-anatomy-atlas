import { DataTexture, SRGBColorSpace } from "three";

/** Baked sphere shading shared by all meshes: no light, shadow or texture fetches. */
export function createMatcap() {
  const size = 256;
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = (x / (size - 1)) * 2 - 1;
      const ny = (y / (size - 1)) * 2 - 1;
      const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
      const key = Math.max(0, nx * -0.4 + ny * 0.55 + nz * 0.73);
      const fill = Math.max(0, nx * 0.7 + ny * 0.1 + nz * 0.5);
      const shade = Math.min(
        1,
        0.42 + 0.48 * key + 0.1 * fill + 0.06 * key ** 24,
      );
      const i = (y * size + x) * 4;
      data[i] = data[i + 1] = data[i + 2] = Math.round(shade * 255);
      data[i + 3] = 255;
    }
  }
  const texture = new DataTexture(data, size, size);
  texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}
