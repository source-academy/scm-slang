import { StepperBaseNode } from "./interface";
import { StepperLiteral } from "./nodes/Expression/Literal";
import { StepperBinaryExpression } from "./nodes/Expression/BinaryExpression";
import { StepperIdentifier } from "./nodes/Expression/Identifier";
import { StepperFunctionApplication } from "./nodes/Expression/FunctionApplication";
import { StepperLambdaExpression } from "./nodes/Expression/LambdaExpression";
import { StepperProgram } from "./nodes/Program";

const undefinedNode = new StepperLiteral("undefined");

// Helper function to convert nodes without circular dependency
function convertNode(node: any): StepperBaseNode {
  const nodeType = node.constructor.name;

  switch (nodeType) {
    case "NumericLiteral":
    case "BooleanLiteral":
    case "StringLiteral":
      return StepperLiteral.create(node);
    case "Identifier":
      return StepperIdentifier.create(node);
    case "Application":
      return new StepperFunctionApplication(
        convertNode(node.operator),
        node.operands.map(convertNode)
      );
    case "Lambda":
      return new StepperLambdaExpression(
        node.params || [],
        convertNode(node.body)
      );
    case "Sequence":
      return new StepperProgram(node.expressions.map(convertNode));
    default:
      return undefinedNode;
  }
}

const nodeConverters: { [Key: string]: (node: any) => StepperBaseNode } = {
  NumericLiteral: (node: any) => StepperLiteral.create(node),
  BooleanLiteral: (node: any) => StepperLiteral.create(node),
  StringLiteral: (node: any) => StepperLiteral.create(node),
  Identifier: (node: any) => StepperIdentifier.create(node),
  Application: (node: any) => convertNode(node),
  Lambda: (node: any) => convertNode(node),
  Sequence: (node: any) => convertNode(node),
};

export function convert(node: any): StepperBaseNode {
  const converter = nodeConverters[node.type as keyof typeof nodeConverters];
  return converter ? converter(node) : undefinedNode;
}

export function explain(node: StepperBaseNode): string {
  // Generate explanation based on node type
  switch (node.type) {
    case "Literal":
      return `Evaluated to literal value: ${node.toString()}`;
    case "BinaryExpression":
      return `Evaluated binary expression: ${node.toString()}`;
    case "Identifier":
      return `Variable reference: ${node.toString()}`;
    case "FunctionApplication":
      return `Function application: ${node.toString()}`;
    case "LambdaExpression":
      return `Lambda expression: ${node.toString()}`;
    default:
      return `Processed ${node.type}`;
  }
}
