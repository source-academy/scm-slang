// LIST INSPIRATION HERE:
// Ken Jin's py-slang

import { SchemeParser } from "./scheme-parser";

export namespace TokenizerError {
    export abstract class TokenizerError extends Error {
        // This base error shouldn't be used directly.
        line: number;
        col: number;
        constructor(message: string, line: number, col: number) {
            super(message);
            this.line = line;
            this.col = col;
        }
    }

    export class UnexpectedCharacterError extends TokenizerError {
        char: string;
        constructor(line: number, col: number, char: string) {
            super(
                `Unexpected character \'${char}\' (${line}${col})`, 
                line, 
                col
            );
            this.char = char;
            this.name = "UnexpectedCharacterError";
        }
    }

    export class UnexpectedEOFError extends TokenizerError {
        constructor(line: number, col: number) {
            super(
                `Unexpected EOF (${line}${col})`,
                line,
                col
            );
            this.name = "UnexpectedEOFError";
        }
    }
}

export namespace SchemeParserError {
    export abstract class ParserError extends Error {
        // This base error shouldn't be used directly.
        line: number;
        col: number;
        constructor(message: string, line: number, col: number) {
            super(message);
            this.line = line;
            this.col = col;
        }
    }

    export class ParenthesisMismatchError extends ParserError {
        constructor(line: number, col: number) {
            super(
                `Parenthesis mismatch (${line}${col})`,
                line,
                col
            );
            this.name = "ParenthesisMismatchError";
        }
    }

    export class UnexpectedEOFError extends ParserError {
        constructor(line: number, col: number) {
            super(
                `Unexpected EOF (${line}${col})`,
                line,
                col
            );
            this.name = "UnexpectedEOFError";
        }
    }
}