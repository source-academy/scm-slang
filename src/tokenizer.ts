// Thanks to Ken Jin (py-slang) for the great resource https://craftinginterpreters.com/scanning.html
// This tokenizer is a modified version, inspired by both the
// tokenizer above as well as Ken Jin's py-slang tokenizer.
// It has been adapted to be written in typescript for scheme.
// Crafting Interpreters: https://craftinginterpreters.com/
// py-slang: https://github.com/source-academy/py-slang

import { TokenType } from "./token-type";
import * as TokenizerError from "./tokenizer-error";
import { Position } from "estree";

// syntactic keywords in the scheme language
let keywords = new Map<string, TokenType>([
  [".", TokenType.DOT],
  ["if", TokenType.IF],
  ["let", TokenType.LET],
  ["cond", TokenType.COND],
  ["else", TokenType.ELSE],
  ["set!", TokenType.SET],
  ["begin", TokenType.BEGIN],
  ["delay", TokenType.DELAY],
  ["quote", TokenType.QUOTE],
  ["export", TokenType.EXPORT],
  ["import", TokenType.IMPORT],
  ["define", TokenType.DEFINE],
  ["lambda", TokenType.LAMBDA],
]);

export class Token {
  type: TokenType;
  lexeme: string;
  literal: any;
  start: number;
  end: number;
  pos: Position;

  constructor(
    type: TokenType,
    lexeme: any,
    literal: any,
    start: number,
    end: number,
    line: number,
    col: number
  ) {
    this.type = type;
    this.lexeme = lexeme;
    this.literal = literal;
    this.start = start;
    this.end = end;
    this.pos = {
      line: line,
      column: col,
    };
  }

  public toString(): string {
    return `${this.lexeme}`;
  }
}

export class Tokenizer {
  private readonly source: string;
  private readonly tokens: Token[];
  private start: number = 0;
  private current: number = 0;
  private line: number = 1;
  private col: number = 0;

  constructor(source: string) {
    this.source = source;
    this.tokens = [];
  }

  private isAtEnd(): boolean {
    return this.current >= this.source.length;
  }

  private advance(): string {
    // get the next character
    this.col++;
    return this.source.charAt(this.current++);
  }

  private jump(): void {
    // when you want to ignore a character
    this.start = this.current;
    this.col++;
    this.current++;
  }

  private addToken(type: TokenType): void;
  private addToken(type: TokenType, literal: any): void;
  private addToken(type: TokenType, literal: any = null): void {
    const text = this.source.substring(this.start, this.current);
    this.tokens.push(
      new Token(
        type,
        text,
        literal,
        this.start,
        this.current,
        this.line,
        this.col
      )
    );
  }

  public scanTokens(): Token[] {
    while (!this.isAtEnd()) {
      this.start = this.current;
      this.scanToken();
    }

    this.tokens.push(
      new Token(
        TokenType.EOF,
        "",
        null,
        this.start,
        this.current,
        this.line,
        this.col
      )
    );
    return this.tokens;
  }

  private scanToken(): void {
    const c = this.advance();
    switch (c) {
      case "(":
        this.addToken(TokenType.LEFT_PAREN);
        break;
      case ")":
        this.addToken(TokenType.RIGHT_PAREN);
        break;
      case "[":
        this.addToken(TokenType.LEFT_BRACKET);
        break;
      case "]":
        this.addToken(TokenType.RIGHT_BRACKET);
        break;
      case "'":
        this.addToken(TokenType.APOSTROPHE);
        break;
      case "`":
        this.addToken(TokenType.BACKTICK);
        break;
      case ",":
        this.addToken(TokenType.COMMA);
        break;
      case "#":
        if (this.match("t") || this.match("f")) {
          this.booleanToken();
        } else if (this.match("|")) {
          // a multiline comment
          this.comment();
        } else {
          this.addToken(TokenType.HASH);
        }
        break;
      case ";":
        // a comment
        while (this.peek() != "\n" && !this.isAtEnd()) this.advance();
        break;
      // double character tokens not currently needed
      case " ":
      case "\r":
      case "\t":
        // ignore whitespace
        break;
      case "\n":
        this.line++;
        this.col = 0;
        break;
      case '"':
        this.stringToken();
        break;
      case "|":
        this.identifierTokenLoose();
        break;
      default:
        // Deviates slightly from the original tokenizer.
        // Scheme allows for identifiers to start with a digit
        // or include a specific set of symbols.
        if (this.isDigit(c) || c === "-"|| c === ".") {
          // may or may not be a number
          this.identifierNumberToken();
        } else if (this.isValidIdentifier(c)) {
          // filtered out the potential numbers
          // these are definitely identifiers
          this.identifierToken();
        } else {
          // error
          throw new TokenizerError.UnexpectedCharacterError(
            this.line,
            this.col,
            c
          );
        }
        break;
    }
  }
    
