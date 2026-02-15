/**
 * SchemeEvaluator: Conductor integration for scm-slang
 * 
 * This class bridges the Source Academy conductor interface with scm-slang's
 * internal evaluation pipeline.
 * 
 * Adapted from py-slang's PyEvaluator.
 */

// @ts-ignore - conductor is ESM, we're CommonJS; dynamic import in src/index.ts handles this
import { BasicEvaluator } from "@sourceacademy/conductor/runner";
// @ts-ignore - same reason
import type { IRunnerPlugin } from "@sourceacademy/conductor/runner/types";
import type { Finished, Result } from "../types";

interface IOptions {
  isPrelude: boolean;
  envSteps: number;
  stepLimit: number;
}

async function runInContext(
  chunk: string,
  context: any,
  options: IOptions
): Promise<Result> {
  throw new Error(
    "runInContext not yet implemented. See Phase 2: Runner Orchestrator"
  );
}

const defaultContext = {};

const defaultOptions: IOptions = {
  isPrelude: false,
  envSteps: 100000,
  stepLimit: 100000,
};

export default class SchemeEvaluator extends BasicEvaluator {
  private context: any;
  private options: IOptions;

  constructor(conductor: IRunnerPlugin) {
    super(conductor);
    this.context = defaultContext;
    this.options = defaultOptions;
  }

    async evaluateChunk(chunk: string): Promise<void> {
    try {
      const result = await runInContext(
        chunk,
        this.context,
        this.options
      );

      const output = this.formatResult(result);
      // Cast to access conductor (inherited from BasicEvaluator)
      (this as any).conductor.sendOutput(output);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      (this as any).conductor.sendOutput(`Error: ${message}`);
    }
  }

  private formatResult(result: Result): string {
    if (result.status === "finished") {
      const finished = result as Finished;
      return finished.representation.toString(finished.value);
    } else if (result.status === "suspended-cse-eval") {
      return "[Evaluation paused]";
    }
    return "[Unknown result status]";
  }
}