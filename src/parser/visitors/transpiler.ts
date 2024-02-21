/**
 * The final transpiler visitor.
 * Takes in expressions, yields es.Node[], so we can flatmap into a final program
 * Each individual visitor should return an item that could evaluate as a expression
 */

import { Atomic, Extended } from "../types/scheme-node-types";
import { Visitor } from "./visitor";

export class Transpiler implements Visitor {
  // Atomic AST

  // iife
  visitSequence(node: Atomic.Sequence): any;

  // literals
  visitNumericLiteral(node: Atomic.NumericLiteral): any;
  visitBooleanLiteral(node: Atomic.BooleanLiteral): any;
  visitStringLiteral(node: Atomic.StringLiteral): any;
  visitLambda(node: Atomic.Lambda): any;

  // identifiers
  visitIdentifier(node: Atomic.Identifier): any;

  // turns into statement + undefined expression
  visitDefinition(node: Atomic.Definition): any;

  // expressions
  visitApplication(node: Atomic.Application): any;
  visitConditional(node: Atomic.Conditional): any;

  // turns into classes etc
  visitPair(node: Atomic.Pair): any;
  visitNil(node: Atomic.Nil): any;
  visitSymbol(node: Atomic.Symbol): any;
  visitSpliceMarker(node: Atomic.SpliceMarker): any;

  // turns into expression that returns assigned value
  // maybe in the future we can make a setall! macro
  visitReassignment(node: Atomic.Reassignment): any;

  // make a verifier that keeps this top level
  visitImport(node: Atomic.Import): any;
  visitExport(node: Atomic.Export): any;

  // turn into an array
  visitVector(node: Atomic.Vector): any;

  // Extended AST

  // also represented as expressions
  visitFunctionDefinition(node: Extended.FunctionDefinition): any;
  visitLet(node: Extended.Let): any;
  visitCond(node: Extended.Cond): any;

  // also represented as expressions
  visitList(node: Extended.List): any;

  visitBegin(node: Extended.Begin): any;
  visitDelay(node: Extended.Delay): any;
  visitForce(node: Extended.Force): any;
}
