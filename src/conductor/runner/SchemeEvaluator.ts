import { BasicEvaluator } from "./BasicEvaluator";
import { IRunnerPlugin } from "./types";
import { parseSchemeSimple } from "../../CSE-machine/simple-parser";
import { evaluate, Context } from "../../CSE-machine/interpreter";
import {
  createProgramEnvironment,
  Environment,
} from "../../CSE-machine/environment";
import { Stash } from "../../CSE-machine/stash";
import { Control } from "../../CSE-machine/control";
import { Value } from "../../CSE-machine/stash";
import { ConductorError } from "../../common/errors/ConductorError";

export class SchemeEvaluator extends BasicEvaluator {
  private context: Context;
  private environment: Environment;

  constructor(conductor: IRunnerPlugin) {
    super(conductor);
    this.environment = createProgramEnvironment();
    this.context = {
      control: new Control(),
      stash: new Stash(),
      environment: this.environment,
      runtime: {
        isRunning: true,
      },
    };
  }

  async evaluateChunk(chunk: string): Promise<void> {
    try {
      // Parse the Scheme code using simple parser
      const expressions = parseSchemeSimple(chunk);

      // Reset control and stash but keep the same environment
      this.context.control = new Control();
      this.context.stash = new Stash();
      this.context.runtime.isRunning = true;

      // Evaluate the expressions
      const result = evaluate(chunk, expressions, this.context);

      // Send output to the conductor (like py-slang)
      if (result.type === "error") {
        this.conductor.sendOutput(`Error: ${result.message}`);
      } else {
        // Send the result as output
        this.conductor.sendOutput(this.valueToString(result));
      }
    } catch (error: any) {
      this.conductor.sendOutput(
        `Error: ${error instanceof Error ? error.message : error}`
      );
    }
  }

  private valueToString(value: Value): string {
    if (value.type === "number") {
      return value.value.toString();
    } else if (value.type === "complex") {
      return value.value.toString();
    } else if (value.type === "string") {
      return value.value;
    } else if (value.type === "boolean") {
      return value.value ? "#t" : "#f";
    } else if (value.type === "symbol") {
      return value.value;
    } else if (value.type === "nil") {
      return "()";
    } else if (value.type === "void") {
      return ""; // Return empty string for void values (define statements)
    } else if (value.type === "pair") {
      return `(${this.valueToString(value.car)} . ${this.valueToString(value.cdr)})`;
    } else if (value.type === "list") {
      return `(${value.elements.map((el: Value) => this.valueToString(el)).join(" ")})`;
    } else if (value.type === "vector") {
      return `#(${value.elements.map((el: Value) => this.valueToString(el)).join(" ")})`;
    } else if (value.type === "closure") {
      return `#<procedure>`;
    } else if (value.type === "primitive") {
      return `#<primitive:${value.name}>`;
    } else if (value.type === "error") {
      return `Error: ${value.message}`;
    } else {
      return String(value);
    }
  }
}
