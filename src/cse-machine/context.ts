import type { Control, Stash } from "./types.js";
import type { Environment } from "./environment.js";

export interface CseContext {
  control: Control;
  stash: Stash;
  env: Environment;
}
