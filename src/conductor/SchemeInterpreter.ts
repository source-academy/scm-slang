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

  constructor() {
    this.globalEnv = this.createEnvironment(null);
    this.initializeGlobalEnvironment();
  }

  /**
   * Initialize global environment with stdlib functions
   */
  private initializeGlobalEnvironment(): void {
    // Add all stdlib exports to global environment
    // Stdlib exports are encoded (e.g., string$45$symbol for string->symbol)
    // But the transpiler outputs non-encoded names, so we need to decode them
    for (const [encodedKey, value] of Object.entries(stdlib)) {
      // Add both the encoded name and the decoded name
      this.globalEnv.values.set(encodedKey, value);

      const decodedKey = decode(encodedKey);
      this.globalEnv.values.set(decodedKey, value);
    }

    // Add the special eval function
    this.globalEnv.values.set("eval", (schemeExpr: any) => {
      return this.evalSchemeExpression(schemeExpr);
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
        // Handle spread operator if needed
        const arr = this.evaluateNode(arg.argument, env);
        return Array.isArray(arr) ? arr : [arr];
      }
      return this.evaluateNode(arg, env);
    });

    // Flatten spread arguments
    const flatArgs: any[] = [];
    for (const arg of args) {
      if (Array.isArray(arg) && args.length === 1) {
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
    if (func && typeof func === "object" && func.__call__) {
      return func.__call__(...flatArgs);
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
   * Evaluates a Scheme s-expression at runtime
   * Used by the eval special form
   */
  private evalSchemeExpression(expr: any): any {
    // expr is a Scheme value (could be a list, symbol, number, etc.)

    if (expr === null || expr === undefined) {
      return expr;
    }

    // If it's a list (represented as an array with .pair property)
    if (Array.isArray(expr) && (expr as any).pair === true) {
      const [operator, ...operands] = expr;

      // Handle symbols
      if (operator && typeof operator === "symbol") {
        const operatorName = operator.description || String(operator);

        // Look up the operator in the environment
        try {
          const func = this.lookupVariable(operatorName, this.globalEnv);
          if (typeof func === "function") {
            return func(...operands);
          }
        } catch (e) {
          throw new Error(`Unknown operator: ${operatorName}`);
        }
      }

      // If operator is a function, call it
      if (typeof operator === "function") {
        return operator(...operands);
      }
    }

    // For non-list expressions, return as-is
    return expr;
  }
}
