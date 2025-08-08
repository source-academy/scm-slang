import { parseSchemeDirect } from './direct-parser';
import { evaluate, Context } from './CSE-machine/interpreter';
import { createProgramEnvironment } from './CSE-machine/environment';
import { Stash } from './CSE-machine/stash';
import { Control } from './CSE-machine/control';

export class SchemeConductor {
  private context: Context;

  constructor() {
    this.context = {
      control: new Control(),
      stash: new Stash(),
      environment: createProgramEnvironment(),
      runtime: {
        isRunning: true
      }
    };
  }

  async runScheme(code: string): Promise<string> {
    try {
      // Parse the Scheme code directly
      const expressions = parseSchemeDirect(code);
      
      // Evaluate the expressions
      const result = evaluate(code, expressions, this.context);
      
      // Return the result as a string
      if (result.type === 'error') {
        throw new Error(result.message);
      } else {
        return this.valueToString(result);
      }
      
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  private valueToString(value: any): string {
    if (value.type === 'number') {
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
      return `(${value.elements.map(this.valueToString).join(' ')})`;
    } else if (value.type === 'vector') {
      return `#(${value.elements.map(this.valueToString).join(' ')})`;
    } else if (value.type === 'closure') {
      return `#<procedure>`;
    } else if (value.type === 'primitive') {
      return `#<primitive:${value.name}>`;
    } else {
      return value.toString();
    }
  }

  async runSchemeFile(filename: string): Promise<string> {
    // For now, just return an error - file reading would need to be implemented
    throw new Error(`File reading not implemented yet: ${filename}`);
  }

  shutdown(): void {
    // Clean up if needed
    this.context.runtime.isRunning = false;
  }
}

// Export for use
export { SchemeConductor as default }; 