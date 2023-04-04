import { schemeParse, encode } from ".."; 
import { generate } from "astring";
import { SourceMapGenerator } from "source-map";
import { Program, Node } from "estree";

const walk = require("acorn-walk");

function encodeTree(tree: Program): Program {
    walk.full(tree, (node: Node) => {
      if (node.type === 'Identifier') {
        node.name = encode(node.name)
      }
    });
    return tree
  }
  

const estree = schemeParse("`(a b ())");
const sourceMap = new SourceMapGenerator({ file: 'source' })

console.log(generate(estree, { sourceMap }));
console.log(generate(encodeTree(estree), { sourceMap }));