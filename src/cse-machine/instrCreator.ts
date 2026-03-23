import * as es from "estree";
import type { Control, Instruction } from "./types";

function pushStatements(
  control: Control,
  statements: Array<es.Statement | es.ModuleDeclaration | es.Directive>
): void {
  for (let i = statements.length - 1; i >= 0; i--) {
    const statement = statements[i];
    control.push(statement);
    if (i !== statements.length - 1) {
      control.push({ tag: "pop" });
    }
  }
}

export function expandNode(control: Control, node: es.Node): boolean {
  switch (node.type) {
    case "Program":
      pushStatements(control, (node as es.Program).body);
      return true;

    case "BlockStatement":
      pushStatements(control, (node as es.BlockStatement).body);
      return true;

    case "ExpressionStatement":
      control.push((node as es.ExpressionStatement).expression);
      return true;

    case "ImportDeclaration":
      throw new Error("modules not supported in CSE machine yet");

    case "ExportNamedDeclaration": {
      throw new Error("modules not supported in CSE machine yet");
    }

    case "VariableDeclaration": {
      const declaration = node as es.VariableDeclaration;
      for (let i = declaration.declarations.length - 1; i >= 0; i--) {
        const declarator = declaration.declarations[i];
        const name = (declarator.id as es.Identifier).name;
        control.push({ tag: "define", name } as Instruction);
        if (declarator.init) {
          control.push(declarator.init);
        } else {
          control.push({ tag: "push", value: undefined } as Instruction);
        }
      }
      return true;
    }

    case "CallExpression": {
      const call = node as es.CallExpression;
      if (
        call.callee.type === "Identifier" &&
        (call.callee.name === "and" || call.callee.name === "or")
      ) {
        const operands = call.arguments.map(arg =>
          arg.type === "SpreadElement" ? arg.argument : arg
        ) as es.Expression[];
        if (call.callee.name === "and") {
          if (operands.length === 0) {
            control.push({ tag: "push", value: true } as Instruction);
          } else {
            control.push({ tag: "and", operands: operands.slice(1) });
            control.push(operands[0]);
          }
        } else {
          if (operands.length === 0) {
            control.push({ tag: "push", value: false } as Instruction);
          } else {
            control.push({ tag: "or", operands: operands.slice(1) });
            control.push(operands[0]);
          }
        }
        return true;
      }
      const spreadMask = call.arguments.map(
        arg => arg.type === "SpreadElement"
      );
      control.push({
        tag: "apply",
        argCount: call.arguments.length,
        spreadMask,
      } as Instruction);
      for (let i = call.arguments.length - 1; i >= 0; i--) {
        const arg = call.arguments[i];
        if (arg.type === "SpreadElement") {
          control.push(arg.argument);
        } else {
          control.push(arg);
        }
      }
      control.push(call.callee);
      return true;
    }

    case "ConditionalExpression": {
      const cond = node as es.ConditionalExpression;
      control.push({
        tag: "branch",
        consequent: cond.consequent,
        alternate: cond.alternate,
      } as Instruction);
      control.push(cond.test);
      return true;
    }

    case "AssignmentExpression": {
      const assign = node as es.AssignmentExpression;
      const name = (assign.left as es.Identifier).name;
      control.push({ tag: "assign", name } as Instruction);
      control.push(assign.right);
      return true;
    }

    case "ArrayExpression": {
      const arrayExpr = node as es.ArrayExpression;
      const spreadMask = arrayExpr.elements.map(
        el => el?.type === "SpreadElement"
      );
      control.push({ tag: "build-array", spreadMask } as Instruction);
      for (let i = arrayExpr.elements.length - 1; i >= 0; i--) {
        const element = arrayExpr.elements[i];
        if (!element) {
          control.push({ tag: "push", value: null } as Instruction);
        } else if (element.type === "SpreadElement") {
          control.push(element.argument);
        } else {
          control.push(element);
        }
      }
      return true;
    }

    case "ReturnStatement": {
      const returnStmt = node as es.ReturnStatement;
      control.push({ tag: "return" } as Instruction);
      if (returnStmt.argument) {
        control.push(returnStmt.argument);
      } else {
        control.push({ tag: "push", value: undefined } as Instruction);
      }
      return true;
    }

    default:
      return false;
  }
}
