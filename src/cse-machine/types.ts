import * as es from "estree";
import type { Environment } from "./environment";

export type ControlItem = es.Node | Instruction;
export type Control = ControlItem[];
export type Stash = any[];

export interface Closure {
  tag: "closure";
  params: es.Pattern[];
  body: es.BlockStatement | es.Expression;
  env: Environment;
}

export type Instruction =
  | { tag: "apply"; argCount: number; spreadMask: boolean[] }
  | { tag: "and"; operands: es.Expression[] }
  | { tag: "or"; operands: es.Expression[] }
  | { tag: "define"; name: string }
  | { tag: "assign"; name: string }
  | {
      tag: "branch";
      consequent: es.Expression;
      alternate?: es.Expression | null;
    }
  | { tag: "build-array"; spreadMask: boolean[] }
  | { tag: "push"; value: any }
  | { tag: "pop" }
  | { tag: "return" };

export function isInstruction(item: ControlItem): item is Instruction {
  return typeof item === "object" && item !== null && "tag" in item;
}
