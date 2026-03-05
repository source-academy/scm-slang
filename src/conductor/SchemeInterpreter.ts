import * as es from "estree";
import * as stdlib from "../stdlib/base";
import { decode, encode } from "../index";

/**
 * Represents an environment (scope) in the Scheme interpreter
 */
interface Environment {
  values: Map<string, any>;
  parent: Environment | null;
}

/**
 * SchemeInterpreter evaluates ESTree Programs with Scheme semantics.
 * Does NOT use JavaScript eval() - walks the AST manually.
 * Maintains environments across multiple evaluations (REPL sessions).
 */
export class SchemeInterpreter {
  // Global environment - persists across chunks
  private globalEnv: Environment;
  private evaluateCounter = 0;

  constructor() {
    this.globalEnv = this.createEnvironment(null);
    this.initializeGlobalEnvironment();
  }

  /**
   * Initialize global environment with stdlib functions
   */
  private initializeGlobalEnvironment(): void {
    // Add all stdlib exports to global environment
    for (const [encodedKey, value] of Object.entries(stdlib)) {
      this.globalEnv.values.set(encodedKey, value);
      const decodedKey = decode(encodedKey);
      if (decodedKey !== encodedKey) {
        this.globalEnv.values.set(decodedKey, value);
      }
    }

    // Add compatibility aliases for functions the transpiler generates
    if ((stdlib as any).make_number) {
      this.globalEnv.values.set("make_number", (stdlib as any).make_number);
    }

    // If make_number doesn't exist, create a wrapper
    if (!this.globalEnv.values.has("make_number")) {
      const coreImport = require("../stdlib/core-math");
      if (coreImport.make_number) {
        this.globalEnv.values.set("make_number", coreImport.make_number);
      }
    }

    // Add the special eval function - pass current environment
    this.globalEnv.values.set("eval", (schemeExpr: any, env?: Environment) => {
      const envToUse = env || this.globalEnv;
      return this.evalSchemeExpression(schemeExpr, envToUse);
    });
  }

  // ==========================================================================
  // Environment operations
  // ==========================================================================

  /**
   * Create a new environment
   */
  private createEnvironment(parent: Environment | null): Environment {
    return {
      values: new Map(),
      parent,
    };
  }

  /**
   * Look up a variable in the environment chain.
   * Tries the name as-is first, then tries the encoded version.
   */
  private lookupVariable(name: string, env: Environment): any {
    // Try the name as-is through the chain
    let current: Environment | null = env;
    while (current !== null) {
      if (current.values.has(name)) {
        return current.values.get(name);
      }
      current = current.parent;
    }

    // Try encoded name as fallback (e.g., make-counter -> make$45$counter)
    const encodedName = encode(name);
    if (encodedName !== name) {
      let current2: Environment | null = env;
      while (current2 !== null) {
        if (current2.values.has(encodedName)) {
          return current2.values.get(encodedName);
        }
        current2 = current2.parent;
      }
    }

    // Try decoded name as fallback (e.g., make$45$counter -> make-counter)
    const decodedName = decode(name);
    if (decodedName !== name) {
      let current3: Environment | null = env;
      while (current3 !== null) {
        if (current3.values.has(decodedName)) {
          return current3.values.get(decodedName);
        }
        current3 = current3.parent;
      }
    }

    throw new Error(`Undefined variable: ${name}`);
  }

  /**
   * Define a variable in the environment.
   * Stores under both the given name and its encoded/decoded counterpart
   * so lookups from either the ESTree path or the s-expression path work.
   */
  private defineVariable(name: string, value: any, env: Environment): void {
    env.values.set(name, value);
    // Also store under encoded name if different
    const encodedName = encode(name);
    if (encodedName !== name) {
      env.values.set(encodedName, value);
    }
    // Also store under decoded name if different
    const decodedName = decode(name);
    if (decodedName !== name) {
      env.values.set(decodedName, value);
    }
  }

