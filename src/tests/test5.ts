import * as acorn from 'acorn';
import { preludeModifier } from '../prelude-visitor';
const escodegen = require('escodegen');

const tree: any = acorn.Parser.parse(`
function plus(x, y) {
    return x + y;
}

function equalQ(x, y) {
    return x === y;
}

function vector_Gstring(v) {
    return v.toString();
}
`, { ecmaVersion: 2020, sourceType: 'module' });

//preludeModifier(tree);

console.log(escodegen.generate(preludeModifier(tree)));