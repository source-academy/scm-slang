// Import for internal use
import { SchemeEvaluator } from "./conductor/runner/SchemeEvaluator";
import { initialise } from "./conductor/runner/util/initialise";

// Import js-base64 functions directly
const b64Encode = (str: string) => btoa(unescape(encodeURIComponent(str)));
const b64Decode = (str: string) => decodeURIComponent(escape(atob(str)));

// Export CSE Machine functionality
export { parseSchemeSimple } from "./CSE-machine/simple-parser";
export { evaluate, Context } from "./CSE-machine/interpreter";
export { createProgramEnvironment } from "./CSE-machine/environment";
export { Value, Stash } from "./CSE-machine/stash";
export { Control } from "./CSE-machine/control";
export { SchemeComplexNumber } from "./CSE-machine/complex";

// Export Conductor integration
export { SchemeEvaluator } from "./conductor/runner/SchemeEvaluator";
export { BasicEvaluator } from "./conductor/runner/BasicEvaluator";
export { initialise } from "./conductor/runner/util/initialise";

// // Export types
// export * from "./conductor/runner/types";
// export * from "./conductor/types";
// export * from "./conduit/types";
// export * from "./common/errors";

// Export transpiler functionality (for compatibility)
export * from "./utils/encoder-visitor";
export { unparse } from "./utils/reverse_parser";

const JS_KEYWORDS: string[] = [
  "break",
  "case",
  "catch",
  "class",
  "const",
  "continue",
  "debugger",
  "default",
  "delete",
  "do",
  "else",
  "eval",
  "export",
  "extends",
  "false",
  "finally",
  "for",
  "function",
  "if",
  "import",
  "in",
  "instanceof",
  "new",
  "return",
  "super",
  "switch",
  "this",
  "throw",
  "true",
  "try",
  "typeof",
  "var",
  "void",
  "while",
  "with",
  "yield",
  "enum",
  "await",
  "implements",
  "package",
  "protected",
  "static",
  "interface",
  "private",
  "public",
];

/**
 * Takes a Scheme identifier and encodes it to follow JS naming conventions.
 *
 * @param identifier An identifier name.
 * @returns An encoded identifier that follows JS naming conventions.
 */
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

/**
 * Takes a JS identifier and decodes it to follow Scheme naming conventions.
 *
 * @param identifier An encoded identifier name.
 * @returns A decoded identifier that follows Scheme naming conventions.
 */
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

// Initialize conductor (following py-slang pattern)
// Note: This will be executed when the module is loaded
let runnerPlugin: any;
let conduit: any;

try {
  const result = initialise(SchemeEvaluator);
  runnerPlugin = result.runnerPlugin;
  conduit = result.conduit;
} catch (error) {
  console.warn("Conductor initialization failed, using mock objects:", error);
  // Create mock objects if initialization fails
  runnerPlugin = {};
  conduit = {};
}

// Export for Source Academy integration
export { runnerPlugin, conduit };