  /**
   * Set (mutate) an existing variable by walking up the environment chain.
   * Updates under both the found name and its encoded/decoded counterpart.
   * Throws if the variable was never defined.
   */
  private setVariable(name: string, value: any, env: Environment): any {
    // Try the name as-is
    let current: Environment | null = env;
    while (current !== null) {
      if (current.values.has(name)) {
        current.values.set(name, value);
        // Keep encoded/decoded counterpart in sync
        const encodedName = encode(name);
        if (encodedName !== name && current.values.has(encodedName)) {
          current.values.set(encodedName, value);
        }
        const decodedName = decode(name);
        if (decodedName !== name && current.values.has(decodedName)) {
          current.values.set(decodedName, value);
        }
        return value;
      }
      current = current.parent;
    }

    // Try encoded name
    const encodedName = encode(name);
    if (encodedName !== name) {
      let current2: Environment | null = env;
      while (current2 !== null) {
        if (current2.values.has(encodedName)) {
          current2.values.set(encodedName, value);
          current2.values.set(name, value);
          return value;
        }
        current2 = current2.parent;
      }
    }

    throw new Error(`Undefined variable: ${name}`);
  }

  // ==========================================================================
  // ESTree evaluation (main path)
  // ==========================================================================

  /**
   * Evaluates an ESTree Program
   */
  evaluate(program: es.Program): any {
    this.evaluateCounter++;
    let result: any = undefined;

    for (const statement of program.body) {
      result = this.evaluateNode(statement, this.globalEnv);
    }

    return result;
  }

  /**
   * Main evaluation dispatcher
   */
  private evaluateNode(node: es.Node, env: Environment): any {
    switch (node.type) {
      case "Program":
        return this.evaluateProgram(node as es.Program, env);

      case "ExpressionStatement":
        return this.evaluateNode(
          (node as es.ExpressionStatement).expression,
          env
        );

      case "VariableDeclaration":
        return this.evaluateVariableDeclaration(
          node as es.VariableDeclaration,
          env
        );

      case "CallExpression":
        return this.evaluateCallExpression(node as es.CallExpression, env);

      case "Identifier":
        return this.lookupVariable(node.name, env);

      case "Literal":
        return (node as es.Literal).value;

      case "ArrowFunctionExpression":
        return this.evaluateArrowFunctionExpression(
          node as es.ArrowFunctionExpression,
          env
        );

      case "BlockStatement":
        return this.evaluateBlockStatement(node as es.BlockStatement, env);

      case "ReturnStatement": {
        const returnStmt = node as es.ReturnStatement;
        return returnStmt.argument
          ? this.evaluateNode(returnStmt.argument, env)
          : undefined;
      }

      case "ConditionalExpression":
        return this.evaluateConditionalExpression(
          node as es.ConditionalExpression,
          env
        );

      case "ArrayExpression":
        return this.evaluateArrayExpression(node as es.ArrayExpression, env);

      case "AssignmentExpression": {
        const assignNode = node as es.AssignmentExpression;
        const value = this.evaluateNode(assignNode.right, env);
        const name = (assignNode.left as es.Identifier).name;
        return this.setVariable(name, value, env);
      }

      default:
        throw new Error(
          `Unsupported node type: ${(node as any).type || "unknown"}`
        );
    }
  }

  /**
   * Evaluate a Program node
   */
  private evaluateProgram(program: es.Program, env: Environment): any {
    let result: any = undefined;
    for (const statement of program.body) {
      result = this.evaluateNode(statement, env);
    }
    return result;
  }

  /**
   * Evaluate variable declaration (define)
   */
  private evaluateVariableDeclaration(
    node: es.VariableDeclaration,
    env: Environment
  ): any {
    for (const declarator of node.declarations) {
      const name = (declarator.id as es.Identifier).name;
      const value = declarator.init
        ? this.evaluateNode(declarator.init, env)
        : undefined;
      this.defineVariable(name, value, env);
    }
    return undefined;
  }

  /**
   * Evaluate function call
   */
  private evaluateCallExpression(
    node: es.CallExpression,
    env: Environment
  ): any {
    const func = this.evaluateNode(node.callee, env);

    const args = node.arguments.map((arg) => {
      if (arg.type === "SpreadElement") {
        const arr = this.evaluateNode(arg.argument, env);
        return Array.isArray(arr) ? arr : [arr];
      }
      return this.evaluateNode(arg, env);
    });

    // Flatten spread arguments
    const flatArgs: any[] = [];
    for (let i = 0; i < args.length; i++) {
      if (
        Array.isArray(args[i]) &&
        args.length === 1 &&
        node.arguments[i]?.type === "SpreadElement"
      ) {
        flatArgs.push(...args[i]);
      } else {
        flatArgs.push(args[i]);
      }
    }

    if (typeof func === "function") {
      return func(...flatArgs);
    }

    if (func && typeof func === "object" && (func as any).__call__) {
      return (func as any).__call__(...flatArgs);
    }

    throw new Error(`Not a function: ${func}`);
  }

