import { schemeParse } from ".."; 
import { generate } from "astring";
import { SourceMapGenerator } from "source-map";

const estree = schemeParse("(lambda (x) x)");
const sourceMap = new SourceMapGenerator({ file: 'source' })

console.log(generate(estree, { sourceMap }));