// Single source for the selectable accent profiles: the options page and
// the popup both render their pickers from this list, so adding a profile
// here (plus its .scss and the prepare-css themeMap entry) is all it takes.

export type AccentId =
  | "red"
  | "blue"
  | "green"
  | "purple"
  | "teal"
  | "orange"
  | "pink";

export type AccentProfile = {
  id: AccentId;
  label: string;
  /** Representative accent color for swatches. */
  swatch: string;
};

export const accentProfiles: AccentProfile[] = [
  { id: "red", label: "Red", swatch: "#d55858" },
  { id: "blue", label: "Blue", swatch: "#5998d6" },
  { id: "green", label: "Green", swatch: "#58d55c" },
  { id: "purple", label: "Purple", swatch: "#9a58d6" },
  { id: "teal", label: "Teal", swatch: "#58c2b4" },
  { id: "orange", label: "Orange", swatch: "#d69158" },
  { id: "pink", label: "Pink", swatch: "#d658a8" },
];

export function isAccentId(value: unknown): value is AccentId {
  return accentProfiles.some((profile) => profile.id === value);
}
