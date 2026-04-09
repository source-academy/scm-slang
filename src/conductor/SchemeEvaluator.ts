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
import { RunnerStatus } from "@sourceacademy/conductor/types";
// @ts-ignore - same reason
import type { IRunnerPlugin } from "@sourceacademy/conductor/runner/types";
import type { Finished, Result } from "../types.js";
import type { CseContext } from "../cse-machine/context.js";
import { runInContext } from "../runner/schemeRunner.js";

interface IOptions {
  isPrelude: boolean;
  envSteps: number;
  stepLimit: number;
}

const defaultOptions: IOptions = {
  isPrelude: false,
  envSteps: 100000,
  stepLimit: 100000,
};

export default class SchemeEvaluator extends BasicEvaluator {
  private context: CseContext | undefined;
  private options: IOptions;
  private static handlersRegistered = false;

  constructor(conductor: IRunnerPlugin) {
    super(conductor);
    this.context = undefined;
    this.options = defaultOptions;

    if (!SchemeEvaluator.handlersRegistered && typeof self !== "undefined") {
      SchemeEvaluator.handlersRegistered = true;
      const handler = (event: any) => {
        const error = event?.reason ?? event?.error ?? event;
        const name = error instanceof Error ? error.name : "Error";
        const message = error instanceof Error ? error.message : String(error);
        (this as any).conductor.sendError({ name, message });
      };

      self.addEventListener("unhandledrejection", handler);
      self.addEventListener("error", handler);
    }
  }

  async evaluateChunk(chunk: string): Promise<void> {
    try {
      (this as any).conductor.updateStatus(RunnerStatus.RUNNING, true);
      const result = await runInContext(chunk, this.context, {
        ...this.options,
        output: (text: string) => {
          (this as any).conductor.sendOutput(text);
        },
      });
      this.context = result.context as CseContext;

      // Cast to access conductor (inherited from BasicEvaluator)
      if (result && typeof result === "object" && result.status === "error") {
        const error = (result as any).error ?? result;
        const name = error instanceof Error ? error.name : "Error";
        const message = error instanceof Error ? error.message : String(error);
        (this as any).conductor.sendError({ name, message });
        return;
      }

      if (
        result &&
        typeof result === "object" &&
        result.status === "finished"
      ) {
        const finished = result as Finished;
        const display = finished.representation.toString(finished.value);
        (this as any).conductor.sendResult(display);
      } else {
        (this as any).conductor.sendResult(this.formatResult(result));
      }
    } catch (error) {
      const name = error instanceof Error ? error.name : "Error";
      const message = error instanceof Error ? error.message : String(error);
      (this as any).conductor.sendError({ name, message });
    } finally {
      (this as any).conductor.updateStatus(RunnerStatus.RUNNING, false);
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
      return "[suspended]";
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
