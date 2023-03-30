import { Tokenizer } from './tokenizer';
import { Parser } from './parser';
import { Program } from 'estree';

export * from './prelude-visitor';
export * from './error';
export function schemeParse(
    source: string,
    chapter?: number,
): Program {
    const tokenizer = new Tokenizer(source);
    const parser = new Parser(source, tokenizer.scanTokens(), chapter);
    return parser.parse();
}
