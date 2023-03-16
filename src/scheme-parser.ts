import { Token } from "./tokenizer";
import { TokenType } from "./token-type";
import { SchemeParserError } from "./scheme-error";
import {
  Program,
  Expression,
  Statement,
  BlockStatement,
  ExpressionStatement,
  ReturnStatement,
  VariableDeclaration,
  VariableDeclarator,
  CallExpression,
  FunctionExpression,
  Literal,
  Identifier,
  SourceLocation,
  Position,
  ConditionalExpression,
} from "estree";

export class SchemeParser {
  private readonly tokens: Token[];
  private readonly estree: Program;
  private current: number = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
    this.estree = {
      type: "Program",
      body: [],
      sourceType: "script",
    };
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.current >= this.tokens.length;
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  /**
   * Returns a group of associated tokens.
   * Tokens are grouped by level of parentheses.
   *
   * @param openparen The type of opening parenthesis.
   * @returns A group of tokens or groups of tokens.
   */
  private grouping(): any[];
  private grouping(openparen: TokenType): any[];
  private grouping(openparen?: TokenType): any[] {
    let inList = openparen === undefined ? false : true;
    const tokens: any[] = [];
    do {
      let c = this.advance();
      switch (c.type) {
        case TokenType.LEFT_PAREN:
        case TokenType.LEFT_BRACKET:
          tokens.push(this.grouping(c.type));
          break;
        case TokenType.RIGHT_PAREN:
        case TokenType.RIGHT_BRACKET:
          if (!inList) {
            throw new SchemeParserError.UnexpectedTokenError(c.line, c.col, c);
          } else if (
            !this.matchingParentheses(openparen, c.type)
          ) {
            // ^ safe to cast openparen as this only executes
            // if inList is true, which is only the case if openparen exists
            throw new SchemeParserError.ParenthesisMismatchError(c.line, c.col);
          }
          inList = false;
          break;
        case TokenType.APOSTROPHE:
        case TokenType.BACKTICK:
        case TokenType.HASH:
        case TokenType.COMMA:
        case TokenType.COMMA_AT:
          // These special notations are converted to their
          // corresponding "procedure-style" tokens.
          let newGroup: any[] = [this.convertToken(c)];
          newGroup.push(...this.grouping());
          tokens.push(newGroup);
          break;
        case TokenType.BEGIN:
        case TokenType.COND:
        case TokenType.ELSE:
        case TokenType.IDENTIFIER:
        case TokenType.NUMBER:
        case TokenType.BOOLEAN:
        case TokenType.STRING:
        case TokenType.IF:
        case TokenType.DEFINE:
        case TokenType.QUOTE:
        case TokenType.SET:
        case TokenType.LAMBDA:
        case TokenType.LET:
          tokens.push(c);
          break;
        case TokenType.EOF:
          if (inList) {
            throw new SchemeParserError.UnexpectedEOFError(c.line, c.col);
          } else {
            tokens.push(c);
          }
          break;
        default:
          throw new SchemeParserError.UnexpectedTokenError(c.line, c.col, c);
      }
    } while (inList);
    return tokens;
  }

  /**
   * Compares the type of opening and closing parantheses.
   *
   * @param lParen
   * @param rParen
   * @returns Whether the parentheses match.
   */
  private matchingParentheses(lParen: TokenType, rParen: TokenType) {
    return (
      (lParen === TokenType.LEFT_PAREN && rParen === TokenType.RIGHT_PAREN) ||
      (lParen === TokenType.LEFT_BRACKET && rParen === TokenType.RIGHT_BRACKET)
    );
  }

  /**
   * Converts a token to another representation of itself.
   *
   * @param token A token to be converted.
   * @returns A converted token.
   */
  private convertToken(token: Token): Token {
    switch (token.type) {
      case TokenType.APOSTROPHE:
        return new Token(
          TokenType.QUOTE,
          token.lexeme,
          token.literal,
          token.start,
          token.end,
          token.line,
          token.col
        );
      case TokenType.BACKTICK:
        return new Token(
          TokenType.QUASIQUOTE,
          token.lexeme,
          token.literal,
          token.start,
          token.end,
          token.line,
          token.col
        );
      case TokenType.HASH:
        return new Token(
          TokenType.VECTOR,
          token.lexeme,
          token.literal,
          token.start,
          token.end,
          token.line,
          token.col
        );
      case TokenType.COMMA:
        return new Token(
          TokenType.UNQUOTE,
          token.lexeme,
          token.literal,
          token.start,
          token.end,
          token.line,
          token.col
        );
      case TokenType.COMMA_AT:
        return new Token(
          TokenType.UNQUOTE_SPLICING,
          token.lexeme,
          token.literal,
          token.start,
          token.end,
          token.line,
          token.col
        );
      default:
        return token;
    }
  }

