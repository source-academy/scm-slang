import { ControlItem } from "./control";
import {
  Expression,
  Atomic,
  Extended,
} from "../transpiler/types/nodes/scheme-node-types";

export function astToControl(expr: Expression): ControlItem[] {
 
  if (
    expr instanceof Atomic.NumericLiteral ||
    expr instanceof Atomic.BooleanLiteral ||
    expr instanceof Atomic.StringLiteral ||
    expr instanceof Atomic.Symbol ||
    expr instanceof Atomic.Identifier ||
    expr instanceof Atomic.Lambda ||
    expr instanceof Atomic.Application ||
    expr instanceof Atomic.Definition ||
    expr instanceof Atomic.Reassignment ||
    expr instanceof Atomic.Conditional ||
    expr instanceof Atomic.Sequence ||
    expr instanceof Atomic.Pair ||
    expr instanceof Atomic.Nil ||
    expr instanceof Atomic.Import ||
    expr instanceof Atomic.Export ||
    expr instanceof Atomic.Vector ||
    expr instanceof Atomic.DefineSyntax ||
    expr instanceof Atomic.SyntaxRules ||
    expr instanceof Extended.FunctionDefinition ||
    expr instanceof Extended.Let ||
    expr instanceof Extended.Cond ||
    expr instanceof Extended.List ||
    expr instanceof Extended.Begin ||
    expr instanceof Extended.Delay
  ) {
    return [expr];
  }
  console.log("DEBUG expr:", expr);
  throw new Error(`Unhandled expr type: ${expr.constructor.name}`);
}
