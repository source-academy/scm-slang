import * as es from "estree";
import { truthy } from "../stdlib/base";
import type { CseContext } from "./context";
import {
  createEnvironment,
  createGlobalEnvironment,
  defineVariable,
  lookupVariable,
  setVariable,
} from "./environment";
import { expandNode } from "./instrCreator";
import type { Closure, ControlItem, Instruction } from "./types";
import { isInstruction } from "./types";

function isClosure(value: any): value is Closure {
  return value && typeof value === "object" && value.tag === "closure";
}

function applyFunction(func: any, args: any[]): any {
  if (typeof func === "function") {
    return func(...args);
  }
  if (func && typeof func === "object" && (func as any).__call__) {
    return (func as any).__call__(...args);
  }
  throw new Error(`Not a function: ${func}`);
}

function evaluateInNewEnv(
  node: es.BlockStatement | es.Expression,
  env: ReturnType<typeof createEnvironment>
): any {
  const context: CseContext = {
    control: [node],
    stash: [],
    env,
  };
  return runContext(context);
}

function executeInstruction(context: CseContext, instr: Instruction): void {
  switch (instr.tag) {
    case "apply": {
      const args: any[] = [];
      for (let i = 0; i < instr.argCount; i++) {
        args.unshift(context.stash.pop());
      }
      const callee = context.stash.pop();

      const spreadAdjusted = args.map((arg, index) => {
        if (instr.spreadMask[index]) {
          return Array.isArray(arg) ? arg : [arg];
        }
        return arg;
      });

      let finalArgs = spreadAdjusted;
      if (
        instr.argCount === 1 &&
        instr.spreadMask[0] &&
        Array.isArray(spreadAdjusted[0])
      ) {
        finalArgs = [...spreadAdjusted[0]];
      }

      if (isClosure(callee)) {
        const funcEnv = createEnvironment(callee.env);
        for (let i = 0; i < callee.params.length; i++) {
          const param = callee.params[i];
          if (param.type === "Identifier") {
            defineVariable(param.name, finalArgs[i], funcEnv);
          } else if (param.type === "RestElement") {
            const restName = (param.argument as es.Identifier).name;
            defineVariable(restName, finalArgs.slice(i), funcEnv);
            break;
          }
        }
        const result = evaluateInNewEnv(callee.body, funcEnv);
        context.stash.push(result);
        return;
      }

      context.stash.push(applyFunction(callee, finalArgs));
      return;
    }

    case "and": {
      const value = context.stash.pop();
      if (!truthy(value)) {
        context.stash.push(false);
        return;
      }
      if (instr.operands.length === 0) {
        context.stash.push(value);
        return;
      }
      const [next, ...rest] = instr.operands;
      context.control.push({ tag: "and", operands: rest });
      context.control.push(next);
      return;
    }

    case "or": {
      const value = context.stash.pop();
      if (truthy(value)) {
        context.stash.push(value);
        return;
      }
      if (instr.operands.length === 0) {
        context.stash.push(false);
        return;
      }
      const [next, ...rest] = instr.operands;
      context.control.push({ tag: "or", operands: rest });
      context.control.push(next);
      return;
    }

    case "define": {
      const value = context.stash.pop();
      defineVariable(instr.name, value, context.env);
      context.stash.push(undefined);
      return;
    }

    case "assign": {
      const value = context.stash.pop();
      const result = setVariable(instr.name, value, context.env);
      context.stash.push(result);
      return;
    }

    case "branch": {
      const test = context.stash.pop();
      if (truthy(test)) {
        context.control.push(instr.consequent);
      } else if (instr.alternate) {
        context.control.push(instr.alternate);
      } else {
        context.stash.push(undefined);
      }
      return;
    }

    case "build-array": {
      const values: any[] = [];
      for (let i = 0; i < instr.spreadMask.length; i++) {
        values.unshift(context.stash.pop());
      }
      const result = values.map((value, index) => {
        if (instr.spreadMask[index]) {
          return Array.isArray(value) ? value : [value];
        }
        return value;
      });
      context.stash.push(result);
      return;
    }

    case "push":
      context.stash.push(instr.value);
      return;

    case "pop":
      context.stash.pop();
      return;

    case "return": {
      const value = context.stash.pop();
      context.stash.push(value);
      context.control.length = 0;
      return;
    }
  }
}

function dispatchNode(context: CseContext, node: es.Node): void {
  if (expandNode(context.control, node)) {
    return;
  }

  switch (node.type) {
    case "Identifier":
      context.stash.push(lookupVariable(node.name, context.env));
      return;

    case "Literal":
      context.stash.push((node as es.Literal).value);
      return;

    case "ArrowFunctionExpression": {
      const arrow = node as es.ArrowFunctionExpression;
      const closure: Closure = {
        tag: "closure",
        params: arrow.params,
        body: arrow.body,
        env: context.env,
      };
      context.stash.push(closure);
      return;
    }

    default:
      throw new Error(`Unsupported node type: ${node.type}`);
  }
}

function runContext(context: CseContext): any {
  while (context.control.length > 0) {
    const item = context.control.pop() as ControlItem;
    if (isInstruction(item)) {
      executeInstruction(context, item);
    } else {
      dispatchNode(context, item as es.Node);
    }
  }

  return context.stash.pop();
}

export function runWithContext(program: es.Program, context: CseContext): any {
  context.control = [program];
  context.stash = [];
  return runContext(context);
}

export function evaluate(
  program: es.Program,
  output?: (text: string) => void
): any {
  const context: CseContext = {
    control: [],
    stash: [],
    env: createGlobalEnvironment(output),
  };
  return runWithContext(program, context);
}
