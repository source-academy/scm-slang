/**
 * A visitor that transforms all "extended AST" nodes into "atomic AST" nodes.
 * Except for everything inside a quote, which is left alone.
 */

import { Expression, Atomic, Extended } from "../types/node-types";
import { Visitor } from "./visitor";
import { Location } from "../types/location";

export class Simplifier implements Visitor {
  // Factory method for creating a new Simplifier instance.
  public static create(): Simplifier {
    return new Simplifier();
  }

  // Atomic AST
  visitSequence(node: Atomic.Sequence): Atomic.Sequence {
    const location = node.location;
    const newExpressions = node.expressions.map((expression) =>
      expression.accept(this),
    );
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

    return new Atomic.Conditional(
      location,
      newTest,
      newConsequent,
      newAlternate,
    );
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

  // Already in simplest form.
  visitImport(node: Atomic.Import): Atomic.Import {
    return node;
  }

  visitExport(node: Atomic.Export): Atomic.Export {
    const location = node.location;
    const newDefinition = node.definition.accept(this);

    return new Atomic.Export(location, newDefinition);
  }

  // Extended AST
  visitFunctionDefinition(
    node: Extended.FunctionDefinition,
  ): Atomic.Definition {
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

  visitCond(node: Extended.Cond): Expression {
    const location = node.location;
    const newPredicates = node.predicates.map((predicate) =>
      predicate.accept(this),
    );
    const newConsequents = node.consequents.map((consequent) =>
      consequent.accept(this),
    );
    const newCatchall = node.catchall
      ? node.catchall.accept(this)
      : node.catchall;

    if (newPredicates.length == 0) {
      // Return catchall if there is no predicate
      return new Atomic.Conditional(
        location,
        new Atomic.BooleanLiteral(location, false),
        new Atomic.Nil(location),
        node.catchall ? newCatchall : new Atomic.Nil(location),
      );
    }

    newPredicates.reverse();
    newConsequents.reverse();
    const lastLocation = newPredicates[0].location;
    let newConditional = newCatchall
      ? newCatchall
      : new Atomic.Nil(lastLocation);

    for (let i = 0; i < newPredicates.length; i++) {
      const predicate = newPredicates[i];
      const consequent = newConsequents[i];
      const predLocation = predicate.location;
      const consLocation = consequent.location;
      const newLocation = new Location(predLocation.start, consLocation.end);
      newConditional = new Atomic.Conditional(
        newLocation,
        predicate,
        consequent,
        newConditional,
      );
    }

    return newConditional;
  }

  visitList(node: Extended.List): Atomic.Pair | Atomic.Nil {
    const location = node.location;
    const newElements = node.elements.map((element) => element.accept(this));

    if (newElements.length === 0) {
      return new Atomic.Nil(location);
    }
    if (newElements.length === 1) {
      const nilLocation = newElements[0].location;
      return new Atomic.Pair(
        location,
        newElements[0],
        new Atomic.Nil(nilLocation),
      );
    }

    newElements.reverse();
    const lastLocation = newElements[0].location;
    let newPair = new Atomic.Nil(lastLocation);

    for (let i = 0; i < newElements.length - 1; i++) {
      const element = newElements[i];
      const eleLocation = element.location;
      newPair = new Atomic.Pair(eleLocation, element, newPair);
    }

    return newPair;
  }

  // Leave quotes alone.
  visitQuote(node: Extended.Quote): Extended.Quote {
    return node;
  }

  // Leave unquotes alone.
  visitUnquote(node: Extended.Unquote): Extended.Unquote {
    return node;
  }

  visitBegin(node: Extended.Begin): Atomic.Sequence {
    const location = node.location;
    const newExpressions = node.expressions.map((expression) =>
      expression.accept(this),
    );

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
