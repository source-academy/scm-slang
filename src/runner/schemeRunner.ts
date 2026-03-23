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

export interface IOptions {
  isPrelude: boolean;
  envSteps: number;
  stepLimit: number;
  chapter: number;
}

function isSchemeNumber(value: any): boolean {
  return (
    value &&
    typeof value === "object" &&
    typeof value.coerce === "function" &&
    "numberType" in value
  );
}

function isPair(value: any): boolean {
  return Array.isArray(value) && (value as any).pair === true;
}

function formatPair(pair: any): string {
  const parts: string[] = [];
  let current = pair;

  while (isPair(current)) {
    parts.push(formatValue(current[0]));
    current = current[1];
  }

  if (current === null) {
    return `(${parts.join(" ")})`;
  }

  return `(${parts.join(" ")} . ${formatValue(current)})`;
}

function formatValue(value: any): string {
  if (value === undefined) return "undefined";
  if (value === null) return "()";
  if (isSchemeNumber(value)) return String(value.coerce());
  if (typeof value === "boolean") return value ? "#t" : "#f";
  if (typeof value === "string") return `"${value}"`;
  if (typeof value === "number") return String(value);
  if (typeof value === "function") return "#<procedure>";
  if (value && typeof value === "object" && typeof value.sym === "string") {
    return value.sym;
  }
  if (isPair(value)) {
    return formatPair(value);
  }
  if (Array.isArray(value)) {
    const elements = value.map(v => formatValue(v)).join(" ");
    return `#(${elements})`;
  }
  if (value && typeof value === "object" && (value as any).__call__) {
    return "#<procedure>";
  }
  return String(value);
}

export async function runInContext(
  code: string,
  context: CseContext | undefined,
  options: Partial<IOptions> = {}
): Promise<Result> {
  const chapter = options.chapter ?? 3;
  const program = schemeParse(code, chapter);
  const { value, context: updatedContext } = runCSEMachine(program, context);

  const finished: Finished = {
    status: "finished",
    context: updatedContext,
    value,
    representation: new Representation(formatValue(value)),
  };

  return finished;
}
