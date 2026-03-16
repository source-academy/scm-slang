import { StepperBaseNode } from "../../interface";
import { StepperExpression, StepperPattern } from "../index";

export class StepperBinaryExpression implements StepperBaseNode {
  type = "BinaryExpression";
  operator: string;
  left: StepperBaseNode;
  right: StepperBaseNode;

  constructor(operator: string, left: StepperBaseNode, right: StepperBaseNode) {
    this.operator = operator;
    this.left = left;
    this.right = right;
  }

  static create(node: any): StepperBinaryExpression {
    // This would need to be implemented based on how Scheme binary expressions are parsed
    // For now, creating a basic implementation
    return new StepperBinaryExpression(
      node.operator || "+",
      node.left || { type: "Literal", value: 0 },
      node.right || { type: "Literal", value: 0 }
    );
  }

  isContractible(): boolean {
    return this.left.isContractible() && this.right.isContractible();
  }

  isOneStepPossible(): boolean {
    return !this.left.isContractible() || !this.right.isContractible();
  }

  contract(): StepperBaseNode {
    if (!this.isContractible()) {
      throw new Error("Cannot contract non-contractible expression");
    }

    // Evaluate the binary expression
    const leftValue = this.left.contract();
    const rightValue = this.right.contract();

    if (leftValue.type === "Literal" && rightValue.type === "Literal") {
      const left = (leftValue as any).value;
      const right = (rightValue as any).value;
      let result: any;

      switch (this.operator) {
        case "+":
          result = left + right;
          break;
        case "-":
          result = left - right;
          break;
        case "*":
          result = left * right;
          break;
        case "/":
          result = left / right;
          break;
        default:
          throw new Error(`Unknown operator: ${this.operator}`);
      }

      return {
        type: "Literal",
        value: result,
        raw: String(result),
        toString: () => String(result),
      } as any;
    }

    return this;
  }

  oneStep(): StepperBaseNode {
    if (!this.left.isContractible()) {
      return new StepperBinaryExpression(
        this.operator,
        this.left.oneStep(),
        this.right
      );
    }
    if (!this.right.isContractible()) {
      return new StepperBinaryExpression(
        this.operator,
        this.left,
        this.right.oneStep()
      );
    }
    return this.contract();
  }

  substitute(id: StepperPattern, value: StepperExpression): StepperBaseNode {
    return new StepperBinaryExpression(
      this.operator,
      this.left.substitute(id, value),
      this.right.substitute(id, value)
    );
  }

  freeNames(): string[] {
    return [...this.left.freeNames(), ...this.right.freeNames()];
  }

  allNames(): string[] {
    return [...this.left.allNames(), ...this.right.allNames()];
  }

  rename(before: string, after: string): StepperBaseNode {
    return new StepperBinaryExpression(
      this.operator,
      this.left.rename(before, after),
      this.right.rename(before, after)
    );
  }

  toString(): string {
    return `(${this.operator} ${this.left.toString()} ${this.right.toString()})`;
  }
}
