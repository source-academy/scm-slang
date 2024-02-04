/**
 * A visitor that handles quotation logic.
 * Quotes are a part of scheme syntax that allow for the creation of lists.
 */

// TODO: Wait, this is so dumb... I'm just going to use the parser to do this.
// TODO: Refactor the parser to handle this.

import { Expression, Atomic, Extended } from "../types/node-types";
import { Visitor } from "./visitor";

enum QuoteMode {
  Quote,
  Quasiquote,
  None,
}

export class Quoter implements Visitor {
  // Current mode of the quoter.
  private quoteMode: QuoteMode;

  private constructor() {
    this.quoteMode = QuoteMode.None;
  }

  // Factory method for creating a new Quoter instance.
  public static create(): Quoter {
    return new Quoter();
  }

  // Atomic AST
  visitSequence(node: Atomic.Sequence): Atomic.Sequence | Extended.List {
    switch (this.quoteMode) {
      case QuoteMode.None:
        return node;
      default:
        // If we are in a quote mode, we need to return a list.
        const location = node.location;
        // We need to map over the expressions and quote them.
        const newExpressions = node.expressions.map((expression) =>
          expression.accept(this),
        );
        return new Extended.List(location, newExpressions);
    }
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

  visitLambda(node: Atomic.Lambda): Atomic.Lambda | Extended.List {
    switch (this.quoteMode) {
      case QuoteMode.None:
        return node;
      default:
        // If we are in a quote mode, we need to return a list.
        const location = node.location;
        const params = node.params;
        const newBody = node.body.accept(this);
        return new Extended.List(location, [
          new Atomic.Symbol(location, "lambda"),
          new Extended.List(location, params),
          newBody,
        ]);
    }
  }

  visitIdentifier(node: Atomic.Identifier): Atomic.Symbol | Atomic.Identifier {
    switch (this.quoteMode) {
      case QuoteMode.None:
        return node;
      default:
        // If we are in a quote mode, we need to return a symbol.
        return new Atomic.Symbol(node.location, node.name);
    }
  }

  visitDefinition(node: Atomic.Definition): Atomic.Definition | Extended.List {
    switch (this.quoteMode) {
      case QuoteMode.None:
        return node;
      default:
        // If we are in a quote mode, we need to return a list.
        const location = node.location;
        const name = node.name;
        const newValue = node.value.accept(this);
        return new Extended.List(location, [
          new Atomic.Symbol(location, "define"),
          name,
          newValue,
        ]);
    }
  }

  visitApplication(
    node: Atomic.Application,
  ): Atomic.Application | Extended.List {
    switch (this.quoteMode) {
      case QuoteMode.None:
        return node;
      default:
        // If we are in a quote mode, we need to return a list.
        const location = node.location;
        const newOperator = node.operator.accept(this);
        const newOperands = node.operands.map((operand) =>
          operand.accept(this),
        );
        return new Extended.List(location, [newOperator, ...newOperands]);
    }
  }

  visitConditional(
    node: Atomic.Conditional,
  ): Atomic.Conditional | Extended.List {
    switch (this.quoteMode) {
      case QuoteMode.None:
        return node;
      default:
        // If we are in a quote mode, we need to return a list.
        const location = node.location;
        const newTest = node.test.accept(this);
        const newConsequent = node.consequent.accept(this);
        const newAlternate = node.alternate.accept(this);
        return new Extended.List(location, [
          new Atomic.Symbol(location, "if"),
          newTest,
          newConsequent,
          newAlternate,
        ]);
    }
  }

  visitPair(node: Atomic.Pair): Atomic.Pair {
    switch (this.quoteMode) {
      case QuoteMode.None:
        return node;
      default:
        // If we are in a quote mode, we need to quote everything in the pair.
        const location = node.location;
        const newCar = node.car.accept(this);
        const newCdr = node.cdr.accept(this);
        return new Atomic.Pair(location, newCar, newCdr);
    }
  }

  visitNil(node: Atomic.Nil): Atomic.Nil {
    return node;
  }

  visitSymbol(node: Atomic.Symbol): Atomic.Symbol {
    return node;
  }

  visitReassignment(
    node: Atomic.Reassignment,
  ): Atomic.Reassignment | Extended.List {
    switch (this.quoteMode) {
      case QuoteMode.None:
        return node;
      default:
        // If we are in a quote mode, we need to return a list.
        const location = node.location;
        const name = node.name;
        const newValue = node.value.accept(this);
        return new Extended.List(location, [
          new Atomic.Symbol(location, "set!"),
          name,
          newValue,
        ]);
    }
  }

  visitImport(node: Atomic.Import): Atomic.Import | Extended.List {
    switch (this.quoteMode) {
      case QuoteMode.None:
        return node;
      default:
        // If we are in a quote mode, we need to return a list.
        const location = node.location;
        const newSource = node.source;
        const newIdentifiers: Expression[] = node.identifiers.map(
          (identifier) => identifier.accept(this),
        );
        const newLocation =
          newIdentifiers.length > 0
            ? newIdentifiers[0].location.merge(newIdentifiers[-1].location)
            : newSource.location;

        const identifierList = new Extended.List(newLocation, newIdentifiers);

        return new Extended.List(location, [
          new Atomic.Symbol(location, "import"),
          newSource,
          identifierList,
        ]);
    }
  }

  visitExport(node: Atomic.Export): Atomic.Export | Extended.List {
    switch (this.quoteMode) {
      case QuoteMode.None:
        return node;
      default:
        // If we are in a quote mode, we need to return a list.
        const location = node.location;
        const newDefinition = node.definition.accept(this);
        return new Extended.List(location, [
          new Atomic.Symbol(location, "export"),
          newDefinition,
        ]);
    }
  }

  // Extended AST
  visitFunctionDefinition(
    node: Extended.FunctionDefinition,
  ): Extended.FunctionDefinition | Extended.List {
    switch (this.quoteMode) {
      case QuoteMode.None:
        return node;
      default:
        // If we are in a quote mode, we need to return a list.
        const location = node.location;
        const name = node.name.accept(this);
        const params = node.params.map((param) => param.accept(this));
        const newBody = node.body.accept(this);

        // Paramslist contains name and params
        params.unshift(name);
        const paramsLocation =
          params.length > 0
            ? params[0].location.merge(params[-1].location)
            : name.location;
        const paramsList = new Extended.List(paramsLocation, params);

        return new Extended.List(location, [
          new Atomic.Symbol(location, "define"),
          paramsList,
          newBody,
        ]);
    }
  }

  visitLet(node: Extended.Let): Extended.Let | Extended.List {
    switch (this.quoteMode) {
      case QuoteMode.None:
        return node;
      default:
        // If we are in a quote mode, we need to return a list.
        const location = node.location;
        const newBody = node.body.accept(this);

        const definitions: Extended.List[] = [];
        // Identifiers and values should be spliced together
        for (let i = 0; i < node.identifiers.length; i++) {
          const identifier = node.identifiers[i];
          const value = node.values[i];
          const newIdentifier = identifier.accept(this);
          const newValue = value.accept(this);

          // Create a new list of the identifier and value
          const newPair = new Extended.List(
            newIdentifier.location.merge(newValue.location),
            [newIdentifier, newValue],
          );

          definitions.push(newPair);
        }

        const definitionsLocation =
          definitions.length > 0
            ? definitions[0].location.merge(definitions[-1].location)
            : location;
        const definitionsList = new Extended.List(
          definitionsLocation,
          definitions,
        );

        return new Extended.List(location, [
          new Atomic.Symbol(location, "let"),
          definitionsList,
          newBody,
        ]);
    }
  }

  visitCond(node: Extended.Cond): Extended.Cond | Extended.List {
    switch (this.quoteMode) {
      case QuoteMode.None:
        return node;
      default:
        // If we are in a quote mode, we need to return a list.
        const location = node.location;

        // Splice the predicates and consequents together
        const clauses: Extended.List[] = [];
        for (let i = 0; i < node.predicates.length; i++) {
          const predicate = node.predicates[i];
          const consequent = node.consequents[i];
          const newPredicate = predicate.accept(this);
          const newConsequent = consequent.accept(this);

          // Create a new list of the predicate and consequent
          const newPair = new Extended.List(
            newPredicate.location.merge(newConsequent.location),
            [newPredicate, newConsequent],
          );

          clauses.push(newPair);
        }

        // Check if there is an else clause
        if (node.catchall) {
          const elseClause = node.catchall.accept(this);
          const elsePair = new Extended.List(elseClause.location, [
            new Atomic.Symbol(elseClause.location, "else"),
            elseClause,
          ]);
          clauses.push(elsePair);
        }

        return new Extended.List(location, [
          new Atomic.Symbol(location, "cond"),
          ...clauses,
        ]);
    }
  }

  visitList(node: Extended.List): Extended.List {
    switch (this.quoteMode) {
      case QuoteMode.None:
        return node;
      default:
        // If we are in a quote mode, we need to quote everything in the list.
        const location = node.location;
        const newExpressions = node.elements.map((expression) =>
          expression.accept(this),
        );
        return new Extended.List(location, newExpressions);
    }
  }

  visitQuote(node: Extended.Quote): Expression {
    switch (this.quoteMode) {
      case QuoteMode.None:
        // If we are not in a quote mode, we need to return the quoted expression.
        this.quoteMode = node.quasi ? QuoteMode.Quasiquote : QuoteMode.Quote;
        const quoted = node.expression.accept(this);
        this.quoteMode = QuoteMode.None;
        return quoted;
      default:
        // If we are in a quote mode, we need to return a list.
        const location = node.location;
        const newExpression = node.expression.accept(this);
        return new Extended.List(location, [
          new Atomic.Symbol(location, "quote"),
          newExpression,
        ]);
    }
  }

  visitUnquote(node: Extended.Unquote): Expression {
    switch (this.quoteMode) {
      case QuoteMode.Quasiquote:
        // If we are in a quasiquote mode, we need to return the unquoted expression.
        this.quoteMode = QuoteMode.None;
        const unquoted = node.expression.accept(this);
        this.quoteMode = QuoteMode.Quasiquote;
        return unquoted;
      case QuoteMode.Quote:
        // If we are in a quote mode, quote as usual. Return a list.
        const quoted = node.expression.accept(this);
        return new Extended.List(node.location, [
          new Atomic.Symbol(node.location, "quote"),
          quoted,
        ]);
      default:
        // This is an error. Unquote should only be used within a quote or quasiquote.
        throw new Error(
          "Unquote can only be used within a quote or quasiquote.",
        );
    }
  }

  visitBegin(node: Extended.Begin): Extended.Begin | Extended.List {
    switch (this.quoteMode) {
      case QuoteMode.None:
        return node;
      default:
        // If we are in a quote mode, we need to return a list.
        const location = node.location;
        const newExpressions = node.expressions.map((expression) =>
          expression.accept(this),
        );

        return new Extended.List(location, [
          new Atomic.Symbol(location, "begin"),
          ...newExpressions,
        ]);
    }
  }

  visitDelay(node: Extended.Delay): Extended.Delay | Extended.List {
    switch (this.quoteMode) {
      case QuoteMode.None:
        return node;
      default:
        // If we are in a quote mode, we need to return a list.
        const location = node.location;
        const newExpression = node.expression.accept(this);
        return new Extended.List(location, [
          new Atomic.Symbol(location, "delay"),
          newExpression,
        ]);
    }
  }

  visitForce(node: Extended.Force): Extended.Force | Extended.List {
    switch (this.quoteMode) {
      case QuoteMode.None:
        return node;
      default:
        // If we are in a quote mode, we need to return a list.
        const location = node.location;
        const newExpression = node.expression.accept(this);
        return new Extended.List(location, [
          new Atomic.Symbol(location, "force"),
          newExpression,
        ]);
    }
  }
}
