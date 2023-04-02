import { schemeParse } from ".."; 
import { generate } from "astring";

const estree = schemeParse("(lambda () 1)");

console.log(generate(estree));