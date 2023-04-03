import { Token } from "./tokenizer";
import { TokenType } from "./token-type";
import { ParserError } from "./error";
import {
  Program,
  Expression,
  Statement,
  ExpressionStatement,
  ReturnStatement,
  VariableDeclaration,
  VariableDeclarator,
  CallExpression,
  ArrowFunctionExpression,
  Literal,
  Identifier,
  SourceLocation,
  Position,
  ConditionalExpression,
  AssignmentExpression,
  ImportSpecifier,
  ModuleDeclaration,
} from "estree";

export class Parser {
  private readonly source: string;
  private readonly tokens: Token[];
  private readonly estree: Program;
  private readonly chapter: number;
  private current: number = 0;

  constructor(source: string, tokens: Token[], chapter: number = 100) {
    this.source = source;
    this.tokens = tokens;
    this.chapter = chapter;
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

  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  private validateChapter(c: Token, chapter: number): void {
    if (this.chapter < chapter) {
        throw new ParserError.DisallowedTokenError(
          this.source,
          c.line,
          c.col,
          c,
          this.chapter
        );
    }
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
            throw new ParserError.UnexpectedTokenError(this.source, c.line, c.col, c);
          } else if (
            !this.matchingParentheses(openparen as TokenType, c.type)
          ) {
            // ^ safe to cast openparen as this only executes
            // if inList is true, which is only the case if openparen exists
            throw new ParserError.ParenthesisMismatchError(this.source, c.line, c.col);
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
        case TokenType.IMPORT:
        case TokenType.EXPORT:
        case TokenType.BEGIN:
        case TokenType.DELAY:
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
        case TokenType.DOT:
          tokens.push(c);
          break;
        case TokenType.EOF:
          if (inList) {
            throw new ParserError.UnexpectedEOFError(this.source, c.line, c.col);
          } else {
            tokens.push(c);
          }
          break;
        default:
          throw new ParserError.UnexpectedTokenError(this.source, c.line, c.col, c);
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
   * @param onlyExpressions Option to force expressions.
   * @param topLevel Whether the expression is top level.
   * @returns An evaluated expression.
   */
  private evaluate(
    expression: Token | any[]
  ): Statement | Expression | ModuleDeclaration;
  private evaluate(
    expression: Token | any[],
    onlyExpressions: boolean
  ): Statement | Expression | ModuleDeclaration;
  private evaluate(
    expression: Token | any[],
    onlyExpressions: boolean,
    topLevel: boolean
  ): Statement | Expression | ModuleDeclaration;
  private evaluate(
    expression: Token | any[],
    onlyExpressions = false,
    topLevel = false
  ): Statement | Expression | ModuleDeclaration {
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
          if (onlyExpressions) {
            throw new ParserError.UnexpectedTokenError(this.source, 
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
        case TokenType.COND:
          return this.evaluateCond(expression);
        case TokenType.ELSE:
          // This shouldn't exist outside of cond.
          throw new ParserError.UnexpectedTokenError(this.source, 
            firstToken.line,
            firstToken.col,
            firstToken
          );

        // Scheme 2
        case TokenType.QUOTE:
        case TokenType.QUASIQUOTE:
          this.validateChapter(firstToken, 2);
          return this.evaluateQuote(expression);
        case TokenType.UNQUOTE:
          // This shouldn't exist outside of unquotes.
          throw new ParserError.UnexpectedTokenError(this.source, 
            firstToken.line,
            firstToken.col,
            firstToken
          );

        // Scheme 3
        case TokenType.SET:
          this.validateChapter(firstToken, 3);
          return this.evaluateSet(expression);
        case TokenType.BEGIN:
          this.validateChapter(firstToken, 3);
          return this.evaluateBegin(expression);
        case TokenType.DELAY:
          this.validateChapter(firstToken, 3);
          return this.evaluateDelay(expression);

        // Not in SICP but required for Source
        case TokenType.IMPORT:
          if (onlyExpressions) {
            throw new ParserError.UnexpectedTokenError(this.source, 
              firstToken.line,
              firstToken.col,
              firstToken
            );
          }
          if (!topLevel) {
            throw new ParserError.UnexpectedTokenError(this.source, 
              firstToken.line,
              firstToken.col,
              firstToken
            );
          }
          return this.evaluateImport(expression);
        case TokenType.EXPORT:
          if (onlyExpressions) {
            throw new ParserError.UnexpectedTokenError(this.source, 
              firstToken.line,
              firstToken.col,
              firstToken
            );
          }
          if (!topLevel) {
            throw new ParserError.UnexpectedTokenError(this.source, 
              firstToken.line,
              firstToken.col,
              firstToken
            );
          }
          return this.evaluateExport(expression);
        case TokenType.DOT:
          // This shouldn't exist here
          throw new ParserError.UnexpectedTokenError(this.source, 
            firstToken.line,
            firstToken.col,
            firstToken
          );

        // Outside SICP
        case TokenType.VECTOR:
        case TokenType.UNQUOTE_SPLICING:
          throw new ParserError.UnsupportedTokenError(this.source, 
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
   * Evaluates a delay procedure call.
   * 
   * @param expression A delay procedure call in Scheme.
   * @returns A lambda function that takes no arguments and returns the delayed expression.
   */
  private evaluateDelay(expression: any[]): ArrowFunctionExpression {
    if (expression.length !== 2) {
      throw new ParserError.GenericSyntaxError(this.source, 
        expression[0].line,
        expression[0].col
      );
    }
    const delayed: Statement = this.returnStatement(
      this.evaluate(expression[1], true, false)
    );
    return {
      type: "ArrowFunctionExpression",
      loc: {
        start: this.toSourceLocation(expression[0]).start,
        end: delayed.loc!.end
      },
      params: [],
      body: {
        type: "BlockStatement",
        loc: delayed.loc,
        body: [delayed]
      },
      expression: false
    };
  }

  /**
   * Evaluates an import statement.
   * Special syntax for importing modules, using a similar syntax to JS.
   * (import "module-name" (imported-name1 imported-name2 ...))
   *
   * @param expression An import statement in Scheme.
   * @returns An import statement in estree form.
   */
  private evaluateImport(expression: any[]): ModuleDeclaration {
    if (
      expression.length < 3 ||
      !(expression[1] instanceof Token) ||
      !(expression[2] instanceof Array)
    ) {
      throw new ParserError.GenericSyntaxError(this.source, 
        expression[0].line,
        expression[0].col
      );
    }
    const specifiers: ImportSpecifier[] = [];
    for (let i = 0; i < expression[2].length; i++) {
      if (!(expression[2][i] instanceof Token)) {
        throw new ParserError.GenericSyntaxError(this.source, 
          expression[0].line,
          expression[0].col
        );
      }
      specifiers.push({
        type: "ImportSpecifier",
        local: this.evaluate(expression[2][i]) as Identifier,
        imported: this.evaluate(expression[2][i]) as Identifier,
        loc: this.toSourceLocation(expression[2][i]),
      });
    }
    return {
      type: "ImportDeclaration",
      specifiers: specifiers,
      source: this.evaluate(expression[1]) as Literal,
      loc: this.toSourceLocation(
        expression[0],
        expression[2][expression[2].length - 1]
      ),
    };
  }

  /**
   * Evaluates an export statement.
   * Similar syntax to JS, wherein export "wraps" around a declaration.
   *
   * (export (define ...))
   * @param expression An export statement in Scheme.
   * @returns An export statement in estree form.
   */
  private evaluateExport(expression: any[]): ModuleDeclaration {
    if (expression.length !== 2) {
      throw new ParserError.GenericSyntaxError(this.source, 
        expression[0].line,
        expression[0].col
      );
    }
    if (
      !(expression[1][0] instanceof Token) ||
      expression[1][0].type !== TokenType.DEFINE
    ) {
      throw new ParserError.GenericSyntaxError(this.source, 
        expression[0].line,
        expression[0].col
      );
    }
    const declaration = this.evaluate(expression[1]) as VariableDeclaration;
    return {
      type: "ExportNamedDeclaration",
      declaration: declaration,
      specifiers: [],
      source: null,
      loc: {
        start: this.toSourceLocation(expression[0]).start,
        end: declaration.loc!.end,
      },
    };
  }

  /**
   * Evaluates a quote statement.
   *
   * @param expression A quote statement.
   * @returns An expression. Can be a Literal, NewExpression
   */
  private evaluateQuote(expression: any[]): Expression;
  private evaluateQuote(expression: any[], quasiquote: boolean): Expression;
  private evaluateQuote(expression: any[], quasiquote?: boolean): Expression {
    if (expression.length !== 2) {
      throw new ParserError.GenericSyntaxError(this.source, 
        expression[0].line,
        expression[0].col
      );
    }
    if (quasiquote === undefined) {
      quasiquote = expression[0].type === TokenType.QUASIQUOTE;
    }
    const quotedVal: Expression = this.quote(expression[1], quasiquote);
    // Sanitize location information.
    const formattedLoc = this.toSourceLocation(expression[0]);
    if (quotedVal.loc === undefined) {
      quotedVal.loc = formattedLoc;
    } else {
      quotedVal.loc!.start = formattedLoc.start;
    }
    return quotedVal;
  }

  /**
   * Quote
   */
  private quote(expression: any, quasiquote: boolean): Expression {
    if (expression instanceof Token) {
      switch (expression.type) {
        case TokenType.NUMBER:
        case TokenType.STRING:
        case TokenType.BOOLEAN:
          // Literals
          return this.evaluateToken(expression);
        default:
          // Everything else
          return this.symbol(expression);
      }
    }
    // Array
    // Empty list
    if (expression.length < 1) {
      return this.list([]);
    }
    if (expression[0].type === TokenType.UNQUOTE && quasiquote) {
      // "Unquote" the expression.
      // It MUST be an expression.
      return this.evaluate(expression[1], true) as Expression;
    }
    // Determines whether the quote is parsing a list or a pair.
    var hasDot = false;
    const listElements1: Expression[] = [];
    const listElements2: Expression[] = [];
    for (var i = 0; i < expression.length; i++) {
      if (expression[i].type === TokenType.DOT) {
        if (hasDot) {
          throw new ParserError.GenericSyntaxError(this.source, 
            expression[i].line,
            expression[i].col
          );
        } else {
          hasDot = true;
        }
      } else {
        if (hasDot) {
          listElements2.push(this.quote(expression[i], quasiquote));
        } else {
          listElements1.push(this.quote(expression[i], quasiquote));
        }
      }
    }
    if (hasDot) {
      if (listElements2.length !== 1) {
        throw new ParserError.GenericSyntaxError(this.source, 
          expression[0].line,
          expression[0].col
        );
      }
      if (listElements1.length < 1) {
        return listElements2[0];
      }
      return this.pair(
        listElements1.length < 2 ? listElements1[0] : this.list(listElements1),
        listElements2[0]
      );
    }
    return this.list(listElements1);
  }

  /**
   * Converts any non-literal into a Symbol representing their
   * name.
   *
   * @param token A token.
   * @returns A call to string->symbol.
   */
  private symbol(token: Token): CallExpression {
    const loc = this.toSourceLocation(token);
    return {
      type: "CallExpression",
      loc: loc,
      callee: {
        type: "Identifier",
        loc: loc,
        name: "string->symbol",
      },
      arguments: [
        {
          type: "Literal",
          loc: loc,
          value: token.lexeme,
          raw: `"${token.lexeme}"`,
        },
      ],
      optional: false,
    };
  }

  /**
   * Creates a pair from two expressions.
   */
  private pair(car: Expression, cdr: Expression): CallExpression {
    return {
      type: "CallExpression",
      loc: {
        start: car.loc!.start,
        end: cdr.loc!.end,
      },
      callee: {
        type: "Identifier",
        loc: {
          start: car.loc!.start,
          end: cdr.loc!.end,
        },
        name: "cons",
      },
      arguments: [car, cdr],
      optional: false,
    };
  }

  /**
   * Converts an array of Expressions into a list.
   */
  private list(expressions: Expression[]): CallExpression {
    return {
      type: "CallExpression",
      loc:
        expressions.length > 1
          ? ({
              start: expressions[0].loc!.start,
              end: expressions[expressions.length - 1].loc!.end,
            } as SourceLocation)
          : undefined,
      callee: {
        type: "Identifier",
        loc:
          expressions.length > 1
            ? ({
                start: expressions[0].loc!.start,
                end: expressions[expressions.length - 1].loc!.end,
              } as SourceLocation)
            : undefined,
        name: "list",
      },
      arguments: expressions,
      optional: false,
    };
  }

  /**
   * Evaluates a set expression.
   * Direct equivalent to AssignmentExpression.
   * !!! R7RS STATES THAT THE RETURN VALUE OF SET! IS UNSPECIFIED.
   * !!! THIS IMPLEMENTATION RETURNS THE VALUE OF THE ASSIGNMENT.
   *
   * @param expression A token.
   * @returns An assignment axpression.
   */
  private evaluateSet(expression: any[]): AssignmentExpression {
    if (expression.length !== 3) {
      throw new ParserError.GenericSyntaxError(this.source, 
        expression[0].line,
        expression[0].col
      );
    }
    if (
      !(expression[1] instanceof Token) ||
      expression[1].type !== TokenType.IDENTIFIER
    ) {
      throw new ParserError.GenericSyntaxError(this.source, 
        expression[0].line,
        expression[0].col
      );
    }
    // Safe to cast as we have prederermined that it is an identifier.
    const identifier: Identifier = this.evaluateToken(
      expression[1]
    ) as Identifier;
    const newValue: Expression = this.evaluate(expression[2]) as Expression;
    return {
      type: "AssignmentExpression",
      loc: {
        start: {
          line: expression[0].line,
          column: expression[0].col,
        },
        end: newValue.loc!.end,
      },
      operator: "=",
      left: identifier,
      right: newValue,
    };
  }

  /**
   * Evaluates a definition statement.
   *
   * @param statement A definition statement.
   */
  private evaluateDefine(statement: any[]): VariableDeclaration {
    // Validate statement.
    if (statement.length < 3) {
      throw new ParserError.GenericSyntaxError(this.source, 
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
          throw new ParserError.GenericSyntaxError(this.source, 
            statement[0].line,
            statement[0].col
          );
        }
        if (token.type !== TokenType.IDENTIFIER) {
          throw new ParserError.GenericSyntaxError(this.source, token.line, token.col);
        }
        return this.evaluateToken(token);
      });
      // We have previously checked if all of these values are identifiers.
      // Therefore, we can safely cast them to identifiers.
      const symbol: Identifier = identifiers[0] as Identifier;
      const params: Identifier[] = identifiers.slice(1) as Identifier[];
      const body: Statement[] = [];
      let definitions = true;
      for (let i = 2; i < statement.length; i++) {
        if (
          statement[i] instanceof Token ||
          statement[i][0].type !== TokenType.DEFINE
        ) {
          // The definitions block is over.
          definitions = false;
          body.push(
            i < statement.length - 1
              ? // Safe to cast as module declarations are only top level.
                (this.wrapInStatement(this.evaluate(statement[i])) as Statement)
              : (this.returnStatement(this.evaluate(statement[i])) as Statement)
          );
        } else {
          if (definitions) {
            body.push(
              this.wrapInStatement(this.evaluate(statement[i])) as Statement
            );
          } else {
            // The definitons block is over, and yet there is a define.
            throw new ParserError.GenericSyntaxError(this.source, 
              statement[i][0].line,
              statement[i][0].col
            );
          }
        }
      }
      return {
        type: "VariableDeclaration",
        loc: {
          start: this.toSourceLocation(statement[0]).start,
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
              type: "ArrowFunctionExpression",
              loc: {
                start: symbol.loc!.start,
                end: body[body.length - 1].loc!.end,
              },
              params: params,
              body: {
                type: "BlockStatement",
                loc: {
                  start: body[0].loc!.start,
                  end: body[body.length - 1].loc!.end,
                },
                body: body,
              },
              expression: false,
            },
          } as VariableDeclarator,
        ],
        kind: "let",
      };
    }
    // It's a variable.
    // Once again, validate statement.
    if (statement.length > 3) {
      throw new ParserError.GenericSyntaxError(this.source, 
        statement[0].line,
        statement[0].col
      );
    }
    const symbol = this.evaluateToken(statement[1]);
    // Validate symbol.
    if (symbol.type !== "Identifier") {
      throw new ParserError.GenericSyntaxError(this.source, 
        statement[1].line,
        statement[1].col
      );
    }
    const value = this.evaluate(statement[2], true) as Expression;
    return {
      type: "VariableDeclaration",
      loc: {
        start: this.toSourceLocation(statement[0]).start,
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
      throw new ParserError.GenericSyntaxError(this.source, 
        expression[0].line,
        expression[0].col
      );
    }
    // Convert JavaScript's truthy/falsy values to Scheme's true/false.
    const test_val = this.evaluate(expression[1], true) as Expression;
    const test = {
      type: "CallExpression",
      loc: test_val.loc,
      callee: {
        type: "Identifier",
        loc: test_val.loc,
        name: "$true",
      },
      arguments: [test_val],
    } as Expression;
    const consequent = this.evaluate(expression[2], true) as Expression;
    const alternate =
      expression.length === 4
        ? (this.evaluate(expression[3], true) as Expression)
        : ({
            type: "Identifier",
            loc: consequent.loc,
            name: "undefined",
          } as Identifier);
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
      throw new ParserError.GenericSyntaxError(this.source, 
        expression[0].line,
        expression[0].col
      );
    }
    const clauses = expression.slice(1);
    const conditions: Expression[] = [];
    const bodies: Expression[] = [];
    let catchAll: Expression = {
      type: "Identifier",
      name: "undefined",
    } as Identifier; // the body of the else clause.
    for (let i: number = 0; i < clauses.length; i++) {
      const clause = clauses[i];
      if (clause instanceof Array) {
        // Verify that the clause is not empty.
        if (clause.length < 1) {
          throw new ParserError.GenericSyntaxError(this.source, 
            expression[0].line,
            expression[0].col
          );
        }
        // Check if this is an else clause.
        if (clause[0].type === TokenType.ELSE) {
          if (i < clauses.length - 1) {
            throw new ParserError.GenericSyntaxError(this.source, 
              clause[0].line,
              clause[0].col
            );
          }
          if (clause.length < 2) {
            throw new ParserError.GenericSyntaxError(this.source, 
              clause[0].line,
              clause[0].col
            );
          }
          catchAll = this.evaluateBody(clause.slice(1));
        } else {
          const test_val: Expression = this.evaluate(
            clause[0],
            true
          ) as Expression;
          // Convert JavaScript's truthy/falsy values to Scheme's true/false.
          const test: Expression = {
            type: "CallExpression",
            loc: test_val.loc,
            callee: {
              type: "Identifier",
              loc: test_val.loc,
              name: "$true",
            },
            arguments: [test_val],
          } as Expression;
          conditions.push(test);
          bodies.push(
            clause.length < 2 ? test_val : this.evaluateBody(clause.slice(1))
          );
          catchAll.loc = bodies[bodies.length - 1].loc;
          catchAll.loc!.start = catchAll.loc!.end;
        }
      } else {
        throw new ParserError.GenericSyntaxError(this.source, 
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
  private evaluateLambda(expression: any[]): ArrowFunctionExpression {
    if (expression.length < 3) {
      throw new ParserError.GenericSyntaxError(this.source, 
        expression[0].line,
        expression[0].col
      );
    }
    if (!(expression[1] instanceof Array)) {
      throw new ParserError.GenericSyntaxError(this.source, 
        expression[1].line,
        expression[1].col
      );
    }
    const params: Identifier[] = expression[1].map((param: any) => {
      if (param instanceof Array) {
        throw new ParserError.GenericSyntaxError(this.source, 
          expression[0].line,
          expression[0].col
        );
      }
      if (param.type !== TokenType.IDENTIFIER) {
        throw new ParserError.GenericSyntaxError(this.source, param.line, param.col);
      }
      // We have evaluated that this is an identifier.
      return this.evaluateToken(param) as Identifier;
    });
    const body: Statement[] = [];
    let definitions = true;
    for (let i = 2; i < expression.length; i++) {
      if (
        expression[i] instanceof Token ||
        expression[i][0].type !== TokenType.DEFINE
      ) {
        // The definitions block is over.
        definitions = false;
        body.push(
          i < expression.length - 1
            ? // Safe to cast as module declarations are only top level.
              (this.wrapInStatement(this.evaluate(expression[i])) as Statement)
            : (this.returnStatement(this.evaluate(expression[i])) as Statement)
        );
      } else {
        if (definitions) {
          body.push(
            this.wrapInStatement(this.evaluate(expression[i])) as Statement
          );
        } else {
          // The definitons block is over, and yet there is a define.
          throw new ParserError.GenericSyntaxError(this.source, 
            expression[i][0].line,
            expression[i][0].col
          );
        }
      }
    }
    return {
      type: "ArrowFunctionExpression",
      loc: {
        start: this.toSourceLocation(expression[0]).start,
        end: body[body.length - 1].loc!.end,
      },
      params: params,
      body: {
        type: "BlockStatement",
        loc: {
          start: body[0].loc!.start,
          end: body[body.length - 1].loc!.end,
        },
        body: body,
      },
      expression: false,
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
    beginBody.loc!.start = this.toSourceLocation(expression[0]).start;
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
    let definitions = true;
    for (let i = 0; i < expression.length; i++) {
      if (
        expression[i] instanceof Token ||
        expression[i][0].type !== TokenType.DEFINE
      ) {
        // The definitions block is over.
        definitions = false;
        body.push(
          i < expression.length - 1
            ? // Safe to cast as module declarations are only top level.
              (this.wrapInStatement(this.evaluate(expression[i])) as Statement)
            : (this.returnStatement(this.evaluate(expression[i])) as Statement)
        );
      } else {
        if (definitions) {
          body.push(
            this.wrapInStatement(this.evaluate(expression[i])) as Statement
          );
        } else {
          // The definitions block is over, and yet there is a define.
          throw new ParserError.GenericSyntaxError(this.source, 
            expression[i][0].line,
            expression[i][0].col
          );
        }
      }
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
        type: "ArrowFunctionExpression",
        loc:
          body[0] !== undefined
            ? {
                start: body[0].loc!.start,
                end: body[body.length - 1].loc!.end,
              }
            : undefined,
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
        expression: false,
      },
      arguments: [],
      optional: false,
    };
  }

  /**
   * Evaluates a let expression.
   * let is syntactic sugar for an invoked lambda procedure.
   *
   * @param expression A let expression.
   * @returns An IIFE.
   */
  private evaluateLet(expression: any[]): CallExpression {
    if (expression.length < 3) {
      throw new ParserError.GenericSyntaxError(this.source, 
        expression[0].line,
        expression[0].col
      );
    }
    if (!(expression[1] instanceof Array)) {
      throw new ParserError.GenericSyntaxError(this.source, 
        expression[1].line,
        expression[1].col
      );
    }
    const declaredVariables: Identifier[] = [];
    const declaredValues: Expression[] = [];
    for (let i = 0; i < expression[1].length; i++) {
      if (!(expression[1][i] instanceof Array)) {
        throw new ParserError.GenericSyntaxError(this.source, 
          expression[1][i].line,
          expression[1][i].col
        );
      }
      if (expression[1][i].length !== 2) {
        throw new ParserError.GenericSyntaxError(this.source, 
          expression[1][i][0].line,
          expression[1][i][0].col
        );
      }
      if (!(expression[1][i][0] instanceof Token)) {
        throw new ParserError.GenericSyntaxError(this.source, 
          expression[1][i][0].line,
          expression[1][i][0].col
        );
      }
      if (expression[1][i][0].type !== TokenType.IDENTIFIER) {
        throw new ParserError.GenericSyntaxError(this.source, 
          expression[1][i][0].line,
          expression[1][i][0].col
        );
      }
      // Safe to cast as we have determined that the token is an identifier.
      declaredVariables.push(
        this.evaluateToken(expression[1][i][0]) as Identifier
      );
      // Safe to cast as the "true" flag guarantees an expression.
      declaredValues.push(
        this.evaluate(expression[1][i][1], true) as Expression
      );
    }
    const body: Statement[] = [];
    let definitions = true;
    for (let i = 2; i < expression.length; i++) {
      if (
        expression[i] instanceof Token ||
        expression[i][0].type !== TokenType.DEFINE
      ) {
        // The definitions block is over.
        definitions = false;
        body.push(
          i < expression.length - 1
            ? // Safe to cast as module declarations are only top level.
              (this.wrapInStatement(this.evaluate(expression[i])) as Statement)
            : (this.returnStatement(this.evaluate(expression[i])) as Statement)
        );
      } else {
        if (definitions) {
          body.push(
            this.wrapInStatement(this.evaluate(expression[i])) as Statement
          );
        } else {
          // The definitons block is over, and yet there is a define.
          throw new ParserError.GenericSyntaxError(this.source, 
            expression[i][0].line,
            expression[i][0].col
          );
        }
      }
    }
    return {
      type: "CallExpression",
      loc: {
        start: this.toSourceLocation(expression[0]).start,
        end: body[body.length - 1].loc!.end,
      },
      callee: {
        type: "ArrowFunctionExpression",
        loc:
          declaredVariables.length > 0
            ? {
                start: declaredVariables[0].loc!.start,
                end: body[body.length - 1].loc!.end,
              }
            : {
                start: body[0].loc!.start,
                end: body[body.length - 1].loc!.end,
              },
        params: declaredVariables,
        body: {
          type: "BlockStatement",
          loc: {
            start: body[0].loc!.start,
            end: body[body.length - 1].loc!.end,
          },
          body: body,
        },
        expression: false,
      },
      arguments: declaredValues,
      optional: false,
    };
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
   * @throws ParserError.UnexpectedTokenError
   */
  private evaluateToken(token: Token): Literal | Identifier {
    switch (token.type) {
      case TokenType.NUMBER:
      case TokenType.BOOLEAN:
      case TokenType.STRING:
        return {
          type: "Literal",
          value: token.literal,
          raw: token.type === TokenType.BOOLEAN
          ? (token.literal ? "true" : "false")
          : token.lexeme,
          loc: this.toSourceLocation(token),
        };
      case TokenType.IDENTIFIER:
        return {
          type: "Identifier",
          name: token.lexeme,
          loc: this.toSourceLocation(token),
        };
      default:
        throw new ParserError.UnexpectedTokenError(this.source, 
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
  private wrapInStatement(
    expression: Expression | Statement | ModuleDeclaration
  ): Statement | ModuleDeclaration {
    if (this.isExpression(expression)) {
      return {
        type: "ExpressionStatement",
        expression: expression,
        loc: expression.loc,
      } as ExpressionStatement;
    }
    return expression;
  }

  /**
   * Turns a value into a return statement.
   *
   * @param expression An expression.
   * @returns A statement.
   */
  private returnStatement(
    expression: Expression | Statement | ModuleDeclaration
  ): ReturnStatement {
    if (this.isExpression(expression)) {
      // Return the expression wrapped in a return statement.

      return {
        type: "ReturnStatement",
        argument: expression,
        loc: expression.loc,
      };
    }
    // If the expression is not a expression, return a return statement with no argument.
    return {
      type: "ReturnStatement",
      argument: {
        type: "Identifier",
        name: "undefined",
        loc: expression.loc,
      },
      loc: expression.loc,
    };
  }

  /**
   * Typeguard to determine if a node is an expression.
   *
   * @param maybeExpression A node.
   * @returns True if the node is an expression.
   */
  private isExpression(
    maybeStatement: Expression | Statement | ModuleDeclaration
  ): maybeStatement is Expression {
    return (
      !maybeStatement.type.includes("Statement") &&
      !maybeStatement.type.includes("Declaration")
    );
  }

  /**
   * Evaluates the proper sourceLocation for an expression.
   * @returns The sourceLocation for an expression.
   */
  private toSourceLocation(startToken: Token): SourceLocation;
  private toSourceLocation(startToken: Token, endToken: Token): SourceLocation;
  private toSourceLocation(
    startToken: Token,
    endToken?: Token
  ): SourceLocation {
    return {
      start: {
        line: startToken.line,
        column: startToken.col,
      } as Position,
      end: {
        line: endToken == undefined ? startToken.line : endToken.line,
        column:
          endToken == undefined
            ? startToken.col + startToken.lexeme.length
            : endToken.col + endToken.lexeme.length,
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
          this.wrapInStatement(this.evaluate(currentStatement, false, true))
        );
      }
    }
    return this.estree;
  }
}
