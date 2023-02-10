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

import { Token, Tokenizer } from './tokenize'

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
function readFromTokens(tokens: Token[]): Expression {
    if (tokens.length == 0) {
        // error
        throw new Error("unexpected EOF");
    }
    if (tokens[0].value == "(") {
        // logic to evaluate what node this is supposed to be
        // and any further recursive calls tracked as well
        var L = breakIntoStatements(tokens.slice(1, tokens.length - 1));
        return {
            type: "BinaryExpression",
            operator: L[0][0].value,
            left: readFromTokens(L[1]),
            right: readFromTokens(L[2]),
        };
    } else if (tokens[0].value == ")") {
        // error
        throw new Error("unexpected )");
    } 
    // is literal
    return {
        type: "Literal",
        value: atom(tokens[0].value)
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

function evalStatement(tokens: Token[]): Statement {
    if (tokens[1].value == "define") {
        return {
            type: "VariableDeclaration",
            declarations: [{
                type: "VariableDeclarator",
                id: {
                    type: "Identifier",
                    name: tokens[2].value
                },
                init: readFromTokens(tokens.slice(3))
            }
            ],
            kind: "let"
        }
    } else if (tokens[1].value == "if") {
        return {
            // wip
            type: "IfStatement",
            test: readFromTokens(tokens.slice(1)),
            consequent: evalStatement(tokens.slice(2)),
            alternate: evalStatement(tokens.slice(3))
        }
    } else {
        return {
            type: "ExpressionStatement",
            expression: readFromTokens(tokens)
        }
    }
}

// break a list of tokens into statements.
function breakIntoStatements(tokens: Token[]) {
    var statements: Token[][] = [];
    var currentStatement: Token[] = [];
    // To track the current "level" of parentheses.
    // If the level is 0, then we are at the top level.
    var parentheses = 0;
    for (var i = 0; i < tokens.length; i++) {
        if (tokens[i].value != "") {
            currentStatement.push(tokens[i]);
            if (tokens[i].value == "(") {
                parentheses++;
            } else if (tokens[i].value == ")") {
                parentheses--;
            }
        }
        if (parentheses == 0) {
            // End of statement.
            // Check if the statement is not empty.
            if (currentStatement.length > 0) {
                statements.push(currentStatement);
                currentStatement = [];
            }
        }
    }
    return statements;
}


//console.log(parse("(* 4.5 8)"));

//console.log(parse("(+ (* 1 2) (/ 3 4))"));

export class Parser {
    source: string;
    AST: Token[][];
    estree: Program;
    tokenizer: Tokenizer;
    constructor(source: string) {
        this.source = source;
        this.AST = [];
        this.estree = {
            type: "Program",
            sourceType: "script",
            body: []
        };
        this.tokenizer = new Tokenizer(source);
    }

    parse(): Program {
        this.tokenizer.tokenize();
        return {
            type: "Program",
            sourceType: "script",
            body: breakIntoStatements(this.tokenizer.getTokens()).map(evalStatement)
        }
    }
}