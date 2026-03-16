import { StepperBaseNode } from "../../interface";
import { StepperExpression, StepperPattern } from "../index";

export class StepperLiteral implements StepperBaseNode {
  type = "Literal";
  value: any;
  raw: string;

  constructor(value: any, raw?: string) {
    this.value = value;
    this.raw = raw || String(value);
  }

  static create(node: any): StepperLiteral {
    return new StepperLiteral(node.value, String(node.value));
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
    return this;
  }

  freeNames(): string[] {
    return [];
  }

  allNames(): string[] {
    return [];
  }

  rename(before: string, after: string): StepperBaseNode {
    return this;
  }

  toString(): string {
    return this.raw;
  }
}
