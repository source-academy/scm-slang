/*
* Disclosure: the current version of this parser is
* inspired by the Lispy Python interpreter of Scheme.
* https://norvig.com/lispy.html
* 
* My changes:
*   - Lispy is written in Python, this is written in TypeScript.
*   - Lispy generates a generic AST, whereas this parser
*     generates an estree (Source AST).
*   - Tokens in scm-slang follow acorn token convention.
*/

import { breakIntoStatements, tokenize } from './tokenize'

import {
    ArrowFunctionExpression,
    AssignmentExpression,
    BaseNode, BinaryExpression, BinaryOperator,
    BlockStatement,
    BreakStatement,
    CallExpression, ConditionalExpression,
    ContinueStatement,
    Declaration,
    Directive,
    EmptyStatement,
    Expression,
    ExpressionStatement,
    FunctionDeclaration,
    Identifier,
    IfStatement, LogicalExpression, LogicalOperator,
    ModuleDeclaration,
    Program,
    ReturnStatement, SimpleLiteral,
    Statement, UnaryExpression, UnaryOperator, VariableDeclaration, VariableDeclarator,
    WhileStatement
} from "estree";

// Goal of this program is to return an 
// estree from a program string  

// Takes a statement and returns an Expression
function readFromTokens(tokens: string[]): Expression {
    if (tokens.length == 0) {
        // error
        throw new Error("unexpected EOF");
    }
    if (tokens[0] == "(") {
        // logic to evaluate what node this is supposed to be
        // and any further recursive calls tracked as well
        var L = breakIntoStatements(tokens.slice(1, tokens.length - 1));
        return {
            type: "BinaryExpression",
            operator: operator(L[0][0]),
            left: readFromTokens(L[1]),
            right: readFromTokens(L[2]),
        };
    } else if (tokens[0] == ")") {
        // error
        throw new Error("unexpected )");
    } 
    // is literal
    return {
        type: "Literal",
        value: atom(tokens[0])
    };
}

function operator(op: string): BinaryOperator {
    switch (op) {
        case "+":
            return "+";
        case "-":
            return "-";
        case "*":
            return "*";
        case "/":
            return "/";
        case "%":
            return "%";
        case "<":
            return "<";
        case ">":
            return ">";
        case "<=":
            return "<=";
        case ">=":
            return ">=";
        case "==":
            return "==";
        case "!=":
            return "!=";
        default:
            throw new Error("unknown operator");
    }
}

function atom(token: string) {
    try {
        return parseInt(token);
    } catch (error) {
        try {
            return parseFloat(token);
        } catch (error) {
            return token;
        }
    }
}

// Technically only 3 relevant nodes in scheme's case,
// Definition (VariableDeclaration)
// ExpressionStatement (variable reference, literal, call expression, primitive evaluation)
// Conditional (IfStatement)

function evalStatement(tokens: string[]): Statement {
    if (tokens[1] == "define") {
        return {
            type: "VariableDeclaration",
            declarations: [
                /*type: "VariableDeclarator",
                id: {
                }*/
            ],
            kind: "let"
        }
    } /*else if (tokens[1] == "if") {
        return {
            type: "IfStatement",
            test: readFromTokens(tokens),
            consequent: readFromTokens(tokens),
            alternate: readFromTokens(tokens)
        }
    }*/
    return {
        type: "ExpressionStatement",
        expression: readFromTokens(tokens)
    }
}

export function parse(source: string): Program {
    return {
        type: "Program",
        sourceType: "script",
        body: breakIntoStatements(tokenize(source)).map(evalStatement)
    }
}

//console.log(parse("(* 4.5 8)"));

//console.log(parse("(+ (* 1 2) (/ 3 4))"));