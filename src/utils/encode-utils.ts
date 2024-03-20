import { encode as b64Encode, decode as b64Decode } from "js-base64";
import walk from "acorn-walk";
import * as es from "estree";
import { Pair } from "../stdlib/core-list";
import * as base from "../stdlib/base";

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
        (match: string) => `\$${match.charCodeAt(0)}\$`,
      )
    );
  } else {
    return identifier.replace(
      /([^a-zA-Z0-9_])/g,
      (match: string) => `\$${match.charCodeAt(0)}\$`,
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
          String.fromCharCode(parseInt(code)),
        ),
    );
  } else {
    return identifier.replace(/\$([0-9]+)\$/g, (_, code: string) =>
      String.fromCharCode(parseInt(code)),
    );
  }
}

// A function to modify all names in the estree program.
// Prevents any name collisions with JS keywords and invalid characters.
export function encodeTree(ast: es.Program): es.Program {
  // safe to cast ast and node. the generated estree is 1-to-1 with the acorn ast representation
  walk.full(ast as any, (node: any) => {
    if ((node as any).encoded === true) {
      return;
    }
    if (node.type === "Identifier") {
      node.name = encode(node.name);
      // ensures the conversion is only done once
      (node as any).encoded = true;
    }
  });
  return ast;
}

export function decodeString(str: string): string {
  return str.replace(/\$scheme_[\w$]+|\$\d+\$/g, (match) => {
    return decode(match);
  });
}

// Given any value, decode it if and
// only if an encoded value may exist in it.
// this function is used to accurately display
// values in the REPL.
export function decodeValue(x: any): any {
  // helper version of list_tail that assumes non-null return value
  function list_tail(xs: Pair, i: number): Pair {
    if (i === 0) {
      return xs;
    } else {
      return list_tail(base.list$45$tail(xs), i - 1);
    }
  }

  if (base.circular$45$list$63$(x)) {
    // May contain encoded strings.
    let circular_pair_index = -1;
    const all_pairs: Pair[] = [];

    // iterate through all pairs in the list until we find the circular pair
    let current = x;
    while (current !== null) {
      if (all_pairs.includes(current)) {
        circular_pair_index = all_pairs.indexOf(current);
        break;
      }
      all_pairs.push(current);
      current = base.cdr(current);
    }
    x;
    // assemble a new list using the elements in all_pairs
    let new_list = null;
    for (let i = all_pairs.length - 1; i >= 0; i--) {
      new_list = base.cons(decodeValue(base.car(all_pairs[i])), new_list);
    }

    // finally we can set the last cdr of the new list to the circular-pair itself

    const circular_pair = list_tail(new_list, circular_pair_index);
    base.set$45$cdr$33$(base.last$45$pair(new_list), circular_pair);
    return new_list;
  } else if (base.pair$63$(x)) {
    // May contain encoded strings.
    return base.cons(decodeValue(base.car(x)), decodeValue(base.cdr(x)));
  } else if (base.vector$63$(x)) {
    // May contain encoded strings.
    return x.map(decodeValue);
  } else if (base.procedure$63$(x)) {
    // copy x to avoid modifying the original object
    const newX = { ...x };
    const newString = decodeString(x.toString());
    // change the toString method to return the decoded string
    newX.toString = () => newString;
    return newX;
  } else {
    // string, number, boolean, null, undefined
    // no need to decode.
    return x;
  }
}
