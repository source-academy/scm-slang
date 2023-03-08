// Thanks to Ken Jin (py-slang) for the great resource https://craftinginterpreters.com/scanning.html
// This tokenizer is a modified version, inspired by both the tokenizer above
// as well as Ken Jin's py-slang tokenizer.
// It has been adapted to be written in typescript for scheme.
// LINK 1
// LINK 2

import { TokenType } from "./token-type";
import { TokenizerError } from "./scheme-error";

// These characters can be included as 
// part of an identifier in scheme.
const SPECIAL_CHARS: string = "!$%&*+-./:<=>?@^_~";

// syntactic keywords in the scheme language
let keywords = new Map<string, TokenType>([
    ["if", TokenType.IF],
    ["define", TokenType.DEFINE],
    ["quote", TokenType.QUOTE],
    ["set!", TokenType.SET],
    ["lambda", TokenType.LAMBDA]
]);

export class Token {
    type: TokenType;
    lexeme: string;
    literal: any;
    line: number;
    col: number;

    constructor(type: TokenType, lexeme: any,literal: any, line: number, col: number) {
        this.type = type;
        this.lexeme = lexeme;
        this.literal = literal;
        this.line = line;
        this.col = col;
    }

    public toString(): string {
        return `${TokenType[this.type]} ${this.lexeme} ${this.literal}`;
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
        this.col++;
        this.current++;
        this.start = this.current;
    }

    private addToken(type: TokenType): void;
    private addToken(type: TokenType, literal: any): void 
    private addToken(type: TokenType, literal?: any): void {
        literal = literal == undefined ? null : literal;
        const text = this.source.substring(this.start, this.current);
        this.tokens.push(new Token(type, text, literal, this.line, this.col));
    }

    public scanTokens(): Token[] {
        while (!this.isAtEnd()) {
            this.start = this.current;
            this.scanToken();
        }

        this.tokens.push(new Token(TokenType.EOF, "", null, this.line, this.col));
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
                this.addToken(TokenType.HASH);
                break;
            case ";":
                // a comment
                while (this.peek() != '\n' && !this.isAtEnd()) this.advance();
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
            case '"': this.stringToken(); break;
            case '|': this.identifierTokenLoose(); break;
            default:
                // Deviates slightly from the original tokenizer.
                // Scheme allows for identifiers to start with a digit
                // or include a specific set of symbols.
                if (this.isDigit(c) || c == ".") {
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

    private identifierToken(): void {
        while (this.isAlphaNumeric(this.peek())) this.advance();
        this.addToken(this.checkKeyword());
    }

    private identifierTokenLoose(): void {
        // this is a special case for identifiers
        // ignore the pipe character
        this.jump();
        while (this.peek() != '|' && !this.isAtEnd()) {
            if (this.peek() == "\n") {
                this.line++;
                this.col = 0;
            }
            this.advance();
        }

        if (this.isAtEnd()) {
            throw new TokenizerError.UnexpectedEOFError(
                this.line, 
                this.col
            );
            return;
        }
        this.addToken(this.checkKeyword());
        // ignore the closing pipe character
        this.jump();
    }

    private identifierNumberToken(): void {
        // only executes when the first digit was already found to be a number.
        // we treat this as a number UNTIL we find it no longer behave like one.
        var validNumber: boolean = true; 
        var hasDot: boolean = false;
        while (this.isValidIdentifier(this.peek())) {
            var c = this.peek();
            if (!this.isDigit(c)) {
                if (c == ".") {
                    // still can be a number
                    if (!hasDot) {
                        // number only if there
                        // has been no dot before 
                        if (this.isDigit(this.peekNext()) || this.isWhitespace(this.peekNext())) {
                            // consume the dot
                            hasDot = true;
                        } else {
                            validNumber = false
                        }
                    } else {
                        validNumber = false;
                    }
                } else {
                    validNumber = false;
                }
            }
            this.advance();
        }
        if (validNumber) {
            this.addToken(TokenType.NUMBER, parseFloat(this.source.substring(this.start, this.current)));
        } else {
            this.addToken(this.checkKeyword());
        }
    }

    private checkKeyword(): TokenType {
        var text = this.source.substring(this.start, this.current);
        if (text[0] == '|') {
            // trim text first
            text = this.source.substring(this.start + 1, this.current - 1);
        }
        if (keywords.has(text)) {
            return keywords.get(text) as TokenType;
        }
        return TokenType.IDENTIFIER;
        
    }

    private numberToken(): void {
        while (this.isDigit(this.peek())) this.advance();

        // look for a fractional part
        if (this.peek() == "." && (this.isDigit(this.peekNext()) || this.isWhitespace(this.peekNext()))) {
            // consume the "."
            this.advance();

            while (this.isDigit(this.peek())) this.advance();
        }

        this.addToken(TokenType.NUMBER, parseFloat(this.source.substring(this.start, this.current)));
    }

    private stringToken(): void {
        while (this.peek() != '"' && !this.isAtEnd()) {
            if (this.peek() == "\n") {
                this.line++;
                this.col = 0;
            }
            this.advance();
        }

        if (this.isAtEnd()) {
            throw new TokenizerError.UnexpectedEOFError(
                this.line, 
                this.col
            );
            return;
        }

        // closing "
        this.advance();

        // trim the surrounding quotes
        const value = this.source.substring(this.start + 1, this.current - 1);
        this.addToken(TokenType.STRING, value);
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

    private isAlpha(c: string): boolean {
        return (c >= "a" && c <= "z") ||
               (c >= "A" && c <= "Z");
    }

    private isDigit(c: string): boolean {
        return c >= "0" && c <= "9";
    }

    private isSpecial(c: string): boolean {
        return SPECIAL_CHARS.includes(c);
    }

    private isAlphaNumeric(c: string): boolean {
        return this.isAlpha(c) || this.isDigit(c);
    }

    private isValidIdentifier(c: string): boolean {
        return this.isAlphaNumeric(c) || this.isSpecial(c);
    }

    private isWhitespace(c: string): boolean {
        return c == " "  || 
               c == "\0" ||
               c == "\n" ||
               c == "\r" ||
               c == "\t";
    }
}


// test
var n = new Tokenizer(
"(define (f x) (+ x 1)) ; ignore this\n\
(1 1. 1..1 111111e.1 1.1111111e1 .1)"
);
console.log(n.scanTokens());