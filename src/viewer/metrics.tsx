import { useEffect } from "react";
import { useThree } from "@react-three/fiber";

type Sample = {
  cpuSubmitMs: number;
  intervalMs: number;
  calls: number;
  triangles: number;
  gpuMs: number | null;
};
type Capture = {
  samples: Sample[];
  renderer: string;
  timerSupported: boolean;
  geometryBytes: number;
  width: number;
  height: number;
  dpr: number;
  msaaSamples: number;
};
declare global {
  interface Window {
    /** Developer-only bridge enabled with ?profile; absent in ordinary sessions. */
    viewerProfile?: { capture: (frames?: number) => Promise<Capture> };
  }
}

/**
 * GPU queries measure actual render execution ONLY when supported and not disjoint.
 * CPU submission time is deliberately separate; neither is total application latency.
 * No gl.finish/readPixels: synchronous GPU stalls would distort the workload.
 */
export function RenderMetrics() {
  const { gl: renderer, invalidate, scene } = useThree();
  useEffect(() => {
    const context = renderer.getContext() as WebGL2RenderingContext;
    const timer = context.getExtension("EXT_disjoint_timer_query_webgl2");
    const debug = context.getExtension("WEBGL_debug_renderer_info");
    const original = renderer.render.bind(renderer);
    let state: {
      result: Capture;
      remaining: number;
      resolve: (result: Capture) => void;
      last: number;
    } | null = null;
    let pending: { query: WebGLQuery; sample: Sample } | null = null;
    let frame = 0;
    let finishTimeout: ReturnType<typeof setTimeout> | undefined;
    const poll = () => {
      if (
        pending &&
        context.getQueryParameter(pending.query, context.QUERY_RESULT_AVAILABLE)
      ) {
        if (!context.getParameter(timer.GPU_DISJOINT_EXT))
          pending.sample.gpuMs =
            context.getQueryParameter(pending.query, context.QUERY_RESULT) /
            1e6;
        context.deleteQuery(pending.query);
        pending = null;
      }
    };
    const finish = () => {
      if (!state) return;
      poll();
      if (pending) {
        // Bound waiting if a driver never returns a query result.
        context.deleteQuery(pending.query);
        pending = null;
      }
      const completed = state;
      state = null;
      completed.resolve(completed.result);
    };
    renderer.render = (...args) => {
      if (!state || state.remaining <= 0) {
        original(...args);
        return;
      }
      poll();
      const now = performance.now();
      const sample: Sample = {
        cpuSubmitMs: 0,
        intervalMs: now - state.last,
        calls: 0,
        triangles: 0,
        gpuMs: null,
      };
      state.last = now;
      const query = timer && !pending ? context.createQuery() : null;
      if (query) context.beginQuery(timer.TIME_ELAPSED_EXT, query);
      const start = performance.now();
      original(...args);
      sample.cpuSubmitMs = performance.now() - start;
      if (query) {
        context.endQuery(timer.TIME_ELAPSED_EXT);
        pending = { query, sample };
      }
      sample.calls = renderer.info.render.calls;
      sample.triangles = renderer.info.render.triangles;
      state.result.samples.push(sample);
      if (--state.remaining > 0)
        frame = requestAnimationFrame(() => invalidate());
      else finishTimeout = setTimeout(finish, 250);
    };
    window.viewerProfile = {
      capture: (frames = 90) =>
        new Promise((resolve, reject) => {
          if (state) {
            reject(new Error("Capture already running"));
            return;
          }
          const seen = new Set<unknown>();
          let geometryBytes = 0;
          scene.traverse((object) => {
            const geometry = (
              object as unknown as {
                geometry?: {
                  attributes: Record<string, { array: ArrayBufferView }>;
                  index?: { array: ArrayBufferView };
                };
              }
            ).geometry;
            if (!geometry || seen.has(geometry)) return;
            seen.add(geometry);
            Object.values(geometry.attributes).forEach((attribute) => {
              geometryBytes += attribute.array.byteLength;
            });
            geometryBytes += geometry.index?.array.byteLength ?? 0;
          });
          state = {
            remaining: frames,
            resolve,
            last: performance.now(),
            result: {
              samples: [],
              timerSupported: Boolean(timer),
              geometryBytes,
              renderer: debug
                ? context.getParameter(debug.UNMASKED_RENDERER_WEBGL)
                : context.getParameter(context.RENDERER),
              width: renderer.domElement.width,
              height: renderer.domElement.height,
              dpr: renderer.getPixelRatio(),
              msaaSamples: context.getParameter(context.SAMPLES),
            },
          };
          invalidate();
        }),
    };
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(finishTimeout);
      finish();
      renderer.render = original;
      delete window.viewerProfile;
    };
  }, [renderer, invalidate, scene]);
  return null;
}
