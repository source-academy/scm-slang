const readline = require('readline-sync');
import { parse } from "./parser";
const ev = require('eval-estree-expression');

function repl(prompt: string="scm-slang > ") {
    while (true) {
        let answer = readline.question(prompt);
        if (answer == "exit") {
            break;
        }
        let ast = parse(answer);
        console.log(ast);
    }
}

repl();