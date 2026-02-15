/**
 * Orchestrates the Scheme evaluation pipeline:
 *   source code → schemeParse() → ESTree AST
 *              → evaluate() → CSE Machine execution
 *              → Result (Finished | Error | SuspendedCseEval)
 * 
 * TODO: Implement after Phase 1 is complete
 */

export interface IOptions {
  isPrelude: boolean;
  envSteps: number;
  stepLimit: number;
}

export async function runInContext(
  code: string,
  context: any,
  options: Partial<IOptions> = {}
): Promise<any> {
  throw new Error("Phase 2: Not yet implemented");
}