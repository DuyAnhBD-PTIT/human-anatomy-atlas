/** BodyParts3D metadata belongs to the host app, not the reusable renderer. */
export type System = {
  id: string;
  name: string;
  color: string;
  count: number;
  url: string;
};
export type Concept = {
  id: string;
  en: string;
  vi: string | null;
  la: string | null;
  meshIds: string[];
  systems: string[];
  translationStatus?: string;
};
export type Catalog = {
  source: string;
  systems: System[];
  concepts: Concept[];
  meshes: { id: string; conceptId: string; system: string }[];
  bounds: { min: number[]; max: number[] };
  version: string;
};
