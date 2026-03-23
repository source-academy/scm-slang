import type { Control, Stash } from "./types";
import type { Environment } from "./environment";

export interface CseContext {
  control: Control;
  stash: Stash;
  env: Environment;
}
