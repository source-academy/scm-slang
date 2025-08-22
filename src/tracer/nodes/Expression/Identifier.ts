import { StepperBaseNode } from '../../interface';
import { StepperExpression, StepperPattern } from '../index';

export class StepperIdentifier implements StepperBaseNode {
  type = 'Identifier';
  name: string;

  constructor(name: string) {
    this.name = name;
  }

  static create(node: any): StepperIdentifier {
    return new StepperIdentifier(node.name);
  }

  isContractible(): boolean {
    return true;
  }

  isOneStepPossible(): boolean {
    return false;
  }

  contract(): StepperBaseNode {
    return this;
  }

  oneStep(): StepperBaseNode {
    return this;
  }

  substitute(id: StepperPattern, value: StepperExpression): StepperBaseNode {
    if (this.name === id.name) {
      return value;
    }
    return this;
  }

  freeNames(): string[] {
    return [this.name];
  }

  allNames(): string[] {
    return [this.name];
  }

  rename(before: string, after: string): StepperBaseNode {
    if (this.name === before) {
      return new StepperIdentifier(after);
    }
    return this;
  }

  toString(): string {
    return this.name;
  }
}
