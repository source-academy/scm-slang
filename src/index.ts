import { encode as b64Encode, decode as b64Decode } from "js-base64";

// ============ KEEP ALL EXISTING EXPORTS ============
export * from "./utils/encoder-visitor";
export { unparse } from "./utils/reverse_parser";
export { LexerError } from "./transpiler";
export { ParserError } from "./transpiler";
export { schemeParse } from "./transpiler";

// ============ KEEP ALL EXISTING CODE ============
const JS_KEYWORDS: string[] = [
  "break", "case", "catch", "class", "const", "continue",
  "debugger", "default", "delete", "do", "else", "eval",
  "export", "extends", "false", "finally", "for", "function",
  "if", "import", "in", "instanceof", "new", "return", "super",
  "switch", "this", "throw", "true", "try", "typeof", "var",
  "void", "while", "with", "yield", "enum", "await",
  "implements", "package", "protected", "static", "interface",
  "private", "public",
];

export function encode(identifier: string): string {
  if (JS_KEYWORDS.includes(identifier) || identifier.startsWith("$scheme_")) {
    return (
      "$scheme_" +
      b64Encode(identifier).replace(
        /([^a-zA-Z0-9_])/g,
        (match: string) => `\$${match.charCodeAt(0)}\$`
      )
    );
  } else {
    return identifier.replace(
      /([^a-zA-Z0-9_])/g,
      (match: string) => `\$${match.charCodeAt(0)}\$`
    );
  }
}

export function decode(identifier: string): string {
  if (identifier.startsWith("$scheme_")) {
    return b64Decode(
      identifier
        .slice(8)
        .replace(/\$([0-9]+)\$/g, (_, code: string) =>
          String.fromCharCode(parseInt(code))
        )
    );
  } else {
    return identifier.replace(/\$([0-9]+)\$/g, (_, code: string) =>
      String.fromCharCode(parseInt(code))
    );
  }
}

/**
 * Initialize conductor integration dynamically.
 * This allows conductor (ESM) to load scm-slang (CommonJS) without conflicts.
 * Only runs in browser environment (where `self` and `globalThis.import` exist).
 */
if (typeof (globalThis as any).import === "function" && "conductor" in (globalThis as any)) {
  Promise.all([
    (globalThis as any).import("@sourceacademy/conductor/runner/util"),
    (globalThis as any).import("./conductor/SchemeEvaluator")
  ])
    .then(([{ initialise }, { default: SchemeEvaluator }]) => {
      const { runnerPlugin, conduit } = initialise(SchemeEvaluator);
      (globalThis as any).scmSlangRunnerPlugin = runnerPlugin;
      (globalThis as any).scmSlangConduit = conduit;
      console.log("[scm-slang] Conductor integration initialized");
    })
    .catch((err) => {
      console.error("[scm-slang] Conductor initialization error:", err);
    });
}