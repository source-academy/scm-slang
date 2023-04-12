import { Token } from "./tokenizer";
import { TokenType } from "./token-type";
import * as ParserError from "./parser-error";
import {
  Program,
  Expression,
  Statement,
  ExpressionStatement,
  VariableDeclaration,
  VariableDeclarator,
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

class Group {
  group: (Token | Group)[];
  loc: SourceLocation;
  constructor(
    group: (Token | Group)[],
    openparen: Token | undefined,
    closeparen: Token | undefined = openparen
  ) {
    this.group = group;
    this.loc = openparen
      ? // if openparen exists, then closeparen exists as well
        {
          start: openparen.pos,
          end: closeparen!.pos,
        }
      : // only go to this case if grouping() was called.
      // 2 cases:
      // 1. group contains a single Token
      // 2. group contains a single Group
      // in both cases we steal the inner group's location
      group[0] instanceof Group
      ? group[0].loc
      : {
          start: group[0].pos,
          end: group[0].pos,
        };
  }
  public unwrap(): (Token | Group)[] {
    return this.group;
  }

  public length(): number {
    return this.group.length;
  }
}

export class Parser {
  private readonly source: string;
  private readonly tokens: Token[];
  private readonly estree: Program;
  private readonly chapter: number;
  private current: number = 0;

  constructor(source: string, tokens: Token[], chapter: number = Infinity) {
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
        c.pos,
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
  private grouping(): Group;
  private grouping(openparen: Token): Group;
  private grouping(openparen?: Token): Group {
    let inList = openparen === undefined ? false : true;
    let closeparen: Token | undefined = undefined;
    const tokens: (Token | Group)[] = [];
    do {
      let c = this.advance();
      switch (c.type) {
        case TokenType.LEFT_PAREN:
        case TokenType.LEFT_BRACKET:
          tokens.push(this.grouping(c));
          break;
        case TokenType.RIGHT_PAREN:
        case TokenType.RIGHT_BRACKET:
          if (!inList) {
            throw new ParserError.UnexpectedTokenError(this.source, c.pos, c);
          } else if (!this.matchingParentheses(openparen as Token, c)) {
            // ^ safe to cast openparen as this only executes
            // if inList is true, which is only the case if openparen exists
            throw new ParserError.ParenthesisMismatchError(this.source, c.pos);
          }
          closeparen = c;
          inList = false;
          break;
        case TokenType.APOSTROPHE:
        case TokenType.BACKTICK:
        case TokenType.HASH:
        case TokenType.COMMA:
        case TokenType.COMMA_AT:
          // These special notations are converted to their
          // corresponding "procedure-style" tokens.
          const convertedToken = this.convertToken(c);
          // add this token to the next group
          const nextGroup = this.grouping();
          nextGroup.group.unshift(convertedToken);
          // modify the next group's location
          nextGroup.loc.start = this.toSourceLocation(c).start;
          tokens.push(nextGroup);
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
            throw new ParserError.UnexpectedEOFError(this.source, c.pos);
          } else {
            tokens.push(c);
          }
          break;
        default:
          throw new ParserError.UnexpectedTokenError(this.source, c.pos, c);
      }
    } while (inList);
    return new Group(tokens, openparen, closeparen);
  }

  /**
   * Compares the type of opening and closing parantheses.
   *
   * @param lParen
   * @param rParen
   * @returns Whether the parentheses match.
   */
  private matchingParentheses(lParen: Token, rParen: Token) {
    return (
      (lParen.type === TokenType.LEFT_PAREN &&
        rParen.type === TokenType.RIGHT_PAREN) ||
      (lParen.type === TokenType.LEFT_BRACKET &&
        rParen.type === TokenType.RIGHT_BRACKET)
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
          token.pos.line,
          token.pos.column
        );
      case TokenType.BACKTICK:
        return new Token(
          TokenType.QUASIQUOTE,
          token.lexeme,
          token.literal,
          token.start,
          token.end,
          token.pos.line,
          token.pos.column
        );
      case TokenType.HASH:
        return new Token(
          TokenType.VECTOR,
          token.lexeme,
          token.literal,
          token.start,
          token.end,
          token.pos.line,
          token.pos.column
        );
      case TokenType.COMMA:
        return new Token(
          TokenType.UNQUOTE,
          token.lexeme,
          token.literal,
          token.start,
          token.end,
          token.pos.line,
          token.pos.column
        );
      case TokenType.COMMA_AT:
        return new Token(
          TokenType.UNQUOTE_SPLICING,
          token.lexeme,
          token.literal,
          token.start,
          token.end,
          token.pos.line,
          token.pos.column
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
    expression: Token | Group
  ): Statement | Expression | ModuleDeclaration;
  private evaluate(
    expression: Token | Group,
    onlyExpressions: boolean
  ): Statement | Expression | ModuleDeclaration;
  private evaluate(
    expression: Token | Group,
    onlyExpressions: boolean,
    topLevel: boolean
  ): Statement | Expression | ModuleDeclaration;
  private evaluate(
    expression: Token | Group,
    onlyExpressions = false,
    topLevel = false
  ): Statement | Expression | ModuleDeclaration {
    if (expression instanceof Token) {
      return this.evaluateToken(expression);
    } else if (expression.length() < 1) {
      // Empty expression.
      // To create a better error message in the future.
      throw new Error("Empty expression.");
    }
    const tokens = expression.unwrap();
    const firstToken = tokens[0]; // First token in expression. Dictates what to do.
    if (firstToken instanceof Token) {
      // First token could be a special form.
      // Need to check and handle accordingly.
      switch (firstToken.type) {
        // Scheme 1
        case TokenType.DEFINE:
          // Assignment statements with no value.
          if (onlyExpressions) {
            throw new ParserError.UnexpectedTokenError(
              this.source,
              firstToken.pos,
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
          throw new ParserError.UnexpectedTokenError(
            this.source,
            firstToken.pos,
            firstToken
          );

        // Scheme 2
        case TokenType.QUOTE:
        case TokenType.QUASIQUOTE:
          this.validateChapter(firstToken, 2);
          return this.evaluateQuote(expression);
        case TokenType.UNQUOTE:
          // This shouldn't exist outside of unquotes.
          throw new ParserError.UnexpectedTokenError(
            this.source,
            firstToken.pos,
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
            throw new ParserError.UnexpectedTokenError(
              this.source,
              firstToken.pos,
              firstToken
            );
          }
          if (!topLevel) {
            throw new ParserError.UnexpectedTokenError(
              this.source,
              firstToken.pos,
              firstToken
            );
          }
          return this.evaluateImport(expression);
        case TokenType.EXPORT:
          if (onlyExpressions) {
            throw new ParserError.UnexpectedTokenError(
              this.source,
              firstToken.pos,
              firstToken
            );
          }
          if (!topLevel) {
            throw new ParserError.UnexpectedTokenError(
              this.source,
              firstToken.pos,
              firstToken
            );
          }
          return this.evaluateExport(expression);
        case TokenType.DOT:
          // This shouldn't exist here
          throw new ParserError.UnexpectedTokenError(
            this.source,
            firstToken.pos,
            firstToken
          );

        // Outside SICP
        case TokenType.VECTOR:
        case TokenType.UNQUOTE_SPLICING:
          throw new ParserError.UnsupportedTokenError(
            this.source,
            firstToken.pos,
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
  private evaluateDefine(statement: Group): VariableDeclaration {
    // Validate statement.
    const tokens = statement.unwrap();
    if (tokens.length < 3) {
      throw new ParserError.GenericSyntaxError(
        this.source,
        (tokens[0] as Token).pos
      );
    }

    // This determines the allowing of constants or variables
    // in the current chapter.
    const definitionLevel = this.chapter < 3 ? "const" : "let";

    // Check whether this defines a variable or a function.
    if (tokens[1] instanceof Group) {
      // It's a function.
      const identifiers = tokens[1].unwrap().map((token: Token | Group) => {
        if (token instanceof Group) {
          // Error.
          throw new ParserError.GenericSyntaxError(
            this.source,
            token.loc.start
          );
        }
        if (token.type !== TokenType.IDENTIFIER) {
          throw new ParserError.GenericSyntaxError(this.source, token.pos);
        }
        return this.evaluateToken(token);
      });
      // We have previously checked if all of these values are identifiers.
      // Therefore, we can safely cast them to identifiers.
      const symbol: Identifier = identifiers[0] as Identifier;
      const params: Identifier[] = identifiers.slice(1) as Identifier[];
      const body: Statement[] = [];
      let definitions = true;
      for (let i = 2; i < tokens.length; i++) {
        if (
          tokens[i] instanceof Token ||
          (tokens[i] as Group).unwrap()[0] instanceof Group ||
          ((tokens[i] as Group).unwrap()[0] as Token).type !== TokenType.DEFINE
        ) {
          // The definitions block is over.
          definitions = false;
          body.push(
            i < tokens.length - 1
              ? // Safe to cast as module declarations are only top level.
                (this.wrapInStatement(this.evaluate(tokens[i])) as Statement)
              : (this.returnStatement(this.evaluate(tokens[i])) as Statement)
          );
        } else {
          if (definitions) {
            body.push(
              this.wrapInStatement(this.evaluate(tokens[i])) as Statement
            );
          } else {
            // The definitons block is over, and yet there is a define.
            throw new ParserError.GenericSyntaxError(
              this.source,
              ((tokens[i] as Group).unwrap()[0] as Token).pos
            );
          }
        }
      }
      return {
        type: "VariableDeclaration",
        loc: statement.loc,
        declarations: [
          {
            type: "VariableDeclarator",
            loc: {
              start: this.toSourceLocation(tokens[0] as Token).start,
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
        kind: definitionLevel,
      };
    }
    // It's a variable.
    // Once again, validate statement.
    if (tokens.length > 3) {
      throw new ParserError.GenericSyntaxError(
        this.source,
        (tokens[0] as Token).pos
      );
    }
    const symbol = this.evaluateToken(tokens[1]);
    // Validate symbol.
    if (symbol.type !== "Identifier") {
      throw new ParserError.GenericSyntaxError(this.source, tokens[1].pos);
    }
    const value = this.evaluate(tokens[2], true) as Expression;
    return {
      type: "VariableDeclaration",
      loc: statement.loc,
      declarations: [
        {
          type: "VariableDeclarator",
          loc: {
            start: this.toSourceLocation(tokens[0] as Token).start,
            end: value.loc!.end,
          },
          id: symbol,
          init: value,
        } as VariableDeclarator,
      ],
      kind: definitionLevel,
    };
  }

  /**
   * Evaluates an if statement.
   *
   * @param expression An if expression.
   * @returns A conditional expression.
   */
  private evaluateIf(expression: Group): ConditionalExpression {
    const tokens = expression.unwrap();
    // Validate expression.
    if (tokens.length < 3 || tokens.length > 4) {
      throw new ParserError.GenericSyntaxError(
        this.source,
        (tokens[0] as Token).pos
      );
    }
    // Convert JavaScript's truthy/falsy values to Scheme's true/false.
    const test_val = this.evaluate(tokens[1], true) as Expression;
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
    const consequent = this.evaluate(tokens[2], true) as Expression;
    const alternate =
      tokens.length === 4
        ? (this.evaluate(tokens[3], true) as Expression)
        : ({
            type: "Identifier",
            loc: consequent.loc,
            name: "undefined",
          } as Identifier);
    return {
      type: "ConditionalExpression",
      loc: expression.loc,
      test: test,
      consequent: consequent,
      alternate: alternate,
    };
  }

  /**
   * Evaluates a lambda expression.
   *
   * @param expression A lambda expression.
   * @returns A function expression.
   */
  private evaluateLambda(expression: Group): ArrowFunctionExpression {
    const tokens = expression.unwrap();
    if (tokens.length < 3) {
      throw new ParserError.GenericSyntaxError(
        this.source,
        (tokens[0] as Token).pos
      );
    }
    if (!(tokens[1] instanceof Group)) {
      throw new ParserError.GenericSyntaxError(this.source, tokens[1].pos);
    }
    const params: Identifier[] = tokens[1]
      .unwrap()
      .map((param: Token | Group) => {
        if (param instanceof Group) {
          throw new ParserError.GenericSyntaxError(
            this.source,
            param.loc.start
          );
        }
        if (param.type !== TokenType.IDENTIFIER) {
          throw new ParserError.GenericSyntaxError(this.source, param.pos);
        }
        // We have evaluated that this is an identifier.
        return this.evaluateToken(param) as Identifier;
      });
    const body: Statement[] = [];
    let definitions = true;
    for (let i = 2; i < tokens.length; i++) {
      if (
        tokens[i] instanceof Token ||
        (tokens[i] as Group).unwrap()[0] instanceof Group ||
        ((tokens[i] as Group).unwrap()[0] as Token).type !== TokenType.DEFINE
      ) {
        // The definitions block is over.
        definitions = false;
        body.push(
          i < tokens.length - 1
            ? // Safe to cast as module declarations are only top level.
              (this.wrapInStatement(this.evaluate(tokens[i])) as Statement)
            : (this.returnStatement(this.evaluate(tokens[i])) as Statement)
        );
      } else {
        if (definitions) {
          body.push(
            this.wrapInStatement(this.evaluate(tokens[i])) as Statement
          );
        } else {
          // The definitons block is over, and yet there is a define.
          throw new ParserError.GenericSyntaxError(
            this.source,
            ((tokens[i] as Group).unwrap()[0] as Token).pos
          );
        }
      }
    }
    return {
      type: "ArrowFunctionExpression",
      loc: expression.loc,
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
   * Evaluates a let expression.
   * let is syntactic sugar for an invoked lambda procedure.
   *
   * @param expression A let expression.
   * @returns An IIFE.
   */
  private evaluateLet(expression: Group): CallExpression {
    const tokens = expression.unwrap();
    if (tokens.length < 3) {
      throw new ParserError.GenericSyntaxError(
        this.source,
        (tokens[0] as Token).pos
      );
    }
    if (!(tokens[1] instanceof Group)) {
      throw new ParserError.GenericSyntaxError(this.source, tokens[1].pos);
    }
    const declaredVariables: Identifier[] = [];
    const declaredValues: Expression[] = [];
    const declarations = tokens[1].unwrap();
    for (let i = 0; i < declarations.length; i++) {
      // Make sure that the declaration is a group.
      if (!(declarations[i] instanceof Group)) {
        throw new ParserError.GenericSyntaxError(
          this.source,
          (declarations[i] as Token).pos
        );
      }
      // Make sure that the declaration is of the form (x y).
      if ((declarations[i] as Group).length() !== 2) {
        throw new ParserError.GenericSyntaxError(
          this.source,
          (declarations[i] as Group).loc.start
        );
      }
      const declaration = (declarations[i] as Group).unwrap();
      if (!(declaration[0] instanceof Token)) {
        throw new ParserError.GenericSyntaxError(
          this.source,
          declaration[0].loc.start
        );
      }
      if (declaration[0].type !== TokenType.IDENTIFIER) {
        throw new ParserError.GenericSyntaxError(
          this.source,
          declaration[0].pos
        );
      }
      // Safe to cast as we have determined that the token is an identifier.
      declaredVariables.push(this.evaluateToken(declaration[0]) as Identifier);
      // Safe to cast as the "true" flag guarantees an expression.
      declaredValues.push(this.evaluate(declaration[1], true) as Expression);
    }
    const body: Statement[] = [];
    let definitions = true;
    for (let i = 2; i < tokens.length; i++) {
      if (
        tokens[i] instanceof Token ||
        (tokens[i] as Group).unwrap()[0] instanceof Group ||
        ((tokens[i] as Group).unwrap()[0] as Token).type !== TokenType.DEFINE
      ) {
        // The definitions block is over.
        definitions = false;
        body.push(
          i < tokens.length - 1
            ? // Safe to cast as module declarations are only top level.
              (this.wrapInStatement(this.evaluate(tokens[i])) as Statement)
            : (this.returnStatement(this.evaluate(tokens[i])) as Statement)
        );
      } else {
        if (definitions) {
          body.push(
            this.wrapInStatement(this.evaluate(tokens[i])) as Statement
          );
        } else {
          // The definitons block is over, and yet there is a define.
          throw new ParserError.GenericSyntaxError(
            this.source,
            ((tokens[i] as Group).unwrap()[0] as Token).pos
          );
        }
      }
    }
    return {
      type: "CallExpression",
      loc: expression.loc,
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
   * Evaluates a conditional expression.
   *
   * @param expression A conditional expression.
   * @returns A conditional expression.
   */
  private evaluateCond(expression: Group): ConditionalExpression {
    const tokens = expression.unwrap();
    if (tokens.length < 2) {
      throw new ParserError.GenericSyntaxError(
        this.source,
        (tokens[0] as Token).pos
      );
    }
    const clauses = tokens.slice(1);
    const conditions: Expression[] = [];
    const bodies: Expression[] = [];
    let catchAll: Expression = {
      type: "Identifier",
      name: "undefined",
    } as Identifier; // the body of the else clause.
    for (let i: number = 0; i < clauses.length; i++) {
      const clause = clauses[i];
      if (clause instanceof Group) {
        // Verify that the clause is not empty.
        if (clause.length() < 1) {
          throw new ParserError.GenericSyntaxError(
            this.source,
            clause.loc.start
          );
        }
        // Check if this is an else clause.
        const clauseTokens = clause.unwrap();
        if (
          clauseTokens[0] instanceof Token &&
          clauseTokens[0].type === TokenType.ELSE
        ) {
          if (i < clauses.length - 1) {
            throw new ParserError.GenericSyntaxError(
              this.source,
              clauseTokens[0].pos
            );
          }
          if (clause.length() < 2) {
            throw new ParserError.GenericSyntaxError(
              this.source,
              clauseTokens[0].pos
            );
          }
          catchAll = this.evaluateBody(clauseTokens.slice(1));
        } else {
          const test_val: Expression = this.evaluate(
            clauseTokens[0],
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
            clause.length() < 2
              ? test_val
              : this.evaluateBody(clauseTokens.slice(1))
          );
          catchAll.loc = bodies[bodies.length - 1].loc;
          catchAll.loc!.start = catchAll.loc!.end;
        }
      } else {
        throw new ParserError.GenericSyntaxError(this.source, clause.pos);
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
    // Wrap the last conditional expression with the expression location.
    finalConditionalExpression.loc = expression.loc;
    // There is at least one conditional expression.
    // This cast is safe.
    return finalConditionalExpression as ConditionalExpression;
  }

  /**
   * Evaluates a quote statement.
   *
   * @param expression A quote statement.
   * @returns An expression. Can be a Literal, NewExpression
   */
  private evaluateQuote(expression: Group): Expression;
  private evaluateQuote(expression: Group, quasiquote: boolean): Expression;
  private evaluateQuote(expression: Group, quasiquote?: boolean): Expression {
    const tokens = expression.unwrap();
    if (tokens.length !== 2) {
      throw new ParserError.GenericSyntaxError(
        this.source,
        (tokens[0] as Token).pos
      );
    }
    if (quasiquote === undefined) {
      quasiquote = (tokens[0] as Token).type === TokenType.QUASIQUOTE;
    }
    const quotedVal: Expression = this.quote(tokens[1], quasiquote);
    // Sanitize location information.
    quotedVal.loc = expression.loc;
    return quotedVal;
  }

  /**
   * Quote prevents evaluation of an expression, leaving it as itself/a list.
   *
   * @param expression An expression to quote.
   * @param quasiquote Whether or not this is a quasiquote.
   * @returns An expression.
   */
  private quote(expression: Token | Group, quasiquote: boolean): Expression {
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
    if (expression.length() < 1) {
      const null_list = this.list([]);
      null_list.loc = expression.loc;
      return null_list;
    }
    // Not an empty list
    const tokens = expression.unwrap();
    if (
      tokens[0] instanceof Token &&
      tokens[0].type === TokenType.UNQUOTE &&
      quasiquote
    ) {
      // "Unquote" the expression.
      // It MUST be an expression.
      return this.evaluate(tokens[1], true) as Expression;
    }
    // Determines whether the quote is parsing a list or a pair.
    let dot;
    const listElements1: Expression[] = [];
    let listTerminator: Expression | null = null;
    for (let i = 0; i < tokens.length; i++) {
      if (
        tokens[i] instanceof Token &&
        (tokens[i] as Token).type === TokenType.DOT
      ) {
        if (dot !== undefined) {
          throw new ParserError.GenericSyntaxError(
            this.source,
            (tokens[i] as Token).pos
          );
        } else {
          dot = tokens[i] as Token;
        }
      } else {
        if (dot !== undefined) {
          // There should only be one element after the dot.
          if (listTerminator !== null) {
            throw new ParserError.GenericSyntaxError(
              this.source,
              (tokens[i] as Token).pos
            );
          } else {
            listTerminator = this.quote(tokens[i], quasiquote);
          }
        } else {
          listElements1.push(this.quote(tokens[i], quasiquote));
        }
      }
    }
    if (dot !== undefined) {
      if (listTerminator === null) {
        throw new ParserError.GenericSyntaxError(
          this.source,
          dot.pos
        );
      }
      // Safe, as we have already determined that listTerminator exists
      if (listElements1.length < 1) {
        return listTerminator!;
      }
      return this.dottedList(
        listElements1,
        listTerminator!
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
   * 
   * @param car The car of the pair.
   * @param cdr The cdr of the pair.
   * @returns A call to cons.
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
   * Creates a dotted list from a list and a final element.
   * 
   * @param cars The list of elements before the terminator.
   * @param cdr The final element.
   * @returns A dotted list.
   */
  private dottedList(cars: Expression[], cdr: Expression): CallExpression {
    let acc: Expression = cdr;
    for (let i = cars.length - 1; i >= 0; i--) {
      acc = this.pair(cars[i], acc);
    }
    // Safe to cast. cars is never empty.
    return acc as CallExpression;
  }

  /**
   * Converts an array of Expressions into a list.
   */
  private list(expressions: Expression[]): CallExpression {
    return {
      type: "CallExpression",
      loc:
        expressions.length > 0
          ? ({
              start: expressions[0].loc!.start,
              end: expressions[expressions.length - 1].loc!.end,
            } as SourceLocation)
          : undefined,
      callee: {
        type: "Identifier",
        loc:
          expressions.length > 0
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
  private evaluateSet(expression: Group): AssignmentExpression {
    const tokens = expression.unwrap();
    if (tokens.length !== 3) {
      throw new ParserError.GenericSyntaxError(
        this.source,
        (tokens[0] as Token).pos
      );
    }
    if (!(tokens[1] instanceof Token)) {
      throw new ParserError.GenericSyntaxError(
        this.source,
        tokens[1].loc.start
      );
    } else if (tokens[1].type !== TokenType.IDENTIFIER) {
      throw new ParserError.GenericSyntaxError(this.source, tokens[1].pos);
    }
    // Safe to cast as we have predetermined that it is an identifier.
    const identifier: Identifier = this.evaluateToken(tokens[1]) as Identifier;
    const newValue: Expression = this.evaluate(tokens[2]) as Expression;
    return {
      type: "AssignmentExpression",
      loc: expression.loc,
      operator: "=",
      left: identifier,
      right: newValue,
    };
  }

  /**
   * Evaluates a begin expression.
   * Also evaluates implicit begins.
   *
   * @param expression A begin expression.
   * @returns An expression.
   */
  private evaluateBegin(expression: Group): CallExpression {
    const beginBody = this.evaluateBody(expression.unwrap().slice(1));
    beginBody.loc = expression.loc;
    return beginBody;
  }

  /**
   * Evaluates a body expression
   * Equivalent to evaluating a JavaScript block statement,
   * except this returns a value too.
   *
   * @param tokens An array of expressions.
   * @returns An Immediately Invoked Function Expression (IIFE).
   */
  private evaluateBody(tokens: (Token | Group)[]): CallExpression {
    const body: Statement[] = [];
    let definitions = true;

    for (let i = 0; i < tokens.length; i++) {
      if (
        tokens[i] instanceof Token ||
        (tokens[i] as Group).unwrap()[0] instanceof Group ||
        ((tokens[i] as Group).unwrap()[0] as Token).type !== TokenType.DEFINE
      ) {
        // The definitions block is over.
        definitions = false;
        body.push(
          i < tokens.length - 1
            ? // Safe to cast as module declarations are only top level.
              (this.wrapInStatement(this.evaluate(tokens[i])) as Statement)
            : (this.returnStatement(this.evaluate(tokens[i])) as Statement)
        );
      } else {
        if (definitions) {
          body.push(
            this.wrapInStatement(this.evaluate(tokens[i])) as Statement
          );
        } else {
          // The definitions block is over, and yet there is a define.
          throw new ParserError.GenericSyntaxError(
            this.source,
            ((tokens[i] as Group).unwrap()[0] as Token).pos
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
   * Evaluates a delay procedure call.
   *
   * @param expression A delay procedure call in Scheme.
   * @returns A lambda function that takes no arguments and returns the delayed expression.
   */
  private evaluateDelay(expression: Group): ArrowFunctionExpression {
    const tokens = expression.unwrap();
    if (tokens.length !== 2) {
      throw new ParserError.GenericSyntaxError(
        this.source,
        (tokens[0] as Token).pos
      );
    }
    const delayed: Statement = this.returnStatement(
      this.evaluate(tokens[1], true)
    );
    return {
      type: "ArrowFunctionExpression",
      loc: expression.loc,
      params: [],
      body: {
        type: "BlockStatement",
        loc: delayed.loc,
        body: [delayed],
      },
      expression: false,
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
  private evaluateImport(expression: Group): ModuleDeclaration {
    const tokens = expression.unwrap();
    if (tokens.length < 3) {
      throw new ParserError.GenericSyntaxError(
        this.source,
        (tokens[0] as Token).pos
      );
    } else if (!(tokens[1] instanceof Token)) {
      throw new ParserError.GenericSyntaxError(
        this.source,
        tokens[1].loc.start
      );
    } else if (tokens[1].type !== TokenType.STRING) {
      throw new ParserError.GenericSyntaxError(
        this.source, 
        tokens[1].pos);
    } else if (!(tokens[2] instanceof Group)) {
      throw new ParserError.GenericSyntaxError(
        this.source,
        (tokens[2] as Token).pos
      );
    }
    const specifiers: ImportSpecifier[] = [];
    const specifierTokens = tokens[2].unwrap();
    for (let i = 0; i < specifierTokens.length; i++) {
      if (!(specifierTokens[i] instanceof Token)) {
        throw new ParserError.GenericSyntaxError(
          this.source,
          (specifierTokens[i] as Group).loc.start
        );
      } else if ((specifierTokens[i] as Token).type !== TokenType.IDENTIFIER) {
        throw new ParserError.GenericSyntaxError(
          this.source,
          (specifierTokens[i] as Token).pos
        );
      }
      specifiers.push({
        type: "ImportSpecifier",
        local: this.evaluate(specifierTokens[i]) as Identifier,
        imported: this.evaluate(specifierTokens[i]) as Identifier,
        loc: this.toSourceLocation(specifierTokens[i] as Token),
      });
    }
    return {
      type: "ImportDeclaration",
      specifiers: specifiers,
      source: this.evaluate(tokens[1]) as Literal,
      loc: expression.loc,
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
  private evaluateExport(expression: Group): ModuleDeclaration {
    const tokens = expression.unwrap();
    if (tokens.length !== 2) {
      throw new ParserError.GenericSyntaxError(
        this.source,
        (tokens[0] as Token).pos
      );
    }
    if (!(tokens[1] instanceof Group)) {
      throw new ParserError.GenericSyntaxError(
        this.source,
        (tokens[1] as Token).pos
      );
    }
    const exportTokens = tokens[1].unwrap();
    if (!(exportTokens[0] instanceof Token)) {
      throw new ParserError.GenericSyntaxError(
        this.source,
        exportTokens[0].loc.start
      );
    }
    if (exportTokens[0].type !== TokenType.DEFINE) {
      throw new ParserError.GenericSyntaxError(
        this.source,
        (tokens[0] as Token).pos
      );
    }
    const declaration = this.evaluate(tokens[1]) as VariableDeclaration;
    return {
      type: "ExportNamedDeclaration",
      declaration: declaration,
      specifiers: [],
      source: null,
      loc: expression.loc,
    };
  }

  /**
   * Evaluates an application.
   * An application is a function call.
   *
   * @param expression An expression.
   * @returns A call expression.
   */
  private evaluateApplication(expression: Group): CallExpression {
    const tokens = expression.unwrap();
    const procedure = this.evaluate(tokens[0]);
    const args = tokens.slice(1).map((arg) => this.evaluate(arg, true));
    return {
      type: "CallExpression",
      loc: expression.loc,
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
          raw:
            token.type === TokenType.BOOLEAN
              ? token.literal
                ? "true"
                : "false"
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
        throw new ParserError.UnexpectedTokenError(
          this.source,
          token.pos,
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
  ): Statement {
    if (this.isExpression(expression)) {
      // Return the expression wrapped in a return statement.
      return {
        type: "ReturnStatement",
        argument: expression,
        loc: expression.loc,
      };
    }
    // If the expression is not a expression, just return the statement.
    return expression as Statement;
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
  private toSourceLocation(
    startToken: Token,
    endToken: Token = startToken
  ): SourceLocation {
    return {
      start: startToken.pos,
      end: endToken.pos,
    };
  }

  parse(): Program {
    while (!this.isAtEnd()) {
      let currentStatement = this.grouping();
      // Unwrap the grouping.
      // Top-level grouping always contains
      // one internal item of type Token or Group.
      // This is what we want to work on.
      let currentGroup = currentStatement.unwrap()[0];
      if (
        currentGroup instanceof Group ||
        currentGroup.type !== TokenType.EOF
      ) {
        this.estree.body.push(
          this.wrapInStatement(this.evaluate(currentGroup, false, true))
        );
      }
    }
    return this.estree;
  }
}
