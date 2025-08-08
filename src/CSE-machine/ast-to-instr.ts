// ast-to-instr.ts
import { Expression, Atomic } from '../transpiler/types/nodes/scheme-node-types';
import {
  createDefineInstr,
  createSetInstr,
  createAppInstr,
  createBranchInstr,
  createPairInstr,
  createListInstr,
  createVectorInstr,
  createSymbolInstr,
  createNilInstr,
  createCarInstr,
  createCdrInstr,
  createConsInstr,
  createLetInstr,
  createBeginInstr,
  createDelayInstr,
  createCondInstr
} from './instrCreator';
import { Instr } from './types';

export function transformExprToInstr(expr: Expression): Instr[] {
  if (
    expr instanceof Atomic.NumericLiteral ||
    expr instanceof Atomic.BooleanLiteral ||
    expr instanceof Atomic.StringLiteral ||
    expr instanceof Atomic.Symbol
  ) {
    const literal = expr as Atomic.Literal;
    return [literalInstr(literal.value, expr)];
  }

  if (expr instanceof Atomic.Identifier) {
    return [variableInstr(expr.name, expr)];
  }

  if (expr instanceof Atomic.Definition) {
    return [
      ...transformExprToInstr(expr.value),
      defineInstr(expr.name.name, expr)
    ];
  }

  if (expr instanceof Atomic.Reassignment) {
    return [
      ...transformExprToInstr(expr.value),
      assignInstr(expr.name.name, expr)
    ];
  }

  if (expr instanceof Atomic.Lambda) {
    const paramNames = expr.params.map(p => p.name);
    // Chuyển body về danh sách expression nếu cần
    const body = expr.body instanceof Atomic.Sequence ? expr.body.expressions : [expr.body];
    return [lambdaInstr(paramNames, body, expr)];
  }

  if (expr instanceof Atomic.Conditional) {
    return [
      ...transformExprToInstr(expr.test),
      ...transformExprToInstr(expr.consequent),
      ...transformExprToInstr(expr.alternate),
      ifInstr(expr.test, expr.consequent, expr.alternate, expr)
    ];
  }

  if (expr instanceof Atomic.Application) {
    const instrs: Instr[] = [];

    for (let i = expr.operands.length - 1; i >= 0; i--) {
      instrs.push(...transformExprToInstr(expr.operands[i]));
    }

    instrs.push(...transformExprToInstr(expr.operator));
    instrs.push(applicationInstr(expr.operands.length, expr));
    return instrs;
  }

  if (expr instanceof Atomic.Sequence) {
    return expr.expressions.flatMap(transformExprToInstr);
  }

  throw new Error(`Unhandled expression type: ${expr.constructor.name}`);
}

export function transformProgramToInstrs(exprs: Expression[]): Instr[] {
  return exprs.flatMap(transformExprToInstr);
}
