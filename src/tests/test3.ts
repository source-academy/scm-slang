import { readFileSync } from "fs";
import { Tokenizer } from "../tokenizer";
import { Parser } from "../parser"; 
const escodegen = require("escodegen");
/*
const acorn = require("acorn");
const walk = require("acorn-walk");

const glob = readFileSync("./src/lib/scheme-base.ts", "utf8");
const tree = acorn.parse(glob, {ecmaVersion: 2020, sourceType: "module"});

let keywords = new Map<string, string>([
    ["plus", "+"],
    ["minus", "-"],
    ["multiply", "*"],
    ["divide", "/"],  
    ["equal", "="],
]);

walk.simple(tree, {
    VariableDeclarator(node: any) {
        if (keywords.has(node.id.name)) {
            node.id.name = keywords.get(node.id.name);
        }
    }
});
*/
const str = readFileSync("./src/tests/quotation.scm", "utf8");

const tz = new Tokenizer(str);

const tok = tz.scanTokens();

const ps = new Parser(str, tok);

//tree.body.push(...ps.parse().body);

console.log(escodegen.generate(ps.parse()));