import { StepperBinaryExpression } from "./Expression/BinaryExpression";
import { StepperLiteral } from "./Expression/Literal";
import { StepperIdentifier } from "./Expression/Identifier";
import { StepperFunctionApplication } from "./Expression/FunctionApplication";
import { StepperLambdaExpression } from "./Expression/LambdaExpression";
import { StepperProgram } from "./Program";

export type StepperExpression =
  | StepperBinaryExpression
  | StepperLiteral
  | StepperPattern
  | StepperFunctionApplication
  | StepperLambdaExpression;

export type StepperPattern = StepperIdentifier;

export {
  StepperBinaryExpression,
  StepperLiteral,
  StepperIdentifier,
  StepperFunctionApplication,
  StepperLambdaExpression,
  StepperProgram,
};
