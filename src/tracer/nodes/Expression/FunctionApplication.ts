import { StepperBaseNode } from "../../interface";
import { StepperExpression, StepperPattern } from "../index";

export class StepperFunctionApplication implements StepperBaseNode {
  type = "FunctionApplication";
  operator: StepperBaseNode;
  operands: StepperBaseNode[];

  constructor(operator: StepperBaseNode, operands: StepperBaseNode[]) {
    this.operator = operator;
    this.operands = operands;
  }

  static create(node: any): StepperFunctionApplication {
    // This will be handled by the convertNode function in generator.ts
    return new StepperFunctionApplication(node.operator, node.operands);
  }

  isContractible(): boolean {
    // Check if operator is a lambda and all operands are literals
    if (this.operator.type === "LambdaExpression") {
      return this.operands.every(op => op.isContractible());
    }
    return false;
  }

  isOneStepPossible(): boolean {
    // Can step if any operand is not contractible, or if operator is lambda and all operands are contractible
    return (
      this.operands.some(op => !op.isContractible()) || this.isContractible()
    );
  }

  contract(): StepperBaseNode {
    if (!this.isContractible()) {
      throw new Error("Cannot contract non-contractible expression");
    }

    // Perform beta-reduction for lambda applications
    if (this.operator.type === "LambdaExpression") {
      const lambda = this.operator as any;
      let body = lambda.body;

      // Substitute parameters with arguments
      for (
        let i = 0;
        i < lambda.params.length && i < this.operands.length;
        i++
      ) {
        const param = lambda.params[i];
        const arg = this.operands[i];
        body = body.substitute(param, arg);
      }

      return body;
    }

    return this;
  }

  oneStep(): StepperBaseNode {
    // First, step any non-contractible operands
    const steppedOperands = this.operands.map(op =>
      op.isContractible() ? op : op.oneStep()
    );

    // If all operands are now contractible and operator is lambda, contract
    if (
      this.operator.type === "LambdaExpression" &&
      steppedOperands.every(op => op.isContractible())
    ) {
      return this.contract();
    }

    return new StepperFunctionApplication(this.operator, steppedOperands);
  }

  substitute(id: StepperPattern, value: StepperExpression): StepperBaseNode {
    return new StepperFunctionApplication(
      this.operator.substitute(id, value),
      this.operands.map(op => op.substitute(id, value))
    );
  }

  freeNames(): string[] {
    return [
      ...this.operator.freeNames(),
      ...this.operands.flatMap(op => op.freeNames()),
    ];
  }

  allNames(): string[] {
    return [
      ...this.operator.allNames(),
      ...this.operands.flatMap(op => op.allNames()),
    ];
  }

  rename(before: string, after: string): StepperBaseNode {
    return new StepperFunctionApplication(
      this.operator.rename(before, after),
      this.operands.map(op => op.rename(before, after))
    );
  }

  toString(): string {
    return `(${this.operator.toString()} ${this.operands.map(op => op.toString()).join(" ")})`;
  }
}
