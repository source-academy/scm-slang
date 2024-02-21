/**
 * Node types of the abstract syntax tree of the Scheme Language.
 * We aim to be as simple as possible, and only represent the bare minimum
 * of Scheme syntax.
 *
 * Syntatic sugar such as "cond" or "let" will be left in another file,
 * and will be translated into the bare minimum of Scheme syntax, for now
 * with a transformer visitor, and perhaps later with a macro system.
 */

import { Visitor } from "../visitors/visitor";
import { Location } from "./location";

/**
 * A basic node that represents a Scheme expression.
 */
export interface Expression {
  location: Location;
  accept(visitor: Visitor): any;
}

/**
 * The namespace for all the atomic node types.
 */
export namespace Atomic {
  // Scheme chapter 1

  /**
   * A node that represents a sequence of expressions.
   * Also introduces a new scope.
   * The last expression is the return value of the sequence.
   */
  export class Sequence implements Expression {
    location: Location;
    expressions: Expression[];
    constructor(location: Location, expressions: Expression[]) {
      this.location = location;
      this.expressions = expressions;
    }
    accept(visitor: Visitor): any {
      return visitor.visitSequence(this);
    }
  }

  /**
   * A node that represents a Scheme literal.
   */
  export interface Literal extends Expression {
    value: any;
  }

  /**
   * A node that represents a Scheme number.
   * TODO: Support the Scheme number tower.
   */
  export class NumericLiteral implements Literal {
    location: Location;
    value: number;
    constructor(location: Location, value: number) {
      this.location = location;
      this.value = value;
    }
    accept(visitor: Visitor): any {
      return visitor.visitNumericLiteral(this);
    }
  }

  /**
   * A node that represents a Scheme boolean.
   */
  export class BooleanLiteral implements Literal {
    location: Location;
    value: boolean;
    constructor(location: Location, value: boolean) {
      this.location = location;
      this.value = value;
    }
    accept(visitor: Visitor): any {
      return visitor.visitBooleanLiteral(this);
    }
  }

  /**
   * A node that represents a Scheme string.
   */
  export class StringLiteral implements Literal {
    location: Location;
    value: string;
    constructor(location: Location, value: string) {
      this.location = location;
      this.value = value;
    }
    accept(visitor: Visitor): any {
      return visitor.visitStringLiteral(this);
    }
  }

  /**
   * A node representing a Scheme lambda expression.
   * TODO: Support rest arguments.
   */
  export class Lambda implements Expression {
    location: Location;
    params: Identifier[];
    rest?: Identifier;
    body: Expression;
    constructor(
      location: Location,
      body: Expression,
      params: Identifier[],
      rest: Identifier | undefined = undefined,
    ) {
      this.location = location;
      this.params = params;
      this.rest = rest;
      this.body = body;
    }
    accept(visitor: Visitor): any {
      return visitor.visitLambda(this);
    }
  }

  /**
   * A node representing a Scheme identifier.
   */
  export class Identifier implements Expression {
    location: Location;
    name: string;
    constructor(location: Location, name: string) {
      this.location = location;
      this.name = name;
    }
    accept(visitor: Visitor): any {
      return visitor.visitIdentifier(this);
    }
  }

  /**
   * A node representing a Scheme variable definition.
   * Returns nil.
   */
  export class Definition implements Expression {
    location: Location;
    name: Identifier;
    value: Expression;
    constructor(location: Location, name: Identifier, value: Expression) {
      this.location = location;
      this.name = name;
      this.value = value;
    }
    accept(visitor: Visitor): any {
      return visitor.visitDefinition(this);
    }
  }

  /**
   * A node representing a Scheme function application.
   */
  export class Application implements Expression {
    location: Location;
    operator: Expression;
    operands: Expression[];
    constructor(
      location: Location,
      operator: Expression,
      operands: Expression[],
    ) {
      this.location = location;
      this.operator = operator;
      this.operands = operands;
    }
    accept(visitor: Visitor): any {
      return visitor.visitApplication(this);
    }
  }

  /**
   * A node representing a Scheme conditional expression.
   */
  export class Conditional implements Expression {
    location: Location;
    test: Expression;
    consequent: Expression;
    alternate: Expression;
    constructor(
      location: Location,
      test: Expression,
      consequent: Expression,
      alternate: Expression,
    ) {
      this.location = location;
      this.test = test;
      this.consequent = consequent;
      this.alternate = alternate;
    }
    accept(visitor: Visitor): any {
      return visitor.visitConditional(this);
    }
  }

  // Scheme chapter 2

  /**
   * A node representing a Scheme pair.
   */
  export class Pair implements Expression {
    location: Location;
    car: Expression;
    cdr: Expression;
    constructor(location: Location, car: Expression, cdr: Expression) {
      this.location = location;
      this.car = car;
      this.cdr = cdr;
    }
    accept(visitor: Visitor): any {
      return visitor.visitPair(this);
    }
  }

  /**
   * A node representing nil, an empty scheme list.
   */
  export class Nil implements Expression {
    location: Location;
    constructor(location: Location) {
      this.location = location;
    }
    accept(visitor: Visitor): any {
      return visitor.visitNil(this);
    }
  }

  /**
   * A node representing a Scheme symbol.
   */
  export class Symbol implements Literal {
    location: Location;
    value: string;
    constructor(location: Location, value: string) {
      this.location = location;
      this.value = value;
    }
    accept(visitor: Visitor): any {
      return visitor.visitSymbol(this);
    }
  }