  /**
   * Evaluates a group of tokens.
   *
   * @param expression An expression.
   * @param noStatements Option to allow statements.
   * @returns An evaluated expression.
   */
  private evaluate(expression: Token | any[]): Statement | Expression;
  private evaluate(
    expression: Token | any[],
    noStatements: boolean
  ): Statement | Expression;
  private evaluate(
    expression: Token | any[],
    noStatements = false
  ): Statement | Expression {
    if (expression instanceof Token) {
      return this.evaluateToken(expression);
    } else if (expression.length < 1) {
      // Empty expression.
      // To create a better error message in the future.
      throw new Error("Empty expression.");
    }
    const firstToken = expression[0]; // First token in expression. Dictates what to do.
    if (firstToken instanceof Token) {
      // First token could be a special form.
      // Need to check and handle accordingly.
      switch (firstToken.type) {
        // Scheme 1
        case TokenType.DEFINE:
          // Assignment statements with no value.
          if (noStatements) {
            throw new SchemeParserError.UnexpectedTokenError(
              firstToken.line,
              firstToken.col,
              firstToken
            );
          }
          return this.evaluateDefine(expression);
        case TokenType.IF:
          return this.evaluateIf(expression);
        case TokenType.LAMBDA:
          return this.evaluateLambda(expression);
        case TokenType.LET:
          return this.evaluateLet(expression);
        case TokenType.BEGIN:
          return this.evaluateBegin(expression);
        case TokenType.COND:
          return this.evaluateCond(expression);
        case TokenType.ELSE:
          // This shouldn't exist outside of cond.
          throw new SchemeParserError.UnexpectedTokenError(
            firstToken.line,
            firstToken.col,
            firstToken
          );

        // Scheme 2
        case TokenType.QUOTE:
        case TokenType.UNQUOTE:
        case TokenType.QUASIQUOTE:

        // Scheme 3
        case TokenType.SET:
        case TokenType.VECTOR:

        // Outside SICP
        case TokenType.UNQUOTE_SPLICING:
          throw new SchemeParserError.UnsupportedTokenError(
            firstToken.line,
            firstToken.col,
            firstToken
          );
        default:
          // First token is not a special form.
          // Evaluate as a function call.
          return this.evaluateApplication(expression);
      }
    }
    // First token is not a token. but instead some sort of expression.
    // Top-level grouping definitely has no special form.
    // Evaluate as a function call.
    return this.evaluateApplication(expression);
  }

  /**
   * Evaluates a definition statement.
   *
   * @param statement A definition statement.
   */
  private evaluateDefine(statement: any[]): VariableDeclaration {
    // Validate statement.
    if (statement.length < 3) {
      throw new SchemeParserError.SyntaxError(
        statement[0].line,
        statement[0].col
      );
    }
    // Check whether this defines a variable or a function.
    if (statement[1] instanceof Array) {
      // It's a function.
      const identifiers = statement[1].map((token: Token | any[]) => {
				if (token instanceof Array) {
					// Error.
					throw new SchemeParserError.SyntaxError(
						statement[0].line,
						statement[0].col
					);
				}
        if (token.type !== TokenType.IDENTIFIER) {
          throw new SchemeParserError.SyntaxError(token.line, token.col);
        }
        return this.evaluateToken(token);
      });
      // We have previously checked if all of these values are identifiers.
      // Therefore, we can safely cast them to identifiers.
      const symbol: Identifier = identifiers[0] as Identifier;
      const params: Identifier[] = identifiers.slice(1) as Identifier[];
      const body: Statement[] = statement
        .slice(2, -1)
        .map((expression: Token | any[]) =>
          this.wrapInStatement(this.evaluate(expression, true))
        );
      body[body.length] = this.returnStatement(
        this.evaluate(statement[statement.length - 1])
      );
      return {
        type: "VariableDeclaration",
        loc: {
          start: {
            line: statement[0].line,
            column: statement[0].col,
          },
          end: body[body.length - 1].loc!.end,
        },
        declarations: [
          {
            type: "VariableDeclarator",
            loc: {
              start: symbol.loc!.start,
              end: body[body.length - 1].loc!.end,
            },
            id: symbol,
            init: {
              type: "FunctionExpression",
              loc: {
                start: symbol.loc!.start,
                end: body[body.length - 1].loc!.end,
              },
              id: null,
              params: params,
              body: {
                type: "BlockStatement",
                loc: {
                  start: body[0].loc!.start,
                  end: body[body.length - 1].loc!.end,
                },
                body: body,
              },
            },
          } as VariableDeclarator,
        ],
        kind: "let",
      };
    }
    // It's a variable.
    // Once again, validate statement.
    if (statement.length > 3) {
      throw new SchemeParserError.SyntaxError(
        statement[0].line,
        statement[0].col
      );
    }
    const symbol = this.evaluateToken(statement[1]);
    // Validate symbol.
    if (symbol.type !== "Identifier") {
      throw new SchemeParserError.SyntaxError(
        statement[1].line,
        statement[1].col
      );
    }
    const value = this.evaluate(statement[2], true) as Expression;
    return {
      type: "VariableDeclaration",
      loc: {
        start: {
          line: statement[0].line,
          column: statement[0].col,
        },
        end: value.loc!.end,
      },
      declarations: [
        {
          type: "VariableDeclarator",
          loc: {
            start: symbol.loc!.start,
            end: value.loc!.end,
          },
          id: symbol,
          init: value,
        } as VariableDeclarator,
      ],
      kind: "let",
    };
  }

