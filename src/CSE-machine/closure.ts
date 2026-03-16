// closure.ts
import { Expression } from "../transpiler/types/nodes/scheme-node-types";
import { Environment } from "./environment";

export class Closure {
  readonly type = "Closure";
  readonly params: string[];
  readonly body: Expression[];
  readonly env: Environment;
  readonly declaredName?: string;
  readonly srcNode?: Expression; // AST node for debugging

  constructor(
    params: string[],
    body: Expression[],
    env: Environment,
    declaredName?: string,
    srcNode?: Expression
  ) {
    this.params = params;
    this.body = body;
    this.env = env;
    this.declaredName = declaredName;
    this.srcNode = srcNode;
  }
}
