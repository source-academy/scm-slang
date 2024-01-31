import { Program } from "estree";
import { Tokenizer } from "./lexer/tokenizer";
import { EstreeParser } from "./ast-generator/estree-parser";

export * as TokenizerError from "./lexer/tokenizer-error";
export * as ParserError from "./parser-error";

export function schemeParse(source: string, chapter?: number): Program {
    const tokenizer = new Tokenizer(source);
    const parser = new EstreeParser(source, tokenizer.scanTokens(), chapter);
    return parser.parse();
}