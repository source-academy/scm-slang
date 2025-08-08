import { Expression, Atomic, Extended } from '../transpiler/types/nodes/scheme-node-types';
import { Control, ControlItem } from './control';
import { Stash, Value } from './stash';
import { Environment, createBlockEnvironment, createEnvironment, createProgramEnvironment, currentEnvironment, popEnvironment, pushEnvironment } from './environment';
import { Instr, InstrType, DefineInstr, SetInstr, CondInstr, LetInstr, BeginInstr, DelayInstr, PairInstr, ListInstr, VectorInstr, SymbolInstr, NilInstr, CarInstr, CdrInstr, ConsInstr, AppInstr, BranchInstr, StatementSequence } from './types';
import * as instr from './instrCreator';
import { primitives } from './primitives';
import { SchemeComplexNumber } from './complex';

export interface Context {
  control: Control;
  stash: Stash;
  environment: Environment;
  runtime: {
    isRunning: boolean;
  };
}

export function evaluate(code: string, program: Expression[], context: Context): Value {
  try {
    // Initialize
    context.runtime.isRunning = true;
    context.stash = new Stash();
    context.control = new Control();
    
    // Initialize environment with primitives
    Object.entries(primitives).forEach(([name, func]) => {
      context.environment.define(name, { type: 'primitive', name, func });
    });
    
    // Push expressions in reverse order
    for (let i = program.length - 1; i >= 0; i--) {
      context.control.push(program[i]);
    }
    
    // Run CSE machine using the existing function
    const result = runCSEMachine(code, context, context.control, context.stash);
    return result;
    
  } catch (error: any) {
    return { type: 'error', message: error.message };
  }
}

function initializeEnvironment(environment: Environment): void {
  // Add all primitive functions to the environment
  Object.entries(primitives).forEach(([name, func]) => {
    environment.define(name, { type: 'primitive', name, func });
  });
}

function runCSEMachine(
  code: string,
  context: Context,
  control: Control,
  stash: Stash
): Value {
  while (!control.isEmpty() && context.runtime.isRunning) {
    const item = control.pop();
    if (!item) break;
    
    evaluateControlItem(item, context, control, stash);
  }
  
  const result = stash.pop();
  return result || { type: 'nil' };
}

function evaluateControlItem(
  item: ControlItem,
  context: Context,
  control: Control,
  stash: Stash
): void {
  if (isInstr(item)) {
    evaluateInstruction(item, context, control, stash);
  } else if (isStatementSequence(item)) {
    // Handle StatementSequence by pushing all expressions in reverse order
    const seq = item as StatementSequence;
    for (let i = seq.body.length - 1; i >= 0; i--) {
      control.push(seq.body[i]);
    }
  } else {
    evaluateExpression(item as Expression, context, control, stash);
  }
}

function isStatementSequence(item: ControlItem): item is StatementSequence {
  return 'type' in item && item.type === 'StatementSequence';
}

function isInstr(item: ControlItem): item is Instr {
  return 'instrType' in item;
}