  /**
   * Evaluates an if statement.
   *
   * @param expression An if expression.
   * @returns A conditional expression.
   */
  private evaluateIf(expression: any[]): ConditionalExpression {
    if (expression.length < 3 || expression.length > 4) {
      throw new SchemeParserError.SyntaxError(
        expression[0].line,
        expression[0].col
      );
    }
    const test = this.evaluate(expression[1], true) as Expression;
    const consequent = this.evaluate(expression[2], true) as Expression;
    const alternate =
      expression.length === 4
        ? (this.evaluate(expression[3], true) as Expression)
        : ({
            type: "Literal",
            loc: consequent.loc,
            value: null,
            raw: "null",
          } as Literal);
    return {
      type: "ConditionalExpression",
      loc: {
        start: test.loc!.start,
        end: alternate.loc!.end,
      },
      test: test,
      consequent: consequent,
      alternate: alternate,
    };
  }

  /**
   * Evaluates a conditional expression.
   *
   * @param expression A conditional expression.
   * @returns A conditional expression.
   */
  private evaluateCond(expression: any[]): ConditionalExpression {
    if (expression.length < 2) {
      throw new SchemeParserError.SyntaxError(
        expression[0].line,
        expression[0].col
      );
    }
    const clauses = expression.slice(1);
    const conditions: Expression[] = [];
    const bodies: Expression[] = [];
    let catchAll: Expression = {
      type: "Literal",
      value: undefined,
      raw: "undefined",
    } as Literal; // the body of the else clause.
    for (let i: number = 0; i < clauses.length; i++) {
      const clause = clauses[i];
      if (clause instanceof Array) {
        // Verify that the clause is not empty.
        if (clause.length < 1) {
          throw new SchemeParserError.SyntaxError(
            expression[0].line,
            expression[0].col
          );
        }
        // Check if this is an else clause.
        if (clause[0].type === TokenType.ELSE) {
          if (i < clauses.length - 1) {
            throw new SchemeParserError.SyntaxError(
              clause[0].line,
              clause[0].col
            );
          }
          if (clause.length < 2) {
            throw new SchemeParserError.SyntaxError(
              clause[0].line,
              clause[0].col
            );
          }
          catchAll = this.evaluateBody(clause.slice(1));
        } else {
          const test: Expression = this.evaluate(clause[0], true) as Expression;
          conditions.push(test);
          bodies.push(
            clause.length < 2 ? test : this.evaluateBody(clause.slice(1))
          );
          catchAll.loc = bodies[bodies.length - 1].loc;
          catchAll.loc!.start = catchAll.loc!.end;
        }
      } else {
        // it MUST be an array.
        throw new SchemeParserError.SyntaxError(
          expression[0].line,
          expression[0].col
        );
      }
    }
    let finalConditionalExpression: Expression = catchAll;
    for (let i: number = conditions.length - 1; i >= 0; i--) {
      finalConditionalExpression = {
        type: "ConditionalExpression",
        loc: {
          start: conditions[i].loc!.start,
          end: finalConditionalExpression!.loc!.end,
        },
        test: conditions[i],
        consequent: bodies[i],
        alternate: finalConditionalExpression!,
      };
    }
    // There is at least one conditional expression.
    // This cast is safe.
    return finalConditionalExpression as ConditionalExpression;
  }

