import { Tokenizer } from "../tokenizer";
import { readFileSync } from "fs";
import { SchemeParser } from "../scheme-parser"; 
const escodegen = require("escodegen");

const str = readFileSync("./src/tests/test-metacircular-evaluator.scm", "utf8");

const tz = new Tokenizer(str);

const tok = tz.scanTokens();

const ps = new SchemeParser(tok);

console.log(escodegen.generate(ps.parse()));
