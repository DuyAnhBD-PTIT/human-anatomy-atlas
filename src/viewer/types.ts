/** One independently loadable GLB group. Mesh names must be stable and unique. */
export type ModelAsset = {
  id: string;
  name: string;
  url: string;
  color: string;
  count?: number;
};
/** Bounds of ALL assets in the SAME coordinate system, before display normalization. */
export type ModelBounds = { min: number[]; max: number[] };
export type ExplodeOptions = {
  /** Overall distance multiplier; 1 is the new expanded layout. */
  strength?: number;
  /** Separation between asset groups, as a fraction of model height. */
  groupSpacing?: number;
  /** Small deterministic per-piece separation; useful for overlapping centers. */
  pieceSpacing?: number;
};
/** Controlled API: the host owns state and can supply any business-domain catalog. */
export type ModelViewerProps = {
  assets: ModelAsset[];
  bounds: ModelBounds;
  visible: string[];
  selectedMeshes: Set<string>;
  isolated: boolean;
  explode: number;
  angle: number;
  zoom: number;
  resetKey: number;
  retry: number;
  hovered: string | null;
  explodeOptions?: ExplodeOptions;
  /** Limit framebuffer cost independently of mesh detail. Default 1.5. */
  maxDpr?: number;
  onPick: (meshId: string) => void;
  onHover: (meshId: string | null) => void;
  onMiss?: () => void;
  /** Signed loading delta, balanced on success, failure and unmount. */
  onLoading: (delta: number) => void;
  onError: (message: string) => void;
};
