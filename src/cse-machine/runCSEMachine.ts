import type * as es from "estree";
import type { CseContext } from "./context";
import { createGlobalEnvironment } from "./environment";
import { runWithContext } from "./interpreter";

export function runCSEMachine(
  program: es.Program,
  existingContext?: CseContext,
  output?: (text: string) => void
): {
  value: any;
  context: CseContext;
} {
  const context: CseContext =
    existingContext ??
    ({
      control: [],
      stash: [],
      env: createGlobalEnvironment(output),
    } as CseContext);

  const value = runWithContext(program, context);
  return { value, context };
}