  /**
   * Evaluate arrow function expression — creates a closure
   */
  private evaluateArrowFunctionExpression(
    node: es.ArrowFunctionExpression,
    env: Environment
  ): any {
    const closure = (...args: any[]) => {
      const funcEnv = this.createEnvironment(env);

      for (let i = 0; i < node.params.length; i++) {
        const param = node.params[i];
        if (param.type === "Identifier") {
          this.defineVariable(param.name, args[i], funcEnv);
        } else if (param.type === "RestElement") {
          const restName = (param.argument as es.Identifier).name;
          this.defineVariable(restName, args.slice(i), funcEnv);
          break;
        }
      }

      if (node.body.type === "BlockStatement") {
        return this.evaluateBlockStatement(
          node.body as es.BlockStatement,
          funcEnv
        );
      } else {
        return this.evaluateNode(node.body, funcEnv);
      }
    };

    return closure;
  }

  /**
   * Evaluate block statement
   */
  private evaluateBlockStatement(
    node: es.BlockStatement,
    env: Environment
  ): any {
    let result: any = undefined;
    for (const statement of node.body) {
      result = this.evaluateNode(statement, env);
    }
    return result;
  }

  /**
   * Evaluate conditional (ternary) expression
   */
  private evaluateConditionalExpression(
    node: es.ConditionalExpression,
    env: Environment
  ): any {
    const test = this.evaluateNode(node.test, env);
    // In Scheme, only #f (false) is falsy
    return test !== false
      ? this.evaluateNode(node.consequent, env)
      : this.evaluateNode(node.alternate, env);
  }

  /**
   * Evaluate array literal
   */
  private evaluateArrayExpression(
    node: es.ArrayExpression,
    env: Environment
  ): any {
    return node.elements.map((el) => {
      if (el === null) return null;
      if (el.type === "SpreadElement") {
        const arr = this.evaluateNode(el.argument, env);
        return Array.isArray(arr) ? arr : [arr];
      }
      return this.evaluateNode(el, env);
    });
  }

  // ==========================================================================
  // S-expression evaluation (used by eval special form at runtime)
  // ==========================================================================

  /**
   * Convert a Scheme pair structure to a flat array
   */
  private pairToArray(pair: any): any[] {
    const result: any[] = [];
    let current = pair;

    while (
      current !== null &&
      Array.isArray(current) &&
      (current as any).pair === true
    ) {
      result.push(current[0]);
      current = current[1];
    }

    if (current !== null) {
      result.push(current);
    }

    return result;
  }

