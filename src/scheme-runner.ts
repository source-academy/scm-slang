import { parseSchemeDirect } from './direct-parser';
import { evaluate, Context } from './CSE-machine/interpreter';
import { createProgramEnvironment } from './CSE-machine/environment';
import { Stash } from './CSE-machine/stash';
import { Control } from './CSE-machine/control';
import { Expression } from './transpiler/types/nodes/scheme-node-types';

export interface SchemeResult {
  status: 'finished' | 'error';
  value?: any;
  error?: string;
}

export interface SchemeOptions {
  stepLimit?: number;
  envSteps?: number;
  isPrelude?: boolean;
}

export function runScheme(
  code: string,
  options: SchemeOptions = {}
): SchemeResult {
  try {
    // Parse the Scheme code directly into Scheme AST
    const expressions = parseSchemeDirect(code);
    
    // Create context
    const context: Context = {
      control: new Control(),
      stash: new Stash(),
      environment: createProgramEnvironment(),
      runtime: {
        isRunning: true
      }
    };
    
    // Evaluate the program
    const result = evaluate(code, expressions, context);
    
    if (result.type === 'error') {
      return {
        status: 'error',
        error: result.message
      };
    }
    
    return {
      status: 'finished',
      value: result
    };
    
  } catch (error: any) {
    return {
      status: 'error',
      error: error.message
    };
  }
}

// Export the main function for use
export { runScheme as default }; 