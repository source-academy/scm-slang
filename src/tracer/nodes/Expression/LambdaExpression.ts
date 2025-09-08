import { StepperBaseNode } from "../../interface";
import { StepperExpression, StepperPattern } from "../index";

export class StepperLambdaExpression implements StepperBaseNode {
  type = "LambdaExpression";
  params: StepperPattern[];
  body: StepperBaseNode;

  constructor(params: StepperPattern[], body: StepperBaseNode) {
    this.params = params;
    this.body = body;
  }

  static create(node: any): StepperLambdaExpression {
    // This will be handled by the convertNode function in generator.ts
    return new StepperLambdaExpression(node.params || [], node.body);
  }

  isContractible(): boolean {
    return true; // Lambda expressions are irreducible
  }

  isOneStepPossible(): boolean {
    return false; // Lambda expressions cannot be stepped
  }

  contract(): StepperBaseNode {
    return this; // Lambda expressions are irreducible
  }

  oneStep(): StepperBaseNode {
    return this; // Lambda expressions cannot be stepped
  }

  substitute(id: StepperPattern, value: StepperExpression): StepperBaseNode {
    // Don't substitute if the identifier is bound by this lambda
    if (this.params.some(param => param.name === id.name)) {
      return this;
    }

    return new StepperLambdaExpression(
      this.params,
      this.body.substitute(id, value)
    );
  }

  freeNames(): string[] {
    const paramNames = this.params.map(p => p.name);
    return this.body.freeNames().filter(name => !paramNames.includes(name));
  }

  allNames(): string[] {
    const paramNames = this.params.map(p => p.name);
    return [...paramNames, ...this.body.allNames()];
  }

  rename(before: string, after: string): StepperBaseNode {
    // Rename parameters if they match
    const newParams = this.params.map(param =>
      param.name === before ? new (param.constructor as any)(after) : param
    );

    return new StepperLambdaExpression(
      newParams,
      this.body.rename(before, after)
    );
  }

  toString(): string {
    const paramsStr = this.params.map(p => p.toString()).join(" ");
    return `(lambda (${paramsStr}) ${this.body.toString()})`;
  }
}
