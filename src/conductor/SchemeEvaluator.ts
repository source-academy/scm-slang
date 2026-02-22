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
import { SchemeContext } from "./SchemeContext";

interface IOptions {
  isPrelude: boolean;
  envSteps: number;
  stepLimit: number;
}

const defaultContext = new SchemeContext();

const defaultOptions: IOptions = {
  isPrelude: false,
  envSteps: 100000,
  stepLimit: 100000,
};

export default class SchemeEvaluator extends BasicEvaluator {
  private context: SchemeContext;
  private options: IOptions;

  constructor(conductor: IRunnerPlugin) {
    super(conductor);
    this.context = defaultContext;
    this.options = defaultOptions;
  }

  async evaluateChunk(chunk: string): Promise<void> {
    try {
      // Use SchemeContext to evaluate the chunk
      const result = await this.context.evaluateChunk(chunk);

      const output = this.formatResult(result);
      // Cast to access conductor (inherited from BasicEvaluator)
      (this as any).conductor.sendOutput(output);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      (this as any).conductor.sendOutput(`Error: ${message}`);
    }
  }

  private formatResult(result: any): string {
    // Handle Result type if it comes from a runner
    if (result && typeof result === "object" && result.status === "finished") {
      const finished = result as Finished;
      return finished.representation.toString(finished.value);
    } else if (
      result &&
      typeof result === "object" &&
      result.status === "suspended-cse-eval"
    ) {
      return "[Evaluation paused]";
    }

    // Handle raw values (from SchemeContext)
    if (result === undefined) {
      return "undefined";
    }
    if (result === null) {
      return "null";
    }
    if (typeof result === "string") {
      return `"${result}"`;
    }
    if (typeof result === "number") {
      return String(result);
    }
    if (typeof result === "boolean") {
      return result ? "#t" : "#f";
    }
    if (Array.isArray(result)) {
      const elements = result.map(v => this.formatResultValue(v)).join(" ");
      return `(${elements})`;
    }

    return String(result);
  }

  private formatResultValue(value: any): string {
    if (value === null) return "null";
    if (typeof value === "string") return `"${value}"`;
    if (typeof value === "number") return String(value);
    if (typeof value === "boolean") return value ? "#t" : "#f";
    if (Array.isArray(value)) {
      const elements = value.map(v => this.formatResultValue(v)).join(" ");
      return `(${elements})`;
    }
    return String(value);
  }
}
