import * as es from "estree";
import * as stdlib from "../stdlib/base";
import { decode } from "../index";

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
      this.globalEnv.values.set(decodedKey, value);
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
   * Look up a variable in the environment
   */
  private lookupVariable(name: string, env: Environment): any {
    if (env.values.has(name)) {
      return env.values.get(name);
    }
    if (env.parent) {
      return this.lookupVariable(name, env.parent);
    }
    throw new Error(`Undefined variable: ${name}`);
  }

  /**
   * Define a variable in the environment
   */
  private defineVariable(name: string, value: any, env: Environment): void {
    env.values.set(name, value);
  }

  /**
   * Evaluates an ESTree Program
   * @param program The ESTree Program to evaluate
   * @returns The result of evaluating the program
   */
  evaluate(program: es.Program): any {
    this.evaluateCounter++;
    let result: any = undefined;

    // Evaluate each statement in the program body
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
        return this.evaluateIdentifier(node as es.Identifier, env);

      case "Literal":
        return this.evaluateLiteral(node as es.Literal, env);

      case "ArrowFunctionExpression":
        return this.evaluateArrowFunctionExpression(
          node as es.ArrowFunctionExpression,
          env
        );

      case "BlockStatement":
        return this.evaluateBlockStatement(node as es.BlockStatement, env);

      case "ReturnStatement":
        const returnStmt = node as es.ReturnStatement;
        if (returnStmt.argument) {
          return this.evaluateNode(returnStmt.argument, env);
        }
        return undefined;

      case "ConditionalExpression":
        return this.evaluateConditionalExpression(
          node as es.ConditionalExpression,
          env
        );

      case "ArrayExpression":
        return this.evaluateArrayExpression(node as es.ArrayExpression, env);

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
    // Evaluate the function
    const func = this.evaluateNode(node.callee, env);

    // Evaluate arguments
    const args = node.arguments.map(arg => {
      if (arg.type === "SpreadElement") {
        const arr = this.evaluateNode(arg.argument, env);
        return Array.isArray(arr) ? arr : [arr];
      }
      return this.evaluateNode(arg, env);
    });

    // Flatten spread arguments - only if we have a single SpreadElement argument
    // Don't spread regular array arguments (like pair structures)
    const flatArgs: any[] = [];
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      // Only spread if this came from a SpreadElement
      // AND it was explicitly marked as a spread
      if (
        Array.isArray(arg) &&
        args.length === 1 &&
        node.arguments[i]?.type === "SpreadElement"
      ) {
        flatArgs.push(...arg);
      } else {
        flatArgs.push(arg);
      }
    }

    // Call the function
    if (typeof func === "function") {
      return func(...flatArgs);
    }

    // If it's a closure (arrow function object), call it
    if (func && typeof func === "object" && (func as any).__call__) {
      return (func as any).__call__(...flatArgs);
    }

    throw new Error(`Not a function: ${func}`);
  }

  /**
   * Evaluate identifier (variable lookup)
   */
  private evaluateIdentifier(node: es.Identifier, env: Environment): any {
    return this.lookupVariable(node.name, env);
  }

  /**
   * Evaluate literal (constant values)
   */
  private evaluateLiteral(node: es.Literal, env: Environment): any {
    return node.value;
  }

  /**
   * Evaluate arrow function
   */
  private evaluateArrowFunctionExpression(
    node: es.ArrowFunctionExpression,
    env: Environment
  ): any {
    // Return a closure that captures the environment
    const closure = (...args: any[]) => {
      // Create new environment for function execution
      const funcEnv = this.createEnvironment(env);

      // Bind parameters
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

      // Evaluate body
      if (node.body.type === "BlockStatement") {
        return this.evaluateBlockStatement(
          node.body as es.BlockStatement,
          funcEnv
        );
      } else {
        // Expression body
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
    const isTruthy = test !== false;
    return isTruthy
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
    return node.elements.map(el => {
      if (el === null) return null;
      if (el.type === "SpreadElement") {
        const arr = this.evaluateNode(el.argument, env);
        return Array.isArray(arr) ? arr : [arr];
      }
      return this.evaluateNode(el, env);
    });
  }

  /**
   * Convert a Scheme pair structure (cons list) to a flat array
   * pair structure: [head, [head2, [head3, null, pair: true], pair: true], pair: true]
   * flat array: [head, head2, head3]
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
   * Extract identifier name from a parameter (handles symbols and identifiers)
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
   * Evaluates a Scheme s-expression at runtime
   * Used by the eval special form
   *
   * S-expressions can be:
   * - Pair structures: [head, [head2, null, pair: true], pair: true]
   * - Flat arrays: [operator, arg1, arg2, ...]
   * - Objects with .sym properties: {"sym": "+"}
   * - SchemeNumber objects with .numberType and .coerce()
   */
  private evalSchemeExpression(expr: any, env: Environment): any {
    // Base cases
    if (expr === null || expr === undefined) {
      return expr;
    }

    // Numbers, strings, booleans - return as-is
    if (typeof expr !== "object") {
      return expr;
    }

    // Handle SchemeNumber types (SchemeInteger, SchemeReal, etc.)
    // DON'T coerce them - keep as SchemeNumber objects
    // The stdlib functions need SchemeNumber objects, not JavaScript numbers
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

    // List/pair (array representing a list)
    if (Array.isArray(expr)) {
      if (expr.length === 0) {
        return expr;
      }

      const [operator, ...operands] = expr;

      // Handle symbols as operators
      if (operator && typeof operator === "object" && operator.sym) {
        const operatorName = operator.sym;

        // ===== SPECIAL FORMS =====

        // define: (define name value) or (define (name args...) body)
        if (operatorName === "define") {
          if (operands.length < 2) {
            throw new Error("define: insufficient arguments");
          }

          const nameOrSignature = operands[0];
          const value = operands[1];

          // Check if it's a function definition: (define (name params...) body)
          if (Array.isArray(nameOrSignature)) {
            // Convert pair structure to flat array if needed
            let flatSignature = nameOrSignature;
            if ((nameOrSignature as any).pair === true) {
              flatSignature = this.pairToArray(nameOrSignature);
            }

            const [funcName, ...params] = flatSignature;
            const funcNameStr = this.extractParamName(funcName);

            // Convert each param if it's a pair structure
            const flatParams = params.map(param => {
              if (Array.isArray(param) && (param as any).pair === true) {
                const flatParam = this.pairToArray(param);
                return flatParam[0];
              }
              return param;
            });

            // Create a function that will be stored
            const schemeFunc = (...args: any[]) => {
              const funcEnv = this.createEnvironment(env);

              // Bind parameters
              for (let i = 0; i < flatParams.length; i++) {
                const paramName = this.extractParamName(flatParams[i]);
                funcEnv.values.set(paramName, args[i]);
              }

              return this.evalSchemeExpressionInEnv(value, funcEnv);
            };

            this.defineVariable(funcNameStr, schemeFunc, env);
            return undefined;
          } else {
            // Simple define: (define name value)
            const nameStr = this.extractParamName(nameOrSignature);
            const evaluatedValue = this.evalSchemeExpression(value, env);
            this.defineVariable(nameStr, evaluatedValue, env);
            return undefined;
          }
        }

        // if: (if test consequent alternate)
        if (operatorName === "if") {
          if (operands.length < 3) {
            throw new Error("if: insufficient arguments");
          }
          const test = this.evalSchemeExpression(operands[0], env);
          const isTruthy = test !== false;
          if (isTruthy) {
            return this.evalSchemeExpression(operands[1], env);
          } else {
            return this.evalSchemeExpression(operands[2], env);
          }
        }

        // lambda: (lambda (params...) body)
        if (operatorName === "lambda") {
          if (operands.length < 2) {
            throw new Error("lambda: insufficient arguments");
          }
          const params = operands[0];
          const body = operands[1];

          // Convert pair structure to flat array if needed
          let flatParams = params;
          if (Array.isArray(params) && (params as any).pair === true) {
            flatParams = this.pairToArray(params);
          }

          // Return a function that closes over the current environment
          return (...args: any[]) => {
            const funcEnv = this.createEnvironment(env);

            // Bind parameters
            if (Array.isArray(flatParams)) {
              for (let i = 0; i < flatParams.length; i++) {
                const paramName = this.extractParamName(flatParams[i]);
                funcEnv.values.set(paramName, args[i]);
              }
            }

            return this.evalSchemeExpressionInEnv(body, funcEnv);
          };
        }

        // ===== REGULAR FUNCTION CALLS =====
        // Recursively evaluate operands
        const evaluatedOperands = operands.map(operand =>
          this.evalSchemeExpression(operand, env)
        );

        try {
          const func = this.lookupVariable(operatorName, env);
          if (typeof func === "function") {
            return func(...evaluatedOperands);
          }
        } catch (e) {
          throw new Error(`Unknown operator: ${operatorName}`);
        }
      }

      // If operator is an array (higher-order function), evaluate it
      if (Array.isArray(operator)) {
        const evaluatedFunc = this.evalSchemeExpression(operator, env);
        const evaluatedOperands = operands.map(op =>
          this.evalSchemeExpression(op, env)
        );
        if (typeof evaluatedFunc === "function") {
          return evaluatedFunc(...evaluatedOperands);
        }
      }

      // If operator is a function, call it
      if (typeof operator === "function") {
        const evaluatedOperands = operands.map(op =>
          this.evalSchemeExpression(op, env)
        );
        return operator(...evaluatedOperands);
      }

      // If operator is a number or other non-callable value, throw error
      if (typeof operator !== "function" && operator !== undefined) {
        throw new Error(`Cannot call non-function: ${operator}`);
      }
    }

    return expr;
  }

  /**
   * Helper: Evaluate s-expression in a specific environment
   */
  private evalSchemeExpressionInEnv(expr: any, env: Environment): any {
    // Convert pair structure to flat array if needed
    if (Array.isArray(expr) && (expr as any).pair === true) {
      expr = this.pairToArray(expr);
    }

    // Base cases
    if (expr === null || expr === undefined) {
      return expr;
    }

    if (typeof expr !== "object") {
      return expr;
    }

    // Handle SchemeNumber types (SchemeInteger, SchemeReal, etc.)
    // DON'T coerce them - keep as SchemeNumber objects
    if (expr.numberType !== undefined && typeof expr.coerce === "function") {
      return expr;
    }

    // Symbol lookup in provided environment
    if (expr.sym !== undefined) {
      return this.lookupVariable(expr.sym, env);
    }

    if (Array.isArray(expr)) {
      if (expr.length === 0) {
        return expr;
      }

      const [operator, ...operands] = expr;

      if (operator && typeof operator === "object" && operator.sym) {
        const operatorName = operator.sym;

        // if: special case
        if (operatorName === "if") {
          const test = this.evalSchemeExpressionInEnv(operands[0], env);
          const isTruthy = test !== false;
          if (isTruthy) {
            return this.evalSchemeExpressionInEnv(operands[1], env);
          } else {
            return this.evalSchemeExpressionInEnv(operands[2], env);
          }
        }

        // Regular function call
        const evaluatedOperands = operands.map(op =>
          this.evalSchemeExpressionInEnv(op, env)
        );

        try {
          const func = this.lookupVariable(operatorName, env);
          if (typeof func === "function") {
            return func(...evaluatedOperands);
          }
        } catch (e) {
          throw new Error(`Unknown operator: ${operatorName}`);
        }
      }

      // If operator is a function, call it
      if (typeof operator === "function") {
        const evaluatedOperands = operands.map(op =>
          this.evalSchemeExpressionInEnv(op, env)
        );
        return operator(...evaluatedOperands);
      }
    }

    return expr;
  }
}