  private comment(): void {
    while (!(this.peek() == "|" && this.peekNext() == "#") && !this.isAtEnd()) {
      if (this.peek() === "\n") {
        this.line++;
        this.col = 0;
      }
      this.advance();
    }

    if (this.isAtEnd()) {
      throw new TokenizerError.UnexpectedEOFError(this.line, this.col);
    }

    this.jump();
    this.jump();
  }

  private identifierToken(): void {
    while (this.isValidIdentifier(this.peek())) this.advance();
    this.addToken(this.checkKeyword());
  }

  private identifierTokenLoose(): void {
    // this is a special case for identifiers
    // ignore the pipe character
    this.jump();
    while (this.peek() != "|" && !this.isAtEnd()) {
      if (this.peek() === "\n") {
        this.line++;
        this.col = 0;
      }
      this.advance();
    }

    if (this.isAtEnd()) {
      throw new TokenizerError.UnexpectedEOFError(this.line, this.col);
    }
    this.addToken(this.checkKeyword());
    // ignore the closing pipe character
    this.jump();
  }

  private identifierNumberToken(): void {
    // only executes when the first digit was already found to be a number.
    // we treat this as a number UNTIL we find it no longer behaves like one.
    var first = this.peekPrev();
    var validNumber: boolean = true;
    var hasDot: boolean = first === "." ? true : false;
    while (this.isValidIdentifier(this.peek())) {
      var c = this.peek();
      if (!this.isDigit(c)) {
        if (c === ".") {
          // still can be a number
          if (hasDot) {
            validNumber = false;
          } else if (
            this.isDigit(this.peekNext()) ||
            this.isWhitespace(this.peekNext())
          ) {
            hasDot = true;
          } else {
            validNumber = false;
          }
        } else {
          validNumber = false;
        }
      }
      this.advance();
    }
    // if the number is a single dot, single - or just "-.", it is not a number.
    let lexeme = this.source.substring(this.start, this.current);
    switch (lexeme) {
      case ".":
      case "-":
      case "-.":
        validNumber = false;
        break;
      default:
        // do nothing
        break;
    }
    if (validNumber) {
      this.addToken(
        TokenType.NUMBER,
        parseFloat(lexeme)
      );
    } else {
      this.addToken(this.checkKeyword());
    }
  }

  private checkKeyword(): TokenType {
    var text = this.source.substring(this.start, this.current);
    if (text[0] === "|") {
      // trim text first
      text = this.source.substring(this.start + 1, this.current - 1);
    }
    if (keywords.has(text)) {
      return keywords.get(text) as TokenType;
    }
    return TokenType.IDENTIFIER;
  }

  private stringToken(): void {
    while (this.peek() != '"' && !this.isAtEnd()) {
      if (this.peek() === "\n") {
        this.line++;
        this.col = 0;
      }
      this.advance();
    }

    if (this.isAtEnd()) {
      throw new TokenizerError.UnexpectedEOFError(this.line, this.col);
    }

    // closing "
    this.advance();

    // trim the surrounding quotes
    const value = this.source.substring(this.start + 1, this.current - 1);
    this.addToken(TokenType.STRING, value);
  }

  private booleanToken(): void {
    this.addToken(TokenType.BOOLEAN, this.peekPrev() === "t" ? true : false);
  }
    


  private match(expected: string): boolean {
    if (this.isAtEnd()) return false;
    if (this.source.charAt(this.current) != expected) return false;
    this.current++;
    return true;
  }

  private peek(): string {
    if (this.isAtEnd()) return "\0";
    return this.source.charAt(this.current);
  }

  private peekNext(): string {
    if (this.current + 1 >= this.source.length) return "\0";
    return this.source.charAt(this.current + 1);
  }

  private peekPrev(): string {
    if (this.current - 1 < 0) return "\0";
    return this.source.charAt(this.current - 1);
  }

  private isDigit(c: string): boolean {
    return c >= "0" && c <= "9";
  }

  private isSpecialSyntax(c: string): boolean {
    return c === "(" || c === ")" || c === "[" || c === "]" || c === ";" || c === "|";
  }

  private isValidIdentifier(c: string): boolean {
    return !this.isWhitespace(c) && !this.isSpecialSyntax(c);
  }

  private isWhitespace(c: string): boolean {
    return c === " " || c === "\0" || c === "\n" || c === "\r" || c === "\t";
  }
}