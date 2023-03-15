import { Token } from "./tokenizer";
import { TokenType } from "./token-type";
import { SchemeParserError } from "./scheme-error";
import {
  Program,
  Expression,
  Statement,
  CallExpression,
  Literal,
  Identifier,
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
            !this.matchingParentheses(openparen as TokenType, c.type)
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
   */
  /*private evaluate(expression: Token | any[]): Statement | Expression {
    if (expression instanceof Token) {
      return this.evaluateToken(expression);
    }
    const firstToken = expression[0]; // first token in expression. dictates what to do.
    if (firstToken instanceof Token) {
      // First token could be a special form.
      // Need to check and handle accordingly.
      switch (firstToken.type) {
        case TokenType.QUOTE:
        case TokenType.QUASIQUOTE:
        case TokenType.UNQUOTE:
        case TokenType.UNQUOTE_SPLICING:
        case TokenType.VECTOR:
        case TokenType.IF:
        case TokenType.DEFINE:
        case TokenType.SET:
        case TokenType.LAMBDA:
        case TokenType.LET:
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
  }*/

  /*private evaluateApplication(expression: any[]): CallExpression {
    const procedure = this.evaluate(expression[0]);
    const args = expression.slice(1).map((arg) => this.evaluate(arg));
    return {
      type: "CallExpression",
      //start: procedure.start,
      //end: args[args.length - 1].end,
      loc: {
        start: {
          line: procedure.loc.start.line,
          column: procedure.loc.start.column,
        },
        end: {
          line: args[args.length - 1].loc.end.line,
          column: args[args.length - 1].loc.end.column,
        },
    }
  }*/

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
        };
      case TokenType.IDENTIFIER:
        return {
          type: "Identifier",
          name: token.lexeme,
        };
      default:
        throw new SchemeParserError.UnexpectedTokenError(
          token.line,
          token.col,
          token
        );
    }
  }

  unformattedAST() {
    const program: any[] = [];
    do {
      let currentStatement = this.grouping();
      if (currentStatement.length > 0) {
        // "Unwrap" the exterior grouping
        currentStatement = currentStatement[0];
        program.push(currentStatement);
      }
    } while (!this.isAtEnd());
    return program;
  }
}
