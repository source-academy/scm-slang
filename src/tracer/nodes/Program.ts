import { StepperBaseNode } from '../interface';
import { StepperExpression, StepperPattern } from './index';

export class StepperProgram implements StepperBaseNode {
  type = 'Program';
  body: StepperBaseNode[];

  constructor(body: StepperBaseNode[]) {
    this.body = body;
  }

  static create(node: any): StepperProgram {
    // This will be handled by the convertNode function in generator.ts
    return new StepperProgram(
      node.expressions || []
    );
  }

  isContractible(): boolean {
    return this.body.every(expr => expr.isContractible());
  }

  isOneStepPossible(): boolean {
    return this.body.some(expr => expr.isOneStepPossible());
  }

  contract(): StepperBaseNode {
    if (!this.isContractible()) {
      throw new Error('Cannot contract non-contractible program');
    }
    
    // Contract all expressions in the program
    const contractedBody = this.body.map(expr => expr.contract());
    
    // If there's only one expression left, return it
    if (contractedBody.length === 1) {
      return contractedBody[0];
    }
    
    return new StepperProgram(contractedBody);
  }

  oneStep(): StepperBaseNode {
    // Find the first expression that can be stepped
    for (let i = 0; i < this.body.length; i++) {
      const expr = this.body[i];
      
      if (expr.isOneStepPossible()) {
        const newBody = [...this.body];
        newBody[i] = expr.oneStep();
        return new StepperProgram(newBody);
      }
    }
    
    // If we can contract the entire program, do it
    if (this.isContractible()) {
      return this.contract();
    }
    
    return this;
  }

  substitute(id: StepperPattern, value: StepperExpression): StepperBaseNode {
    return new StepperProgram(
      this.body.map(expr => expr.substitute(id, value))
    );
  }

  freeNames(): string[] {
    return this.body.flatMap(expr => expr.freeNames());
  }

  allNames(): string[] {
    return this.body.flatMap(expr => expr.allNames());
  }

  rename(before: string, after: string): StepperBaseNode {
    return new StepperProgram(
      this.body.map(expr => expr.rename(before, after))
    );
  }

  toString(): string {
    return this.body.map(expr => expr.toString()).join('\n');
  }
}
