import * as es from "estree";
import { schemeParse } from "../transpiler";
import { SchemeInterpreter } from "./SchemeInterpreter";

/**
 * SchemeContext manages evaluation state for Scheme code.
 * Maintains state across multiple chunks (REPL sessions).
 *
 * Architecture mirrors py-slang:
 * - Chunk (code string) → Parse → ESTree → Evaluate → Result
 * - Context persists variables across chunks
 */
export class SchemeContext {
  private interpreter: SchemeInterpreter;

  constructor() {
    this.interpreter = new SchemeInterpreter();
  }

  /**
   * Evaluates a Scheme code chunk
   * @param chunk The Scheme source code to evaluate
   * @returns The result of evaluation
   */
  async evaluateChunk(chunk: string): Promise<any> {
    // Step 1: Parse Scheme code to ESTree Program
    const program = schemeParse(chunk);

    // Step 2: Evaluate the ESTree with the interpreter
    const result = this.interpreter.evaluate(program);

    // Step 3: Return result (SchemeEvaluator will format it)
    return result;
  }
}
