import { Tokenizer } from "./lexer/tokenizer";
import { SchemeParser } from "./ast-generator/scheme-ast-parser";
import { Expression } from "./types/scheme-node-types";
import { Program } from "estree";

import { Simplifier } from "./visitors/simplifier";
import { Transpiler } from "./visitors/transpiler";

export * as TokenizerError from "./lexer/tokenizer-error";
export * as ParserError from "./parser-error";

export function schemeParse(source: string, chapter?: number): Program {
  const tokenizer = new Tokenizer(source);
  const parser = new SchemeParser(source, tokenizer.scanTokens(), chapter);

  // Generate the first AST
  const firstAST = parser.parse();

  // TODO: Then we verify the AST

  // Then we simplify the AST
  const simplifier = Simplifier.create();
  const simplifiedAST = simplifier.simplify(firstAST);

  // Then we transpile the AST
  const transpiler = Transpiler.create();
  const program = transpiler.transpile(simplifiedAST);

  return program;
}