  /**
   * Evaluates a lambda expression.
   *
   * @param expression A lambda expression.
   * @returns A function expression.
   */
  private evaluateLambda(expression: any[]): FunctionExpression {
    if (expression.length < 3) {
      throw new SchemeParserError.SyntaxError(
        expression[0].line,
        expression[0].col
      );
    }
    if (!(expression[1] instanceof Array)) {
      throw new SchemeParserError.SyntaxError(
        expression[1].line,
        expression[1].col
      );
    }
    const params: Identifier[] = expression[1].map((param: any) => {
   		if (param instanceof Array) {
				throw new SchemeParserError.SyntaxError(
					expression[0].line,
					expression[0].col
				);
			}   
			if (param.type !== TokenType.IDENTIFIER) {
        throw new SchemeParserError.SyntaxError(param.line, param.col);
      }
      // We have evaluated that this is an identifier.
      return this.evaluateToken(param) as Identifier;
    });
    const body: Statement[] = expression
      .slice(2, -1)
      .map((expression: Token | any[]) =>
        this.wrapInStatement(this.evaluate(expression, true))
      );
    body[body.length] = this.returnStatement(
      this.evaluate(expression[expression.length - 1])
    );
    return {
      type: "FunctionExpression",
      loc: {
        start: expression[0].start,
        end: body[body.length - 1].loc!.end,
      },
      id: null,
      params: params,
      body: {
        type: "BlockStatement",
        loc: body[body.length - 1].loc,
        body: body,
      },
      generator: false,
    };
  }

  /**
   * Evaluates a begin expression.
   * Also evaluates implicit begins.
   *
   * @param expression A begin expression.
   * @returns An expression.
   */
  private evaluateBegin(expression: any[]): CallExpression {
    const beginBody = this.evaluateBody(expression.slice(1));
    beginBody.loc!.start = {
      line: expression[0].line,
      column: expression[0].col,
    };
    return beginBody;
  }

  /**
   * Evaluates a body expression
   * Equivalent to evaluating a JavaScript block statement,
   * except this returns a value too.
   *
   * @param expression A body expression.
   * @returns An Immediately Invoked Function Expression (IIFE).
   */
  private evaluateBody(expression: any[]): CallExpression {
    const body: Statement[] = [];
    if (expression.length > 0) {
      body.push(
        ...expression
          .slice(0, -1)
          .map((expression: any) =>
            this.wrapInStatement(this.evaluate(expression))
          )
      );
      body.push(
        this.returnStatement(this.evaluate(expression[expression.length - 1]))
      );
    }
    return {
      type: "CallExpression",
      loc:
        body[0] !== undefined
          ? {
              start: body[0].loc!.start,
              end: body[body.length - 1].loc!.end,
            }
          : undefined,
      callee: {
        type: "FunctionExpression",
        loc:
          body[0] !== undefined
            ? {
                start: body[0].loc!.start,
                end: body[body.length - 1].loc!.end,
              }
            : undefined,
        id: null,
        params: [],
        body: {
          type: "BlockStatement",
          loc:
            body[0] !== undefined
              ? {
                  start: body[0].loc!.start,
                  end: body[body.length - 1].loc!.end,
                }
              : undefined,
          body: body,
        },
      },
      arguments: [],
      optional: false,
    };
  }

  /**
   * Evaluates a let expression.
   *
   * @param expression A let expression.
   * @returns An IIFE.
   */
  private evaluateLet(expression: any[]): CallExpression {
    if (expression.length < 3) {
      throw new SchemeParserError.SyntaxError(
        expression[0].line,
        expression[0].col
      );
    }
    if (!(expression[1] instanceof Array)) {
      throw new SchemeParserError.SyntaxError(
        expression[1].line,
        expression[1].col
      );
    }
    const declarations: any[] = expression[1].map((declaration: any[]) => {
   		if (!(declaration instanceof Array)) {
				throw new SchemeParserError.SyntaxError(
					declaration.line,
					declaration.col
				);
			}   
			if (declaration.length !== 2) {
        throw new SchemeParserError.SyntaxError(
          expression[0].line,
          expression[0].col
        );
      }
			if (!(declaration[0] instanceof Token)) {
				throw new SchemeParserError.SyntaxError(
					expression[0].line,
					expression[0].col
				);
			}
      if (declaration[0].type !== TokenType.IDENTIFIER) {
        throw new SchemeParserError.SyntaxError(
          declaration[0].line,
          declaration[0].col
        );
      }
      const token = this.evaluateToken(declaration[0]);
      const value = this.evaluate(declaration[1], true) as Expression;
      return {
        type: "VariableDeclaration",
        loc: {
          start: token.loc!.start,
          end: value.loc!.end,
        },
        declarations: [
          {
            type: "VariableDeclarator",
            loc: {
              start: token.loc!.start,
              end: value.loc!.end,
            },
            id: token,
            init: value,
          } as VariableDeclarator,
        ],
        kind: "let",
      };
    });
    const body: CallExpression = this.evaluateBody(expression.slice(2));
    if (declarations.length > 0) {
      const IIFE = body.callee as FunctionExpression;
      const block = IIFE.body as BlockStatement;
      block.body = declarations.concat(block.body);
    }
    body.loc!.start = {
      line: expression[0].line,
      column: expression[0].col,
    };
    return body;
  }

