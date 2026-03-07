import { SchemeInterpreter } from "./SchemeInterpreter";
import { schemeParse } from "../transpiler";

function evaluate(code: string) {
  try {
    const programAst = schemeParse(code);
    const interpreter = new SchemeInterpreter();
    const result = interpreter.evaluate(programAst);
    return { status: "finished", value: result };
  } catch (e) {
    // Print error for fast debugging
    return { status: "error", error: e instanceof Error ? e.stack : String(e) };
  }
}

declare const self: any;
self.evaluate = evaluate;
