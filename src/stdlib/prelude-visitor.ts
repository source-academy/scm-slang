import * as es from "estree";
const walk = require("acorn-walk");

/*
convention:

_ --> - 
E --> = (since all scheme basic procedures are in lower case)
Q --> ?
B --> !
L --> <
G --> >

plus --> +
minus --> -
multiply --> *
divide --> /

to be changed with regex.
*/

let keywords = new Map<string, string>([
    ["plus", "+"],
    ["minus", "-"],
    ["multiply", "*"],
    ["divide", "/"],  
]);

// A function to modify a single name.
function modifyName(name: string): string {
    if (keywords.has(name)) {
        // Safe to cast as we have already
        // checked that the name is in the map.
        return keywords.get(name) as string;
    }
    return name.replace(/_/g, "-").replace(/E/g, "=").replace(/Q/g, "?").replace(/B/g, "!").replace(/L/g, "<").replace(/G/g, ">");
}

// A function to modify all names in the estree program.
// Designed for preludes required by scheme programs.
export function preludeModifier(ast: es.Program): es.Program {
    walk.full(ast, (node: es.Node) => {
        if (node.type === "Identifier") {
            node.name = modifyName(node.name);
        }
    });
    return ast;
}