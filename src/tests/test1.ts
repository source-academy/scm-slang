import { Tokenizer } from "../tokenizer";
import { readFileSync } from "fs";
import { Parser } from "../parser"; 
import { generate } from "astring";

const str = readFileSync("./src/tests/test-metacircular-evaluator.scm", "utf8");

const tz = new Tokenizer(str);

const tok = tz.scanTokens();

const ps = new Parser(str, tok);

console.log(generate(ps.parse()));