  /**
   * Evaluates an application.
   * An application is a function call.
   *
   * @param expression An expression.
   * @returns A call expression.
   */
  private evaluateApplication(expression: any[]): CallExpression {
    const procedure = this.evaluate(expression[0]);
    const args = expression.slice(1).map((arg) => this.evaluate(arg, true));
    return {
      type: "CallExpression",
      loc: {
        start: procedure.loc!.start,
        end:
          args.length > 0 ? args[args.length - 1].loc!.end : procedure.loc!.end,
      },
      callee: procedure as Expression | Identifier | Literal | CallExpression,
      arguments: args as Expression[], // safe to typecast, as we have already
      //predetermined that the arguments are expressions.
      optional: false,
    };
  }

  /**
   * Evaluates a token.
   *
   * @param token A token, which should be an expression.
   *              Either a literal or an identifier.
   * @returns An expression.
   * @throws SchemeParserError.UnexpectedTokenError
   */
  private evaluateToken(token: Token): Literal | Identifier {
    switch (token.type) {
      case TokenType.NUMBER:
      case TokenType.BOOLEAN:
      case TokenType.STRING:
        return {
          type: "Literal",
          value: token.literal,
          raw: token.lexeme,
          loc: this.toSourceLocation(token),
        };
      case TokenType.IDENTIFIER:
        return {
          type: "Identifier",
          name: token.lexeme,
          loc: this.toSourceLocation(token),
        };
      default:
        throw new SchemeParserError.UnexpectedTokenError(
          token.line,
          token.col,
          token
        );
    }
  }

  /**
   * Wraps a node in a statement if necessary.
   *
   * @param expression An expression.
   * @returns A statement.
   */
  private wrapInStatement(expression: Expression | Statement): Statement {
    if (this.isStatement(expression)) {
      return expression;
    }
    return {
      type: "ExpressionStatement",
      expression: expression,
      loc: expression.loc,
    } as ExpressionStatement;
  }

  /**
   * Turns a value into a return statement.
   *
   * @param expression An expression.
   * @returns A statement.
   */
  private returnStatement(expression: Expression | Statement): ReturnStatement {
    if (this.isStatement(expression)) {
      // If the expression is actually a statement,
      // it returns undefined
      return {
        type: "ReturnStatement",
        loc: expression.loc,
      };
    }
    return {
      type: "ReturnStatement",
      argument: expression,
      loc: expression.loc,
    };
  }

  /**
   * Typeguard to determine if a node is a statement.
   *
   * @param maybeStatement A node.
   * @returns True if the node is a statement.
   */
  private isStatement(
    maybeStatement: Expression | Statement
  ): maybeStatement is Statement {
    return (
      maybeStatement.type.includes("Statement") ||
      maybeStatement.type.includes("Declaration")
    );
  }

  /**
   * Evaluates the proper sourceLocation for an expression.
   * @returns The sourceLocation for an expression.
   */
  private toSourceLocation(startToken: Token): SourceLocation {
    return {
      start: {
        line: startToken.line,
        column: startToken.col,
      } as Position,
      end: {
        line: startToken.line,
        column: startToken.col + startToken.lexeme.length,
      } as Position,
    };
  }

  parse(): Program {
    while (!this.isAtEnd()) {
      let currentStatement = this.grouping();
      if (currentStatement[0].type !== TokenType.EOF) {
        // "Unwrap" the exterior grouping
        currentStatement = currentStatement[0];
        this.estree.body.push(
          this.wrapInStatement(this.evaluate(currentStatement))
        );
      }
    }
    return this.estree;
  }
}
