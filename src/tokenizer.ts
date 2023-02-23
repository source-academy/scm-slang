import {operators, specialChars} from "./syntax";

class Pretoken {
    char: string;
    pos: number;
    line: number;
    col: number;
    constructor(p: any) {
        this.char = p.char
        this.pos = p.pos
        this.line = p.line
        this.col = p.col
    }
}

export class Token {
    value: any;
    start: number;
    end: number;
    line: number;
    col: number;
    constructor(p: any) {
        this.value = p.value
        this.start = p.start
        this.end = p.end
        this.line = p.line
        this.col = p.col
    }
}

export class Tokenizer {
    private source: string;
    private preTokens: Pretoken[];
    private tokens: Token[];
    // TODO: to validate parentheses in program
    private parentheses: number;
    constructor(source: string) {
        this.source = source;
        this.preTokens = [];
        this.tokens = [];
        this.parentheses = 0;
    }

    // FOR SOME REASON THIS DOES NOT WORK YET
    // attempt to convert string token to relevant type.
    private atom(token: string) {
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

    private preTokenize() {
        // only do this once
        if (this.preTokens.length > 0) {
            return;
        }
        var line = 1;
        var col = 0;
        var pos = 0;
        for (let c of this.source) {
            this.preTokens.push(new Pretoken({
                char: c,
                pos: pos,
                line: line,
                col: col,
            }));
            if (c == "\n") {
                line++;
                col = 0;
            } else {
                col++;
            }       
            pos++;
        }
    }

    tokenize() {
        // only do this once
        if (this.tokens.length > 0) {
            return;
        }
        this.preTokenize();

        var curr: string = "";
        var finalPos: number = 0;
        var finalLine: number = 0;
        var finalCol: number = 0;
        for (let p of this.preTokens) {
            if (p.char.match(/^\s*$/) !== null || specialChars.includes(p.char) || operators.includes(p.char)) {
                // end of token due to whitespace, special char, or operator
                // accumulate the current pretokens and return as a token
                if (curr != "") {
                    this.tokens.push(new Token({
                        value: curr,
                        start: p.pos - curr.length,
                        end: p.pos,
                        line: p.line,
                        col: p.col,
                    }));
                    // reset cumulative list
                    curr = "";
                }
                // if the current pretoken is a special
                // character or operator, add it as a token
                if (specialChars.includes(p.char) || operators.includes(p.char)) {
                    this.tokens.push(new Token({
                        value: p.char,
                        start: p.pos,
                        end: p.pos + 1,
                        line: p.line,
                        col: p.col,
                    }));
                }
            } else {
                curr += p.char;
                finalPos = p.pos;
                finalLine = p.line;
                finalCol = p.col;
            }
        }
        if (curr != "") {
            this.tokens.push(new Token({
                value: curr,
                start: finalPos - curr.length,
                end: finalPos,
                line: finalLine,
                col: finalCol,
            }));
        }
    }
    getTokens() {
        return this.tokens;
    }
}


// test
//var n = new Tokenizer("(* 4.5 8) a b c    ");
//n.tokenize();
//console.log(n.getTokens());