  /**
   * A node representing a Scheme marker for unquote_splicing.
   * This will be evaluated at runtime.
   */
  export class SpliceMarker implements Expression {
    location: Location;
    value: Expression;
    constructor(location: Location, value: Expression) {
      this.location = location;
      this.value = value;
    }
    accept(visitor: Visitor): any {
      return visitor.visitSpliceMarker(this);
    }
  }

  // Scheme chapter 3

  /**
   * A node representing a Scheme variable reassignment.
   * Only supposed to be used on a variable that has been defined.
   * Returns nil.
   */
  export class Reassignment implements Expression {
    location: Location;
    name: Identifier;
    value: Expression;
    constructor(location: Location, name: Identifier, value: Expression) {
      this.location = location;
      this.name = name;
      this.value = value;
    }
    accept(visitor: Visitor): any {
      return visitor.visitReassignment(this);
    }
  }

  // scm-slang specific

  /**
   * A node representing an import statement.
   * syntax: (import <source> ( <identifier>* ))
   * Returns nil.
   */
  export class Import implements Expression {
    location: Location;
    source: StringLiteral;
    identifiers: Identifier[];
    constructor(
      location: Location,
      source: StringLiteral,
      identifiers: Identifier[],
    ) {
      this.location = location;
      this.source = source;
      this.identifiers = identifiers;
    }
    accept(visitor: Visitor): any {
      return visitor.visitImport(this);
    }
  }

  /**
   * A node representing an export statement.
   * syntax: (export ( <definition> ))
   * Returns nil.
   */
  export class Export implements Expression {
    location: Location;
    definition: Definition;
    constructor(location: Location, definition: Definition) {
      this.location = location;
      this.definition = definition;
    }
    accept(visitor: Visitor): any {
      return visitor.visitExport(this);
    }
  }

  /**
   * A node representing a Scheme Vector.
   */
  export class Vector implements Expression {
    location: Location;
    elements: Expression[];
    constructor(location: Location, elements: Expression[]) {
      this.location = location;
      this.elements = elements;
    }
    accept(visitor: Visitor): any {
      return visitor.visitVector(this);
    }
  }
}

/**
 * The namespace for all the syntactic sugar node types.
 * Will be transformed into the bare minimum of Scheme syntax.
 * Eventually, we won't need this namespace, as all the syntactic sugar
 * will be converted by a macro system.
 */
export namespace Extended {
  // Scheme chapter 1

  /**
   * A node representing a function definition.
   */
  export class FunctionDefinition implements Expression {
    location: Location;
    name: Atomic.Identifier;
    params: Atomic.Identifier[];
    rest?: Atomic.Identifier;
    body: Expression;
    constructor(
      location: Location,
      name: Atomic.Identifier,
      body: Expression,
      params: Atomic.Identifier[],
      rest: Atomic.Identifier | undefined = undefined,
    ) {
      this.location = location;
      this.name = name;

      this.body = body;
      this.params = params;
      this.rest = rest;
    }
    accept(visitor: Visitor): any {
      return visitor.visitFunctionDefinition(this);
    }
  }

  /**
   * A node representing a Scheme let expression.
   */
  export class Let implements Expression {
    location: Location;
    identifiers: Atomic.Identifier[];
    values: Expression[];
    body: Expression;
    constructor(
      location: Location,
      identifiers: Atomic.Identifier[],
      values: Expression[],
      body: Expression,
    ) {
      this.location = location;
      this.identifiers = identifiers;
      this.values = values;
      this.body = body;
    }
    accept(visitor: Visitor): any {
      return visitor.visitLet(this);
    }
  }

  /**
   * A node representing a Scheme cond expression.
   * MAY return nil.
   */
  export class Cond implements Expression {
    location: Location;
    predicates: Expression[];
    consequents: Expression[];
    catchall: Expression | undefined;
    constructor(
      location: Location,
      predicates: Expression[],
      consequents: Expression[],
      catchall?: Expression,
    ) {
      this.location = location;
      this.predicates = predicates;
      this.consequents = consequents;
      this.catchall = catchall;
    }
    accept(visitor: Visitor): any {
      return visitor.visitCond(this);
    }
  }

  // Scheme chapter 2

  /**
   * A node representing a Scheme list or dotted list.
   */
  export class List implements Expression {
    location: Location;
    elements: Expression[];
    terminator: Expression | undefined;
    constructor(
      location: Location,
      elements: Expression[],
      terminator: Expression | undefined = undefined,
    ) {
      this.location = location;
      this.elements = elements;
      this.terminator = terminator;
    }
    accept(visitor: Visitor): any {
      return visitor.visitList(this);
    }
  }

  // Scheme chapter 3

  /**
   * A node representing a Scheme begin expression.
   * Returns the last expression.
   * syntax: (begin <expression>*)
   */
  export class Begin implements Expression {
    location: Location;
    expressions: Expression[];
    constructor(location: Location, expressions: Expression[]) {
      this.location = location;
      this.expressions = expressions;
    }
    accept(visitor: Visitor): any {
      return visitor.visitBegin(this);
    }
  }

  /**
   * A node representing a Scheme delay expression.
   * Returns a promise.
   * syntax: (delay <expression>)
   */
  export class Delay implements Expression {
    location: Location;
    expression: Expression;
    constructor(location: Location, expression: Expression) {
      this.location = location;
      this.expression = expression;
    }
    accept(visitor: Visitor): any {
      return visitor.visitDelay(this);
    }
  }

  /**
   * A node representing a Scheme force expression.
   * Returns the value of the promise.
   * syntax: (force <expression>)
   */
  export class Force implements Expression {
    location: Location;
    expression: Delay;
    constructor(location: Location, expression: Delay) {
      this.location = location;
      this.expression = expression;
    }
    accept(visitor: Visitor): any {
      return visitor.visitForce(this);
    }
  }
}
