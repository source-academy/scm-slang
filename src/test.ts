import { Tokenizer } from "./tokenizer";
import { readFileSync } from "fs";
import { SchemeParser } from "./scheme-parser"; 

const str = readFileSync("./src/test-metacircular-evaluator.scm", "utf8");

const tz = new Tokenizer(str);

const tok = tz.scanTokens();

console.log(tok);

const ps = new SchemeParser(tok);

console.log(ps.parse());
