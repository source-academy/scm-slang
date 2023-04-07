import { Token } from "./tokenizer";
import { Position } from "estree";

function extractLine(source: string, pos: Position): string {
  let lines = source.split("\n");
  return lines[pos.line - 1];
}

function showPoint(pos: Position): string {
  return "^".padStart(pos.column, " ");
}

export abstract class ParserError extends SyntaxError {
  // This base error shouldn't be used directly.
  loc: Position;
  constructor(message: string, pos: Position) {
    super(`Syntax error at (${pos.line}:${pos.column})\n${message}`);
    this.loc = pos;
  }
  toString(): string {
    return this.message;
  }
}

export class GenericSyntaxError extends ParserError {
  constructor(source: string, pos: Position) {
    super(extractLine(source, pos) + "\n" + showPoint(pos), pos);
    this.name = "GenericSyntaxError";
  }
}

export class ParenthesisMismatchError extends ParserError {
  constructor(source: string, pos: Position) {
    super(
      extractLine(source, pos) +
        "\n" +
        showPoint(pos) +
        "\n" +
        "Mismatched parenthesis",
      pos
    );
    this.name = "ParenthesisMismatchError";
  }
}

export class UnexpectedEOFError extends ParserError {
  constructor(source: string, pos: Position) {
    super(extractLine(source, pos) + "\n" + "Unexpected EOF", pos);
    this.name = "UnexpectedEOFError";
  }
}

export class UnexpectedTokenError extends ParserError {
  token: Token;
  constructor(source: string, pos: Position, token: Token) {
    super(
      extractLine(source, pos) +
        "\n" +
        showPoint(pos) +
        "\n" +
        `Unexpected \'${token}\'`,
      pos
    );
    this.token = token;
    this.name = "UnexpectedTokenError";
  }
}

export class ExpectedTokenError extends ParserError {
  token: Token;
  expected: string;
  constructor(source: string, pos: Position, token: Token, expected: string) {
    super(
      extractLine(source, pos) +
        "\n" +
        showPoint(pos) +
        "\n" +
        `Expected \'${expected}\' but got \'${token}\'`,
      pos
    );
    this.token = token;
    this.expected = expected;
    this.name = "ExpectedTokenError";
  }
}

export class DisallowedTokenError extends ParserError {
  token: Token;
  constructor(source: string, pos: Position, token: Token, chapter: number) {
    super(
      extractLine(source, pos) +
        "\n" +
        showPoint(pos) +
        "\n" +
        `Syntax \'${token}\' not allowed at Scheme \xa7${chapter}`,
      pos
    );
    this.token = token;
    this.name = "DisallowedTokenError";
  }
}

export class UnsupportedTokenError extends ParserError {
  token: Token;
  constructor(source: string, pos: Position, token: Token) {
    super(
      extractLine(source, pos) +
        "\n" +
        showPoint(pos) +
        "\n" +
        `Syntax \'${token}\' not supported yet`,
      pos
    );
    this.token = token;
    this.name = "UnsupportedTokenError";
  }
}
