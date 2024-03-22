import * as es from "estree";
import { encode } from "..";
const walk = require("acorn-walk");

// A function to modify all names in the estree program.
// Prevents any name collisions with JS keywords and invalid characters.
export function estreeEncode(ast: es.Program): es.Program {
  walk.full(ast, (node: es.Node) => {
    if ((node as any).encoded === true) {
      return;
    }
    if (node.type === "Identifier") {
      node.name = encode(node.name);
      // ensures the conversion is only done once
      (node as any).encoded = true;
    }
  });
  walk.full(ast, (node: es.Node) => {
    node.encoded = undefined;
  });
  return ast;
}
