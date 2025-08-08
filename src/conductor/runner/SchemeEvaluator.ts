import { BasicEvaluator } from './BasicEvaluator';
import { IRunnerPlugin } from './types';
import { parseSchemeSimple } from '../../CSE-machine/simple-parser';
import { evaluate, Context } from '../../CSE-machine/interpreter';
import { createProgramEnvironment } from '../../CSE-machine/environment';
import { Stash } from '../../CSE-machine/stash';
import { Control } from '../../CSE-machine/control';
import { Value } from '../../CSE-machine/stash';
import { ConductorError } from '../../common/errors/ConductorError';

export class SchemeEvaluator extends BasicEvaluator {
  private context: Context;

  constructor(conductor: IRunnerPlugin) {
    super(conductor);
    this.context = {
      control: new Control(),
      stash: new Stash(),
      environment: createProgramEnvironment(),
      runtime: {
        isRunning: true
      }
    };
  }

  async evaluateChunk(chunk: string): Promise<void> {
    try {
      // Parse the Scheme code using simple parser
      const expressions = parseSchemeSimple(chunk);
      
      // Evaluate the expressions
      const result = evaluate(chunk, expressions, this.context);
      
      // Send output to the conductor
      if (result.type === 'error') {
        const conductorError = new ConductorError(result.message);
        this.conductor.sendError(conductorError);
      } else {
        // Send the result as output
        this.conductor.sendOutput(this.valueToString(result));
      }
      
    } catch (error: any) {
      const conductorError = new ConductorError(error.message);
      this.conductor.sendError(conductorError);
    }
  }

  private valueToString(value: Value): string {
    if (value.type === 'number') {
      return value.value.toString();
    } else if (value.type === 'complex') {
      return value.value.toString();
    } else if (value.type === 'string') {
      return value.value;
    } else if (value.type === 'boolean') {
      return value.value ? '#t' : '#f';
    } else if (value.type === 'symbol') {
      return value.value;
    } else if (value.type === 'nil') {
      return '()';
    } else if (value.type === 'pair') {
      return `(${this.valueToString(value.car)} . ${this.valueToString(value.cdr)})`;
    } else if (value.type === 'list') {
      return `(${value.elements.map((el: Value) => this.valueToString(el)).join(' ')})`;
    } else if (value.type === 'vector') {
      return `#(${value.elements.map((el: Value) => this.valueToString(el)).join(' ')})`;
    } else if (value.type === 'closure') {
      return `#<procedure>`;
    } else if (value.type === 'primitive') {
      return `#<primitive:${value.name}>`;
    } else if (value.type === 'error') {
      return `Error: ${value.message}`;
    } else {
      return String(value);
    }
  }
} 