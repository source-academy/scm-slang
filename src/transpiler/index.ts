/**
 * The main entry point of the scheme transpiler.
 */

import { SchemeLexer } from "./lexer";
import { SchemeParser } from "./parser";
import { Expression } from "./types/nodes/scheme-node-types";
import { Program } from "estree";

import { Simplifier, Transpiler, Redefiner } from "./visitors";
import { estreeEncode, estreeDecode } from "..";

export { LexerError } from "./lexer";
export { ParserError } from "./parser";

/**
 * Transpiles Scheme source code into an ESTree program.
 * @param source The Scheme source code
 * @param chapter The chapter of the Scheme language.
 *                If not provided, defaults to the latest version.
 * @returns
 */
export function schemeParse(source: string, chapter?: number, encode?: boolean): Program {
  // Instantiate the lexer
  const lexer = new SchemeLexer(source);

  // Generate tokens
  const tokens = lexer.scanTokens();

  // Instantiate the parser
  const parser = new SchemeParser(source, tokens, chapter);

  // The Scheme AST is represented as an
  // array of expressions, which is all top-level expressions

  // Generate the first AST
  const firstAST: Expression[] = parser.parse();

  // We instantiate all the visitors
  const simplifier = Simplifier.create();
  const redefiner = Redefiner.create();
  const transpiler = Transpiler.create();
  // TODO: Then we macro-expand the AST

  // Then we simplify the AST
  const simplifiedAST: Expression[] = simplifier.simplify(firstAST);

  // Then we redefine the AST
  const redefinedAST: Expression[] = redefiner.redefine(simplifiedAST);

  // Finally we transpile the AST
  const program: Program = transpiler.transpile(redefinedAST);

  return encode ? estreeEncode(program) as Program: program;
}
