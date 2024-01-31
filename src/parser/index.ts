import { Tokenizer } from "./lexer/tokenizer";
import { SchemeParser } from "./ast-generator/scheme-ast-parser";
import { Expression } from "./types/node-types";

export * as TokenizerError from "./lexer/tokenizer-error";
export * as ParserError from "./parser-error";

export function schemeParse(source: string, chapter?: number): Expression {
    const tokenizer = new Tokenizer(source);
    const parser = new SchemeParser(source, tokenizer.scanTokens(), chapter);
    return parser.parse();
}