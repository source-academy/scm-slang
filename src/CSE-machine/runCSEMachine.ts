import { ControlItem } from './control';
import { Environment } from './environment';
import { Stack } from './stack';
import { Atomic } from '../transpiler/types/nodes/scheme-node-types';
import { astToControl } from './astToControl';

let globalStepCount = 0;

export function runCSE(control: ControlItem[], env: Environment): any {
  const stack = new Stack();
  let stepCount = 0;

  while (control.length > 0) {
    globalStepCount += 1;
    const current = control.shift()!;

    // Kiểm tra loại node bằng instanceof
    if (current instanceof Atomic.NumericLiteral ||
        current instanceof Atomic.BooleanLiteral ||
        current instanceof Atomic.StringLiteral ||
        current instanceof Atomic.Symbol) {
      stack.push(current.value);
      continue;
    }

    if (current instanceof Atomic.Identifier) {
      const val =  env.get(current.name);
      stack.push(val);
      continue;
    }

    if (current instanceof Atomic.Definition) {
      const valControl = astToControl(current.value);
      const val = runCSE(valControl, env);
      if (env.define) env.define(current.name.name, val);
      else env.set(current.name.name, val);
      continue;
    }

    if (current instanceof Atomic.Lambda) {
      const closure = {
        type: 'Closure',
        params: current.params.map(p => p.name),
        body: current.body,
        env: env.clone ? env.clone() : env // fallback nếu không có clone
      };
      stack.push(closure);
      continue;
    }

    if (current instanceof Atomic.Application) {
      const fn = evaluateExpr(current.operator, env);
      const args = current.operands.map(arg => evaluateExpr(arg, env));
      if (typeof fn === 'function') {
        stack.push(fn(...args));
      } else if (typeof fn === 'object' && fn.type === 'Closure') {
        const newEnv = fn.env.extend ? fn.env.extend() : fn.env;
        fn.params.forEach((p: string, i: number) => {
          if (newEnv.define) newEnv.define(p, args[i]);
          else newEnv.set(p, args[i]);
        });
        const bodyControl = astToControl(fn.body);
        const result = runCSE(bodyControl, newEnv);
        stack.push(result);
      } else {
        throw new Error('Invalid function application');
      }
      continue;
    }

    if (current instanceof Atomic.Conditional) {
      const testVal = evaluateExpr(current.test, env);
      const nextExpr = testVal ? current.consequent : current.alternate;
      const controlItems = astToControl(nextExpr);
      control.unshift(...controlItems);
      continue;
    }

    throw new Error(`Unknown control item: ${current.constructor.name}`);
  }

  return stack.pop();
}

function evaluateExpr(expr: any, env: Environment): any {
  if (expr instanceof Atomic.Identifier) {
    return env.get(expr.name);
  }
  if (expr instanceof Atomic.NumericLiteral) {
    return expr.value;
  }
  if (expr instanceof Atomic.Lambda) {
    return {
      type: 'Closure',
      params: expr.params.map((p: any) => p.name),
      body: expr.body,
      env: env.clone ? env.clone() : env
    };
  }
  throw new Error(`Unhandled expr: ${JSON.stringify(expr)}`);
}