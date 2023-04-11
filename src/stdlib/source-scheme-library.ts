import * as base from "./scheme-base";
import * as list from "./scheme-list";
//import * as lazy from "./scheme-lazy";
//import * as cxr from "./scheme-cxr";

export * from "./scheme-base";
export * from "./scheme-list";
export * from "./scheme-lazy";
export * from "./scheme-cxr";

// Extracts the arguments from a function as a string array.
// Taken from https://stackoverflow.com/questions/1007981/how-to-get-function-parameter-names-values-dynamically-from-javascript
// Adapted to work on both arrow functions and default functions.
function $args(func: any): string[] {
  return (func + "")
    .replace(/[/][/].*$/gm, "") // strip single-line comments
    .replace(/\s+/g, "") // strip white space
    .replace(/[/][*][^/*]*[*][/]/g, "") // strip multi-line comments
    .split(")", 1)[0] // In case of a default/arrow function, extract the parameters
    .replace(/^[^(]*[(]/, "") // extract the parameters
    .replace(/=[^,]+/g, "") // strip any ES6 defaults
    .split(",")
    .filter(Boolean); // split & filter [""]
}

// Display is defined in js-slang. This helps to format whatever scheme creates first.
export function schemeToString(x: any): string {
  let str: string = "";
  if (x === undefined) {
    str = 'undefined';
  } else if (base.listQ(x)) {
    str = "(";
    let p = x as base.Pair;
    while (p !== null) {
      str += schemeToString(p.car);
      p = p.cdr;
      if (p !== null) {
        str += " ";
      }
    }
    str += ")";
  } else if (list.dotted_listQ(x) && base.pairQ(x)) {
    str = "(";
    let p = x as base.Pair;
    while (base.pairQ(p)) {
      str = `${str}${schemeToString(p.car)} `;
      p = p.cdr;
    }
    str = `${str}. ${schemeToString(p)})`;
  } else if (base.vectorQ(x)) {
    str = "#(";
    let v = x as base.Vector;
    for (let i = 0; i < v.vec.length; i++) {
      str += schemeToString(v.vec[i]);
      if (i !== v.vec.length - 1) {
        str += " ";
      }
    }
    str += ")";
  } else if (base.procedureQ(x)) {
    str = `#<procedure (${$args(x)
      .reduce((a, b) => `${a} ${b.replace('...', '. ')}`, "")
      .trimStart()})>`;
  } else if (base.booleanQ(x)) {
    str = x ? "#t" : "#f";
  } else {
    str = x.toString();
  }
  return str;
};