function evaluateExpression(
  expr: Expression,
  context: Context,
  control: Control,
  stash: Stash
): void {
  if (expr instanceof Atomic.NumericLiteral) {
    stash.push({ type: 'number', value: parseFloat(expr.value) });
  } else if (expr instanceof Atomic.ComplexLiteral) {
    try {
      const complexNumber = SchemeComplexNumber.fromString(expr.value);
      stash.push({ type: 'complex', value: complexNumber });
    } catch (error: any) {
      stash.push({ type: 'error', message: `Invalid complex number: ${error.message}` });
    }
  } else if (expr instanceof Atomic.BooleanLiteral) {
    stash.push({ type: 'boolean', value: expr.value });
  } else if (expr instanceof Atomic.StringLiteral) {
    stash.push({ type: 'string', value: expr.value });
  } else if (expr instanceof Atomic.Symbol) {
    stash.push({ type: 'symbol', value: expr.value });
  } else if (expr instanceof Atomic.Nil) {
    stash.push({ type: 'nil' });
  }  else if (expr instanceof Atomic.Identifier) {
    const value = context.environment.get(expr.name);
    stash.push(value);
  } else if (expr instanceof Atomic.Definition) {
    // Push the value to be evaluated, then the define instruction
    control.push(expr.value);
    control.push(instr.createDefineInstr(expr.name.name, expr.value));
  } else if (expr instanceof Atomic.Reassignment) {
    // Push the value to be evaluated, then the set instruction
    control.push(expr.value);
    control.push(instr.createSetInstr(expr.name.name, expr.value));
  } else if (expr instanceof Atomic.Application) {
    // Push the application instruction first (so it's executed last)
    control.push(instr.createAppInstr(expr.operands.length, expr));
    
    // Push the operator (so it's evaluated before the instruction)
    control.push(expr.operator);
    
    // Push operands in reverse order (so they are evaluated left-to-right)
    for (let i = expr.operands.length - 1; i >= 0; i--) {
      control.push(expr.operands[i]);
    }
  }  else if (expr instanceof Atomic.Conditional) {
    // Push test, consequent, alternate, then branch instruction
    control.push(expr.test);
    control.push(expr.consequent);
    control.push(expr.alternate);
    control.push(instr.createBranchInstr(expr.consequent, expr.alternate));
  } else if (expr instanceof Atomic.Lambda) {
    // Create closure
    const closure: Value = {
      type: 'closure',
      params: expr.params.map(p => p.name),
      body: [expr.body],
      env: context.environment
    };
    stash.push(closure);
  } else if (expr instanceof Atomic.Pair) {
    // Push car and cdr to be evaluated, then pair instruction
    control.push(expr.car);
    control.push(expr.cdr);
    control.push(instr.createPairInstr(expr.car, expr.cdr));
  } else if (expr instanceof Extended.List) {
    // Push elements to be evaluated, then list instruction
    for (let i = expr.elements.length - 1; i >= 0; i--) {
      control.push(expr.elements[i]);
    }
    control.push(instr.createListInstr(expr.elements, expr.terminator));
  } else if (expr instanceof Atomic.Vector) {
    // Push elements to be evaluated, then vector instruction
    for (let i = expr.elements.length - 1; i >= 0; i--) {
      control.push(expr.elements[i]);
    }
    control.push(instr.createVectorInstr(expr.elements));
  } else if (expr instanceof Extended.Begin) {
    // Push expressions to be evaluated, then begin instruction
    for (let i = expr.expressions.length - 1; i >= 0; i--) {
      control.push(expr.expressions[i]);
    }
    control.push(instr.createBeginInstr(expr.expressions));
  } else if (expr instanceof Extended.Let) {
    // Push values, then let instruction
    for (let i = expr.values.length - 1; i >= 0; i--) {
      control.push(expr.values[i]);
    }
    control.push(instr.createLetInstr(
      expr.identifiers.map(id => id.name),
      expr.values,
      expr.body
    ));
  } else if (expr instanceof Extended.Cond) {
    // Push predicates and consequents, then cond instruction
    for (let i = expr.predicates.length - 1; i >= 0; i--) {
      control.push(expr.predicates[i]);
      control.push(expr.consequents[i]);
    }
    if (expr.catchall) {
      control.push(expr.catchall);
    }
    control.push(instr.createCondInstr(expr.predicates, expr.consequents, expr.catchall));
  } else if (expr instanceof Extended.Delay) {
    // Push expression to be evaluated, then delay instruction
    control.push(expr.expression);
    control.push(instr.createDelayInstr(expr.expression));
  } else {
    throw new Error(`Unsupported expression type: ${expr.constructor.name}`);
  }
}

