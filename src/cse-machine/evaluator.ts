import * as stdlib from "../stdlib/base";
import type { Environment } from "./environment";
import {
  createEnvironment,
  defineVariable,
  lookupVariable,
  setVariable,
} from "./environment";

function isPairList(value: any): boolean {
  return Array.isArray(value) && (value as any).pair === true;
}

function pairToArray(pair: any): any[] {
  const result: any[] = [];
  let current = pair;

  while (current !== null && isPairList(current)) {
    result.push(current[0]);
    current = current[1];
  }

  if (current !== null) {
    result.push(current);
  }

  return result;
}

function extractParamName(param: any): string {
  if (param === null || param === undefined) {
    throw new Error("Invalid parameter");
  }
  if (typeof param === "string") {
    return param;
  }
  if (param.sym !== undefined) {
    return param.sym;
  }
  return String(param);
}

function evalDefine(operands: any[], env: Environment): undefined {
  if (operands.length < 2) {
    throw new Error("define: insufficient arguments");
  }

  const nameOrSignature = operands[0];
  const bodyExprs = operands.slice(1);

  if (Array.isArray(nameOrSignature) || isPairList(nameOrSignature)) {
    let flatSignature = nameOrSignature;
    if (isPairList(nameOrSignature)) {
      flatSignature = pairToArray(nameOrSignature);
    }

    if (!Array.isArray(flatSignature)) {
      flatSignature = [flatSignature];
    }

    const [funcName, ...params] = flatSignature;
    const funcNameStr = extractParamName(funcName);

    const flatParams = params.map((param: any) => {
      if (isPairList(param)) {
        return pairToArray(param)[0];
      }
      return param;
    });

    const schemeFunc = (...args: any[]) => {
      const funcEnv = createEnvironment(env);

      for (let i = 0; i < flatParams.length; i++) {
        const paramName = extractParamName(flatParams[i]);
        defineVariable(paramName, args[i], funcEnv);
      }

      let result: any = undefined;
      for (const bodyExpr of bodyExprs) {
        result = evalSchemeExpression(bodyExpr, funcEnv);
      }
      return result;
    };

    defineVariable(funcNameStr, schemeFunc, env);
    return undefined;
  }

  const nameStr = extractParamName(nameOrSignature);
  const evaluatedValue = evalSchemeExpression(bodyExprs[0], env);
  defineVariable(nameStr, evaluatedValue, env);
  return undefined;
}

function evalLambda(operands: any[], env: Environment): Function {
  if (operands.length < 2) {
    throw new Error("lambda: insufficient arguments");
  }

  const params = operands[0];
  const bodyExprs = operands.slice(1);

  let flatParams: any = params;
  if (isPairList(params)) {
    flatParams = pairToArray(params);
  }

  return (...args: any[]) => {
    const funcEnv = createEnvironment(env);

    if (flatParams === null) {
      // no params
    } else if (Array.isArray(flatParams)) {
      for (let i = 0; i < flatParams.length; i++) {
        const paramName = extractParamName(flatParams[i]);
        defineVariable(paramName, args[i], funcEnv);
      }
    } else {
      const restName = extractParamName(flatParams);
      defineVariable(restName, stdlib.list(...args), funcEnv);
    }

    let result: any = undefined;
    for (const bodyExpr of bodyExprs) {
      result = evalSchemeExpression(bodyExpr, funcEnv);
    }
    return result;
  };
}

function evalLet(operands: any[], env: Environment): any {
  const bindings = operands[0];
  const bodyExprs = operands.slice(1);
  const bindingArray = isPairList(bindings) ? pairToArray(bindings) : bindings;

  const newEnv = createEnvironment(env);

  if (Array.isArray(bindingArray)) {
    for (const binding of bindingArray) {
      const pair = isPairList(binding) ? pairToArray(binding) : binding;
      if (!Array.isArray(pair) || pair.length < 2) {
        throw new Error("let: invalid binding");
      }
      const name = extractParamName(pair[0]);
      const value = evalSchemeExpression(pair[1], env);
      defineVariable(name, value, newEnv);
    }
  }

  let result: any = undefined;
  for (const bodyExpr of bodyExprs) {
    result = evalSchemeExpression(bodyExpr, newEnv);
  }
  return result;
}

