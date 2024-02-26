import * as es from "estree";
import { encode } from "..";
const walk = require("acorn-walk");

// A function to modify all names in the estree program.
// Prevents any name collisions with JS keywords and invalid characters.
export function estreeEncode(ast: es.Program): es.Program {
  walk.full(ast, (node: es.Node) => {
    if (node.type === "Identifier") {
      node.name = encode(node.name);
    }
  });
  return ast;
}
