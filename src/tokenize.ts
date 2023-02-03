/*

import * as es from "estree";

export class Token {
    type: string;
    value: any;
    start: number;
    end: number;

    constructor(p) {
      this.type = p.type
      this.value = p.value
      this.start = p.start
      this.end = p.end
      if (p.options.locations)
        this.loc = new es.SourceLocation(p, p.startLoc, p.endLoc)
      if (p.options.ranges)
        this.range = [p.start, p.end]
    }
  }

*/

function cleanSource(source: string) {
    // format brackets to be ready for split
    var lParen = /\(/g;
    var rParen = /\)/g;
    return source.replace(lParen, " ( ").replace(rParen, " ) ");
}

// function to convert string tokens to token class
function stringToToken(sToken: string) {
    return sToken;
}

// split a source string into tokens.
export function tokenize(source: string) {
    var formatted: string = cleanSource(source);
    // split the program by whitespace
    var firstTokens = formatted.split(" ");
    return firstTokens;
}

// break a list of tokens into statements.
export function breakIntoStatements(tokens: string[]) {
    var statements: string[][] = [];
    var currentStatement: string[] = [];
    // To track the current "level" of parentheses.
    // If the level is 0, then we are at the top level.
    var parentheses = 0;
    for (var i = 0; i < tokens.length; i++) {
        if (tokens[i] != "") {
            currentStatement.push(tokens[i]);
            if (tokens[i] == "(") {
                parentheses++;
            } else if (tokens[i] == ")") {
                parentheses--;
            }
        }
        if (parentheses == 0) {
            // End of statement.
            // Check if the statement is not empty.
            if (currentStatement.length > 0) {
                statements.push(currentStatement);
                currentStatement = [];
            }
        }
    }
    return statements;
}

console.log(breakIntoStatements(tokenize("a (define a (+ 1 2)) (+ 3 4) a    ")));

console.log(breakIntoStatements(tokenize("(+ (* 1 2) (/ 3 4))")));