function evalCond(operands: any[], env: Environment): any {
  for (const clause of operands) {
    const flatClause = isPairList(clause) ? pairToArray(clause) : clause;
    if (!Array.isArray(flatClause) || flatClause.length === 0) {
      continue;
    }
    const [test, ...rest] = flatClause;
    if (test && typeof test === "object" && test.sym === "else") {
      let result: any = undefined;
      for (const expr of rest) {
        result = evalSchemeExpression(expr, env);
      }
      return result;
    }
    const testResult = evalSchemeExpression(test, env);
    if (stdlib.truthy(testResult)) {
      if (rest.length === 0) {
        return testResult;
      }
      let result: any = undefined;
      for (const expr of rest) {
        result = evalSchemeExpression(expr, env);
      }
      return result;
    }
  }
  return undefined;
}

function evalQuasiquote(expr: any, env: Environment): any {
  if (expr === null || expr === undefined) {
    return expr;
  }

  if (typeof expr !== "object") {
    return expr;
  }

  if (expr.sym !== undefined) {
    return expr;
  }

  if (isPairList(expr)) {
    expr = pairToArray(expr);
  }

  if (Array.isArray(expr)) {
    if (expr.length === 0) {
      return null;
    }
    const [head, ...tail] = expr;
    if (head && typeof head === "object" && head.sym === "unquote") {
      return evalSchemeExpression(tail[0], env);
    }
    const values = expr.map(item => evalQuasiquote(item, env));
    return stdlib.list(...values);
  }

  return expr;
}

export function evalSchemeExpression(expr: any, env: Environment): any {
  if (expr === null || expr === undefined) {
    return expr;
  }

  if (typeof expr !== "object") {
    return expr;
  }

  if (expr.numberType !== undefined && typeof expr.coerce === "function") {
    return expr;
  }

  if (expr.sym !== undefined) {
    return lookupVariable(expr.sym, env);
  }

  if (isPairList(expr)) {
    expr = pairToArray(expr);
  }

  if (Array.isArray(expr)) {
    if (expr.length === 0) {
      return expr;
    }

    const [operator, ...operands] = expr;

    if (operator && typeof operator === "object" && operator.sym) {
      const operatorName = operator.sym;

      switch (operatorName) {
        case "define":
          return evalDefine(operands, env);

        case "if": {
          if (operands.length < 2) {
            throw new Error("if: insufficient arguments");
          }
          const test = evalSchemeExpression(operands[0], env);
          if (stdlib.truthy(test)) {
            return evalSchemeExpression(operands[1], env);
          }
          return operands.length >= 3
            ? evalSchemeExpression(operands[2], env)
            : undefined;
        }

        case "lambda":
          return evalLambda(operands, env);

        case "set!": {
          if (operands.length < 2) {
            throw new Error("set!: insufficient arguments");
          }
          const nameStr = extractParamName(operands[0]);
          const value = evalSchemeExpression(operands[1], env);
          return setVariable(nameStr, value, env);
        }

        case "begin": {
          let result: any = undefined;
          for (const operand of operands) {
            result = evalSchemeExpression(operand, env);
          }
          return result;
        }

        case "let":
          return evalLet(operands, env);

        case "cond":
          return evalCond(operands, env);

        case "quote":
          return operands[0];

        case "quasiquote":
          return evalQuasiquote(operands[0], env);

        case "and": {
          let result: any = true;
          for (const operand of operands) {
            result = evalSchemeExpression(operand, env);
            if (!stdlib.truthy(result)) {
              return false;
            }
          }
          return result;
        }

        case "or": {
          for (const operand of operands) {
            const result = evalSchemeExpression(operand, env);
            if (stdlib.truthy(result)) {
              return result;
            }
          }
          return false;
        }

        default:
          break;
      }

      const evaluatedOperands = operands.map(operand =>
        evalSchemeExpression(operand, env)
      );

      const func = lookupVariable(operatorName, env);
      if (typeof func === "function") {
        return func(...evaluatedOperands);
      }

      throw new Error(`Unknown operator: ${operatorName}`);
    }

    if (Array.isArray(operator)) {
      const evaluatedFunc = evalSchemeExpression(operator, env);
      const evaluatedOperands = operands.map(op =>
        evalSchemeExpression(op, env)
      );
      if (typeof evaluatedFunc === "function") {
        return evaluatedFunc(...evaluatedOperands);
      }
    }

    if (typeof operator === "function") {
      const evaluatedOperands = operands.map(op =>
        evalSchemeExpression(op, env)
      );
      return operator(...evaluatedOperands);
    }

    if (typeof operator !== "function" && operator !== undefined) {
      throw new Error(`Cannot call non-function: ${operator}`);
    }
  }

  return expr;
}
