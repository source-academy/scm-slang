/* Library for building ESTree nodes. */

import { 
  Program,
  Expression,
  Statement,
  ExpressionStatement,
  BlockStatement,
  VariableDeclaration,
  CallExpression,
  ArrowFunctionExpression,
  Literal,
  Identifier,
  SourceLocation,
  ConditionalExpression,
  AssignmentExpression,
  ImportSpecifier,
  ModuleDeclaration,
} from "estree";

export function makeProgram(body: Statement[] = []): Program {
  return {
    type: "Program",
    body,
    sourceType: "module",
    loc: {
      start: { line: 1, column: 0 },
      end: { line: 1, column: 0 },
    },
  };
}

export function makeDeclaration(
  kind: "var" | "let" | "const",
  id: Identifier,
  init: Expression
): VariableDeclaration {
  return {
    type: "VariableDeclaration",
    kind,
    declarations: [
      {
        type: "VariableDeclarator",
        id,
        init,
      },
    ],
    loc: id.loc,
  };
} 

export function makeIdentifier(name: string, loc?: SourceLocation): Identifier {
  return {
    type: "Identifier",
    name,
    loc,
  };
}

export function makeLiteral(value: string | number | boolean | null, loc?: SourceLocation): Literal {
  return {
    type: "Literal",
    value,
    raw: `"${value}"`,
    loc,
  };
}

export function makeArrowFunctionExpression(
  params: Identifier[],
  body: Expression | BlockStatement
): ArrowFunctionExpression {
  return {
    type: "ArrowFunctionExpression",
    params,
    body,
    async: false,
    expression: true,
    loc: body.loc,
  };
}

export function makeBlockStatement(body: Statement[]): BlockStatement {
  return {
    type: "BlockStatement",
    body,
    loc: {
      start: body[0].loc!.start,
      end: body[body.length - 1].loc!.end,
    },
  };
}

export function makeCallExpression(
  callee: Expression,
  args: Expression[]
): CallExpression {
  return {
    type: "CallExpression",
    optional: false,
    callee,
    arguments: args,
    loc: {
      start: callee.loc!.start,
      end: args[args.length - 1].loc!.end,
    },
  };
}

export function makeConditionalExpression(
  test: Expression,
  consequent: Expression,
  alternate: Expression
): ConditionalExpression {
  return {
    type: "ConditionalExpression",
    test,
    consequent,
    alternate,
    loc: {
      start: test.loc!.start,
      end: alternate.loc!.end,
    },
  };
}

export function makeAssignmentExpression(
  left: Identifier,
  right: Expression
): AssignmentExpression {
  return {
    type: "AssignmentExpression",
    operator: "=",
    left,
    right,
    loc: {
      start: left.loc!.start,
      end: right.loc!.end,
    },
  };
}

export function makeExpressionStatement(
  expression: Expression
): ExpressionStatement {
  return {
    type: "ExpressionStatement",
    expression,
    loc: expression.loc,
  };
}

export function makeReturnStatement(
  argument: Expression
): Statement {
  return {
    type: "ReturnStatement",
    argument,
    loc: argument.loc,
  };
}

export function makeImportSpecifier(
  imported: Identifier,
  local: Identifier
): ImportSpecifier {
  return {
    type: "ImportSpecifier",
    imported,
    local,
    loc: imported.loc,
  };
}

export function makeImportDeclaration(
  specifiers: ImportSpecifier[],
  source: Literal
): ModuleDeclaration {
  return {
    type: "ImportDeclaration",
    specifiers,
    source,
    loc: {
      start: specifiers[0].loc!.start,
      end: source.loc!.end,
    },
  };
}

export function makeExportNamedDeclaration(
  declaration: VariableDeclaration
): ModuleDeclaration {
  return {
    type: "ExportNamedDeclaration",
    specifiers: [],
    source: null,
    declaration,
    loc: declaration.loc,
  };
}