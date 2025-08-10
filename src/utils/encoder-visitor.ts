import * as es from "estree";

// Import encode/decode functions directly to avoid circular dependency
const b64Encode = (str: string) => btoa(unescape(encodeURIComponent(str)));
const b64Decode = (str: string) => decodeURIComponent(escape(atob(str)));

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

function encode(identifier: string): string {
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

function decode(identifier: string): string {
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

// Simple AST walker to replace acorn-walk
function walkFull(ast: es.Node, visitor: (node: es.Node) => void) {
  visitor(ast);

  // Walk through all properties that might contain nodes
  for (const key in ast) {
    const value = (ast as any)[key];
    if (value && typeof value === "object") {
      if (Array.isArray(value)) {
        value.forEach(item => {
          if (item && typeof item === "object" && item.type) {
            walkFull(item, visitor);
          }
        });
      } else if (value.type) {
        walkFull(value, visitor);
      }
    }
  }
}

// A function to modify all names in the estree program.
// Prevents any name collisions with JS keywords and invalid characters.
export function estreeEncode(ast: es.Node): es.Node {
  walkFull(ast, (node: es.Node) => {
    if ((node as any).encoded === true) {
      return;
    }
    if (node.type === "Identifier") {
      node.name = encode(node.name);
      // ensures the conversion is only done once
      (node as any).encoded = true;
    }
  });
  walkFull(ast, (node: es.Node) => {
    (node as any).encoded = undefined;
  });
  return ast;
}

export function estreeDecode(ast: es.Node): es.Node {
  walkFull(ast, (node: es.Node) => {
    if ((node as any).decoded === true) {
      return;
    }
    if (node.type === "Identifier") {
      node.name = decode(node.name);
      // ensures the conversion is only done once
      (node as any).decoded = true;
    }
  });
  walkFull(ast, (node: es.Node) => {
    (node as any).decoded = undefined;
  });
  return ast;
}
