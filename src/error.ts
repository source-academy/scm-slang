import { Token } from "./tokenizer";

export namespace TokenizerError {
    export abstract class TokenizerError extends SyntaxError {
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
                `Unexpected character \'${char}\' (${line}:${col})`, 
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
                `Unexpected EOF (${line}:${col})`,
                line,
                col
            );
            this.name = "UnexpectedEOFError";
        }
    }
}

export namespace ParserError {

    function extractLine(source: string, line: number): string {
        let lines = source.split("\n");
        return lines[line - 1];
    }

    function showPoint(col: number): string {
        return "^".padStart(col, " ");
    }

    export abstract class ParserError extends SyntaxError {
        // This base error shouldn't be used directly.
        line: number;
        col: number;
        constructor(message: string, line: number, col: number) {
            super(`Syntax error at (${line}:${col})\n${message}`);
            this.line = line;
            this.col = col;
        }
    }

    export class GenericSyntaxError extends ParserError {
        constructor(source: string, line: number, col: number) {
            super(
                extractLine(source, line) + "\n" + showPoint(col),
                line,
                col
            );
            this.name = "GenericSyntaxError";
        }
    }

    export class ParenthesisMismatchError extends ParserError {
        constructor(source: string, line: number, col: number) {
            super(
                extractLine(source, line) + "\n" + showPoint(col) + "\n" + "Mismatched parenthesis",
                line,
                col
            );
            this.name = "ParenthesisMismatchError";
        }
    }

    export class UnexpectedEOFError extends ParserError {
        constructor(source: string, line: number, col: number) {
            super(
                extractLine(source, line) + "\n" + "Unexpected EOF",
                line,
                col
            );
            this.name = "UnexpectedEOFError";
        }
    }

    export class UnexpectedTokenError extends ParserError {
        token: Token;
        constructor(source: string, line: number, col: number, token: Token) {
            super(
                extractLine(source, line) + "\n" + showPoint(col) + "\n" + `Unexpected token \'${token}\'`,
                line,
                col
            );
            this.token = token;
            this.name = "UnexpectedTokenError";
        }
    }

    export class DisallowedTokenError extends ParserError {
        token: Token;
        constructor(source: string, line: number, col: number, token: Token, chapter: number) {
            super(
                extractLine(source, line) + "\n" + showPoint(col) + "\n" + `Syntax ${token} not allowed at chapter ${chapter}`,
                line,
                col
            );
            this.token = token;
            this.name = "DisallowedTokenError";
        }
    }

    export class UnsupportedTokenError extends ParserError {
        token: Token;
        constructor(source: string, line: number, col: number, token: Token) {
            super(
                extractLine(source, line) + "\n" + showPoint(col) + "\n" + `Unsupported token \'${token}\'`,
                line,
                col
            );
            this.token = token;
            this.name = "UnsupportedTokenError";
        }
    }
}