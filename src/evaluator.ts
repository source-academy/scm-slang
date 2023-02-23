import { Identifier, Node, Program } from "estree";
import { Parser } from "./parser";

export function basic_env() {
    const env = new Map<string, any>();
    env.set('+', (x: number, y: number) => x + y);
    env.set('-', (x: number, y: number) => x - y);
    env.set('*', (x: number, y: number) => x * y);
    env.set('/', (x: number, y: number) => x / y);
    return env;
}

function eval_expression(ast: Node | null | undefined, env: Map<string, any>): any {
    if (ast == null) {
    } else if (ast.type == "Literal") {
        return ast.value;
    } else if (ast.type == "Identifier") {
        return env.get(ast.name);
    } else if (ast.type == "ExpressionStatement") {
        return eval_expression(ast.expression, env);
    } else if (ast.type == "BinaryExpression") {
        var op = env.get(ast.operator);
        return op(eval_expression(ast.left, env), eval_expression(ast.right, env));
    } else if (ast.type == "VariableDeclaration") {
        return eval_expression(ast.declarations[0], env);
    } else if (ast.type == "VariableDeclarator") {
        var id: Identifier = ast.id as Identifier;
        env.set(id.name, eval_expression(ast.init, env));
        return null;
    } 
}

export function eval_program(ast: Program, env: Map<string, any>) {
    let ret = null;
    for (let i = 0; i < ast.body.length; i++) {
        ret = eval_expression(ast.body[i], env);
    }
    return ret;
}