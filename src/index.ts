import { Tokenizer } from "./tokenizer";
import { Parser } from "./parser";
import { Program } from "estree";
import { encode as b64Encode, decode as b64Decode } from "js-base64";

export * from "./prelude-visitor";
export * from "./error";

/**
 * Takes a Scheme identifier and encodes it to follow JS naming conventions.
 *
 * @param identifier An identifier name.
 * @returns An encoded identifier that follows JS naming conventions.
 */
export function encode(identifier: string): string {
  return b64Encode(identifier).replace(
    /([^a-zA-Z0-9])/g,
    (match: string) => `\$${match.charCodeAt(0)}\$`
  );
}

/**
 * Takes a JS identifier and decodes it to follow Scheme naming conventions.
 *
 * @param identifier An encoded identifier name.
 * @returns A decoded identifier that follows Scheme naming conventions.
 */
export function decode(identifier: string): string {
  return b64Decode(
    identifier.replace(
      /\$([0-9]+)\$/g, 
      (_, code: string) => String.fromCharCode(parseInt(code))
    )
  );
}

export function schemeParse(source: string, chapter?: number): Program {
  const tokenizer = new Tokenizer(source);
  const parser = new Parser(source, tokenizer.scanTokens(), chapter);
  return parser.parse();
}
