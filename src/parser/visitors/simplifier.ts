/**
 * A visitor that transforms all "extended AST" nodes into "atomic AST" nodes.
 */

import { Atomic, Extended } from '../types/node-types';
import { Visitor } from './visitor';

export class Simplifier implements Visitor {
  
  // Currently quoting.
  isSomeQuote: boolean;

  // Currently quasi-quoting.
  isQuasiquote: boolean;
  
  constructor (isSomeQuote: boolean, isQuasiquote: boolean) {
    this.isSomeQuote = isSomeQuote;
    this.isQuasiquote = isQuasiquote;
  }

  // Factory method for creating a new Simplifier instance.
  static createDefault(): Simplifier {
    return new Simplifier(false, false);
  }

  // Factory method for creating a new Quoting Simplifier instance.
  static createQuoting(): Simplifier {
    return new Simplifier(true, false);
  }

  // Factory method for creating a new Quasi-Quoting Simplifier instance.
  static createQuasiQuoting(): Simplifier {
    return new Simplifier(true, true);
  }

  // Atomic AST
  visitSequence(node: Atomic.Sequence): Atomic.Sequence {
    const location = node.location;
    const newExpressions = node.expressions
      .map((expression) => expression.accept(this));
    return new Atomic.Sequence(location, newExpressions);
  }

  visitNumericLiteral(node: Atomic.NumericLiteral): Atomic.NumericLiteral {
    return node;
  }
  visitBooleanLiteral(node: Atomic.BooleanLiteral): Atomic.BooleanLiteral {
    return node;
  }
  visitStringLiteral(node: Atomic.StringLiteral): Atomic.StringLiteral {
    return node;
  }
  visitLambda(node: Atomic.Lambda): Atomic.Lambda {
    const location = node.location;
    const params = node.params;
    const newBody = node.body.accept(this);
    return new Atomic.Lambda(location, params, newBody);
  }

  visitIdentifier(node: Atomic.Identifier): Atomic.Identifier {
    return node;
  }
  visitDefinition(node: Atomic.Definition): Atomic.Definition {
    const location = node.location;
    const name = node.name;
    const newValue = node.value.accept(this);
    return new Atomic.Definition(location, name, newValue);
  }

  visitApplication(node: Atomic.Application): Atomic.Application {
    const location = node.location;
    const newOperator = node.operator.accept(this);
    const newOperands = node.operands.map((operand) => operand.accept(this));
    return new Atomic.Application(location, newOperator, newOperands);
  }
  visitConditional(node: Atomic.Conditional): Atomic.Conditional {
    const location = node.location;
    const newTest = node.test.accept(this);
    const newConsequent = node.consequent.accept(this);
    const newAlternate = node.alternate.accept(this);
    return new Atomic.Conditional(location, newTest, newConsequent, newAlternate);
  }

  visitPair(node: Atomic.Pair): Atomic.Pair {
    const location = node.location;
    const newCar = node.car.accept(this);
    const newCdr = node.cdr.accept(this);
    return new Atomic.Pair(location, newCar, newCdr);
  }
  visitNil(node: Atomic.Nil): Atomic.Nil {
    return node;
  }
  visitSymbol(node: Atomic.Symbol): Atomic.Symbol {
    return node;
  }

  visitReassignment(node: Atomic.Reassignment): Atomic.Reassignment {
    const location = node.location;
    const name = node.name;
    const newValue = node.value.accept(this);
    return new Atomic.Reassignment(location, name, newValue);
  }

  visitImport(node: Atomic.Import): Atomic.Import {
    return node;
  }
  visitExport(node: Atomic.Export): Atomic.Export {
    const location = node.location;
    const newDefinition = node.definition.accept(this);
    return new Atomic.Export(location, newDefinition);
  }

  // Extended AST
  visitFunctionDefinition(node: Extended.FunctionDefinition): Atomic.Definition {
    const location = node.location;
    const name = node.name;
    const params = node.params;
    const newBody = node.body.accept(this);

    const newLambda = new Atomic.Lambda(location, params, newBody);
    return new Atomic.Definition(location, name, newLambda);

  }

  visitLet(node: Extended.Let): Atomic.Application {
    const location = node.location;
    const identifiers = node.identifiers;
    const newValues = node.values.map((value) => value.accept(this));
    const newBody = node.body.accept(this);

    const newLambda = new Atomic.Lambda(location, identifiers, newBody);
    return new Atomic.Application(location, newLambda, newValues);
  }

  visitCond(node: Extended.Cond): Atomic.Conditional {
    const location = node.location;
    const newPredicates = node.predicates.map((predicate) => predicate.accept(this));
    const newConsequents = node.consequents.map((consequent) => consequent.accept(this));
    const newCatchall = node.catchall ? node.catchall.accept(this) : node.catchall;
    for (let i = 0; i < newPredicates.length; i++) {
    }

    throw new Error("Cond Not implemented yet");
    // NOT IMPLEMENTED YET
    return new Atomic.Conditional(location, newPredicates[0], newConsequents[0], newCatchall);
  }

  visitList(node: Extended.List): Atomic.Pair {
    throw new Error("List Not implemented yet");
  }

  visitQuote(node: Extended.Quote): Atomic.Pair | Atomic.Literal | Atomic.Symbol {
    const location = node.location;
    const quotingSimplifier = Simplifier.createQuoting();
    const newExpression = node.expression.accept(quotingSimplifier);

    throw new Error("Quote Not implemented yet");
    return newExpression;
  }

  visitUnquote(node: Extended.Unquote): Atomic.Pair {
    throw new Error("Unquote Not implemented yet");

  }

  visitBegin(node: Extended.Begin): Atomic.Sequence {
    const location = node.location;
    const newExpressions = node.expressions.map((expression) => expression.accept(this));
    
    return new Atomic.Sequence(location, newExpressions);
  }

  visitDelay(node: Extended.Delay): Atomic.Lambda {
    const location = node.location;
    const newBody = node.expression.accept(this);

    return new Atomic.Lambda(location, [], newBody);
  }

  visitForce(node: Extended.Force): Atomic.Application {
    const location = node.location;
    const NewExpression = node.expression.accept(this);
    return new Atomic.Application(location, NewExpression, []);
  }
}