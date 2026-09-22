import { useState } from "react";
import { ModelViewer, type ModelAsset, type ModelBounds } from "../viewer";

/** Minimal host example: no anatomy catalog, app CSS, backend or global state. */
export function EmbeddedModel({
  assets,
  bounds,
}: {
  assets: ModelAsset[];
  bounds: ModelBounds;
}) {
  const [visible] = useState(() => assets.map((asset) => asset.id));
  const [selected, setSelected] = useState(new Set<string>());
  const [hovered, setHovered] = useState<string | null>(null);
  const [explode, setExplode] = useState(0);
  const [angle, setAngle] = useState(0);
  const [isolated, setIsolated] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [loading, setLoading] = useState(0);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  return (
    <section>
      <div style={{ height: 640, width: "100%", background: "#f7f5ef" }}>
        <ModelViewer
          assets={assets}
          bounds={bounds}
          visible={visible}
          selectedMeshes={selected}
          hovered={hovered}
          isolated={isolated}
          explode={explode}
          angle={angle}
          zoom={1}
          resetKey={resetKey}
          retry={retry}
          onPick={(id) => setSelected(new Set([id]))}
          onHover={setHovered}
          onMiss={() => {
            setSelected(new Set());
            setIsolated(false);
          }}
          onLoading={(delta) => setLoading((value) => value + delta)}
          onError={setError}
          explodeOptions={{
            strength: 1,
            groupSpacing: 0.36,
            pieceSpacing: 0.065,
          }}
        />
      </div>
      <button onClick={() => setAngle((value) => value - Math.PI / 6)}>
        Rotate left
      </button>
      <button onClick={() => setAngle((value) => value + Math.PI / 6)}>
        Rotate right
      </button>
      <label>
        Separate parts{" "}
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={explode}
          onChange={(event) => setExplode(Number(event.target.value))}
        />
      </label>
      <button
        disabled={!selected.size}
        onClick={() => setIsolated((value) => !value)}
      >
        Toggle isolation
      </button>
      <button
        onClick={() => {
          setSelected(new Set());
          setHovered(null);
          setIsolated(false);
          setExplode(0);
          setAngle(0);
          setResetKey((value) => value + 1);
        }}
      >
        Reset
      </button>
      {loading > 0 && <p role="status">Loading {loading} groups…</p>}
      {error && (
        <p role="alert">
          {error}{" "}
          <button
            onClick={() => {
              setError("");
              setRetry((value) => value + 1);
            }}
          >
            Retry
          </button>
        </p>
      )}
    </section>
  );
}
