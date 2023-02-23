const readline = require('readline-sync');
import { Parser } from "./parser";
import { eval_program, basic_env } from "./evaluator";

function repl(prompt: string="scm-slang PROTOTYPE > ") {
    let env = basic_env();
    while (true) {
        let answer = readline.question(prompt);
        if (answer == "exit") {
            return 0;
        }
        let n = new Parser(answer);
        let ast = n.parse();
        console.log(eval_program(ast, env));
    }
}

repl();