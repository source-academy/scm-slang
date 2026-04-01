/**
 * Orchestrates the Scheme evaluation pipeline:
 *   source code → schemeParse() → ESTree AST
 *              → evaluate() → CSE Machine execution
 *              → Result (Finished | Error | SuspendedCseEval)
 */

import { schemeParse } from "../transpiler";
import { runCSEMachine } from "../cse-machine/runCSEMachine";
import { Representation } from "../types";
import type { Finished, Result } from "../types";
import type { CseContext } from "../cse-machine/context";
import { formatSchemeValue } from "../utils/scheme-format";

export interface IOptions {
  isPrelude: boolean;
  envSteps: number;
  stepLimit: number;
  chapter: number;
  output?: (text: string) => void;
}

export async function runInContext(
  code: string,
  context: CseContext | undefined,
  options: Partial<IOptions> = {}
): Promise<Result> {
  const chapter = options.chapter ?? 3;
  const program = schemeParse(code, chapter);
  const { value, context: updatedContext } = runCSEMachine(
    program,
    context,
    options.output
  );

  const finished: Finished = {
    status: "finished",
    context: updatedContext,
    value,
    representation: new Representation(v => formatSchemeValue(v)),
  };

  return finished;
}