  /**
   * Extract identifier name from a parameter
   */
  private extractParamName(param: any): string {
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

  /**
   * Evaluates a Scheme s-expression at runtime.
   * Used by the eval special form.
   */
  private evalSchemeExpression(expr: any, env: Environment): any {
    // Base cases
    if (expr === null || expr === undefined) {
      return expr;
    }

    if (typeof expr !== "object") {
      return expr;
    }

    // SchemeNumber objects — keep as-is
    if (expr.numberType !== undefined && typeof expr.coerce === "function") {
      return expr;
    }

    // Symbol lookup
    if (expr.sym !== undefined) {
      return this.lookupVariable(expr.sym, env);
    }

    // Convert pair structure to flat array if needed
    if (Array.isArray(expr) && (expr as any).pair === true) {
      expr = this.pairToArray(expr);
    }

    // List (array representing an s-expression)
    if (Array.isArray(expr)) {
      if (expr.length === 0) {
        return expr;
      }

      const [operator, ...operands] = expr;

      // Handle symbols as operators
      if (operator && typeof operator === "object" && operator.sym) {
        const operatorName = operator.sym;

        // ===== SPECIAL FORMS =====

        // define
        if (operatorName === "define") {
          return this.evalDefine(operands, env);
        }

        // if
        if (operatorName === "if") {
          if (operands.length < 2) {
            throw new Error("if: insufficient arguments");
          }
          const test = this.evalSchemeExpression(operands[0], env);
          if (test !== false) {
            return this.evalSchemeExpression(operands[1], env);
          } else {
            return operands.length >= 3
              ? this.evalSchemeExpression(operands[2], env)
              : undefined;
          }
        }

        // lambda
        if (operatorName === "lambda") {
          return this.evalLambda(operands, env);
        }

        // set!
        if (operatorName === "set!") {
          if (operands.length < 2) {
            throw new Error("set!: insufficient arguments");
          }
          const nameStr = this.extractParamName(operands[0]);
          const value = this.evalSchemeExpression(operands[1], env);
          return this.setVariable(nameStr, value, env);
        }

        // begin
        if (operatorName === "begin") {
          let result: any = undefined;
          for (const operand of operands) {
            result = this.evalSchemeExpression(operand, env);
          }
          return result;
        }

        // ===== REGULAR FUNCTION CALLS =====
        const evaluatedOperands = operands.map((operand) =>
          this.evalSchemeExpression(operand, env)
        );

        const func = this.lookupVariable(operatorName, env);
        if (typeof func === "function") {
          return func(...evaluatedOperands);
        }

        throw new Error(`Unknown operator: ${operatorName}`);
      }

      // If operator is an array (higher-order function), evaluate it
      if (Array.isArray(operator)) {
        const evaluatedFunc = this.evalSchemeExpression(operator, env);
        const evaluatedOperands = operands.map((op) =>
          this.evalSchemeExpression(op, env)
        );
        if (typeof evaluatedFunc === "function") {
          return evaluatedFunc(...evaluatedOperands);
        }
      }

      // If operator is already a function
      if (typeof operator === "function") {
        const evaluatedOperands = operands.map((op) =>
          this.evalSchemeExpression(op, env)
        );
        return operator(...evaluatedOperands);
      }

      if (typeof operator !== "function" && operator !== undefined) {
        throw new Error(`Cannot call non-function: ${operator}`);
      }
    }

    return expr;
  }

  /**
   * Handle (define ...) in s-expression evaluation
   */
  private evalDefine(operands: any[], env: Environment): undefined {
    if (operands.length < 2) {
      throw new Error("define: insufficient arguments");
    }

    const nameOrSignature = operands[0];
    const bodyExprs = operands.slice(1);

    // Function definition: (define (name params...) body...)
    if (
      Array.isArray(nameOrSignature) ||
      (nameOrSignature && typeof nameOrSignature === "object" && !nameOrSignature.sym && (nameOrSignature as any).pair)
    ) {
      let flatSignature = nameOrSignature;
      if (Array.isArray(nameOrSignature) && (nameOrSignature as any).pair === true) {
        flatSignature = this.pairToArray(nameOrSignature);
      }

      if (!Array.isArray(flatSignature)) {
        flatSignature = [flatSignature];
      }

      const [funcName, ...params] = flatSignature;
      const funcNameStr = this.extractParamName(funcName);

      const flatParams = params.map((param: any) => {
        if (Array.isArray(param) && (param as any).pair === true) {
          return this.pairToArray(param)[0];
        }
        return param;
      });

      const schemeFunc = (...args: any[]) => {
        const funcEnv = this.createEnvironment(env);

        for (let i = 0; i < flatParams.length; i++) {
          const paramName = this.extractParamName(flatParams[i]);
          this.defineVariable(paramName, args[i], funcEnv);
        }

        // Evaluate all body expressions, return the last
        let result: any = undefined;
        for (const bodyExpr of bodyExprs) {
          result = this.evalSchemeExpression(bodyExpr, funcEnv);
        }
        return result;
      };

      this.defineVariable(funcNameStr, schemeFunc, env);
      return undefined;
    } else {
      // Simple define: (define name value)
      const nameStr = this.extractParamName(nameOrSignature);
      const evaluatedValue = this.evalSchemeExpression(bodyExprs[0], env);
      this.defineVariable(nameStr, evaluatedValue, env);
      return undefined;
    }
  }

  /**
   * Handle (lambda ...) in s-expression evaluation
   */
  private evalLambda(operands: any[], env: Environment): Function {
    if (operands.length < 2) {
      throw new Error("lambda: insufficient arguments");
    }

    const params = operands[0];
    const bodyExprs = operands.slice(1);

    let flatParams = params;
    if (Array.isArray(params) && (params as any).pair === true) {
      flatParams = this.pairToArray(params);
    }

    return (...args: any[]) => {
      const funcEnv = this.createEnvironment(env);

      if (Array.isArray(flatParams)) {
        for (let i = 0; i < flatParams.length; i++) {
          const paramName = this.extractParamName(flatParams[i]);
          this.defineVariable(paramName, args[i], funcEnv);
        }
      }

      // Evaluate all body expressions, return the last
      let result: any = undefined;
      for (const bodyExpr of bodyExprs) {
        result = this.evalSchemeExpression(bodyExpr, funcEnv);
      }
      return result;
    };
  }
}