function evaluateInstruction(
  instruction: Instr,
  context: Context,
  control: Control,
  stash: Stash
): void {
  switch (instruction.instrType) {
    case InstrType.DEFINE: {
      const value = stash.pop();
      if (!value) throw new Error('No value to define');
      const defineInstr = instruction as DefineInstr;
      context.environment.define(defineInstr.name, value);
      break;
    }
    
    case InstrType.SET: {
      const value = stash.pop();
      if (!value) throw new Error('No value to set');
      const setInstr = instruction as SetInstr;
      context.environment.set(setInstr.name, value);
      break;
    }
    
    case InstrType.APPLICATION: {
      const appInstr = instruction as AppInstr;
      const operator = stash.pop();
      if (!operator) throw new Error('No operator for application');
      
      const args: Value[] = [];
      for (let i = 0; i < appInstr.numOfArgs; i++) {
        const arg = stash.pop();
        if (arg) args.unshift(arg);
      }
      
      if (operator.type === 'closure') {
        // Apply closure
        const newEnv = createBlockEnvironment(operator.env);
        for (let i = 0; i < operator.params.length; i++) {
          newEnv.define(operator.params[i], args[i] || { type: 'nil' });
        }
        context.environment = newEnv;
        control.push(...operator.body);
      } else if (operator.type === 'primitive') {
        // Apply primitive function
        try {
          const result = operator.func(...args);
          stash.push(result);
        } catch (error: any) {
          stash.push({ type: 'error', message: error.message });
        }
      } else {
        stash.push({ type: 'error', message: `Cannot apply non-function: ${operator.type}` });
      }
      break;
    }
    
    case InstrType.BRANCH: {
      const test = stash.pop();
      if (!test) throw new Error('No test value for branch');
      const branchInstr = instruction as BranchInstr;
      
      if (test.type === 'boolean' && test.value) {
        control.push(branchInstr.consequent);
      } else if (branchInstr.alternate) {
        control.push(branchInstr.alternate);
      }
      break;
    }
    
    case InstrType.PAIR: {
      const cdr = stash.pop();
      const car = stash.pop();
      if (!car || !cdr) throw new Error('Missing car or cdr for pair');
      
      stash.push({ type: 'pair', car, cdr });
      break;
    }
    
    case InstrType.LIST: {
      const listInstr = instruction as ListInstr;
      const elements: Value[] = [];
      for (let i = 0; i < listInstr.elements.length; i++) {
        const element = stash.pop();
        if (element) elements.unshift(element);
      }
      stash.push({ type: 'list', elements });
      break;
    }
    
    case InstrType.VECTOR: {
      const vectorInstr = instruction as VectorInstr;
      const elements: Value[] = [];
      for (let i = 0; i < vectorInstr.elements.length; i++) {
        const element = stash.pop();
        if (element) elements.unshift(element);
      }
      stash.push({ type: 'vector', elements });
      break;
    }
    
    case InstrType.BEGIN: {
      // Begin evaluates all expressions and returns the last one
      const beginInstr = instruction as BeginInstr;
      const expressions = beginInstr.expressions;
      if (expressions.length === 0) {
        stash.push({ type: 'nil' });
      } else if (expressions.length === 1) {
        control.push(expressions[0]);
      } else {
        // Push all expressions to be evaluated
        for (let i = expressions.length - 1; i >= 0; i--) {
          control.push(expressions[i]);
        }
      }
      break;
    }
    
    case InstrType.LET: {
      // Let creates a new environment with bindings
      const letInstr = instruction as LetInstr;
      const values: Value[] = [];
      for (let i = 0; i < letInstr.values.length; i++) {
        const value = stash.pop();
        if (value) values.unshift(value);
      }
      
      const newEnv = createBlockEnvironment(context.environment);
      for (let i = 0; i < letInstr.identifiers.length; i++) {
        newEnv.define(letInstr.identifiers[i], values[i] || { type: 'nil' });
      }
      
      context.environment = newEnv;
      control.push(letInstr.body);
      break;
    }
    
    case InstrType.COND: {
      // Cond evaluates predicates and consequents
      const condInstr = instruction as CondInstr;
      const predicates = condInstr.predicates;
      const consequents = condInstr.consequents;
      
      if (predicates.length === 0) {
        if (condInstr.catchall) {
          control.push(condInstr.catchall);
        } else {
          stash.push({ type: 'nil' });
        }
      } else {
        // Push first predicate and consequent
        control.push(predicates[0]);
        control.push(consequents[0]);
        // Push remaining predicates and consequents
        for (let i = 1; i < predicates.length; i++) {
          control.push(predicates[i]);
          control.push(consequents[i]);
        }
        if (condInstr.catchall) {
          control.push(condInstr.catchall);
        }
      }
      break;
    }
    
    default:
      throw new Error(`Unsupported instruction type: ${instruction.instrType}`);
  }
}
