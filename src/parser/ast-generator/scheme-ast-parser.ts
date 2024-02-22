import { Token } from "../types/token";
import { TokenType } from "../types/token-type";
import { Location, Position } from "../types/location";
import { Atomic, Expression, Extended } from "../types/scheme-node-types";
import * as ParserError from "../parser-error";
import { Group } from "./token-grouping";

/**
 * An enum representing the current quoting mode of the parser
 */
enum QuoteMode {
  NONE,
  QUOTE,
  QUASIQUOTE,
}

export class SchemeParser {
  private readonly source: string;
  private readonly tokens: Token[];
  private readonly chapter: number;
  private current: number = 0;
  private quoteMode: QuoteMode = QuoteMode.NONE;

  constructor(source: string, tokens: Token[], chapter: number = Infinity) {
    this.source = source;
    this.tokens = tokens;
    this.chapter = chapter;
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.current >= this.tokens.length;
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  private validateChapter(c: Token, chapter: number): void {
    if (this.chapter < chapter) {
      throw new ParserError.DisallowedTokenError(
        this.source,
        c.pos,
        c,
        this.chapter,
      );
    }
  }

  /**
   * Returns the location of a token.
   * @param token A token.
   * @returns The location of the token.
   */
  private toLocation(token: Token): Location {
    return new Location(token.pos, token.endPos);
  }

  /**
   * Helper function used to destructure a list into its elements and terminator.
   * An optional verifier is used if there are restrictions on the elements of the list.
   */
  private destructureList(
    list: (Group | Token)[],
    verifier = (x) => {},
  ): [Expression[], Expression | undefined] {
    // check if the list is an empty list
    if (list.length === 0) {
      return [[], undefined];
    }

    // check if the list is a list of length 1
    if (list.length === 1) {
      verifier(list[0]);
      return [[this.parseExpression(list[0])], undefined];
    }

    // we now know that the list is at least of length 2

    // check for a dotted list
    // it is if the second last element is a dot
    const potentialDot = list.at(-2);

    if (potentialDot instanceof Token && potentialDot.type === TokenType.DOT) {
      const cdrElement = list.at(-1)!;
      const listElements = list.slice(0, -2);
      verifier(cdrElement);
      listElements.forEach(verifier);
      return [
        listElements.map(this.parseExpression),
        this.parseExpression(cdrElement),
      ];
    }

    // we now know that it is a proper list
    const listElements = list;
    listElements.forEach(verifier);
    return [listElements.map(this.parseExpression), undefined];
  }

  /**
   * Returns a group of associated tokens.
   * Tokens are grouped by level of parentheses.
   *
   * @param openparen The type of opening parenthesis.
   * @returns A group of tokens or groups of tokens.
   */
  private grouping(openparen?: Token): Group {
    const elements: (Token | Group)[] = [];
    let inList = false;
    if (openparen) {
      inList = true;
      elements.push(openparen);
    }
    do {
      let c = this.advance();
      switch (c.type) {
        case TokenType.LEFT_PAREN:
        case TokenType.LEFT_BRACKET:
          const innerGroup = this.grouping(c);
          elements.push(innerGroup);
          break;
        case TokenType.RIGHT_PAREN:
        case TokenType.RIGHT_BRACKET:
          if (!inList) {
            throw new ParserError.UnexpectedTokenError(this.source, c.pos, c);
          }
          // add the parenthesis to the current group
          elements.push(c);
          inList = false;
          break;
        case TokenType.APOSTROPHE: // Quoting syntax (short form)
        case TokenType.BACKTICK:
        case TokenType.HASH_VECTOR:
        case TokenType.COMMA:
        case TokenType.COMMA_AT:
          // these cases modify only the next element
          // so we group up the next element and use this
          // token on it
          const nextGrouping = this.grouping();
          elements.push(this.affect(c, nextGrouping));
          break;
        case TokenType.QUOTE: // Quoting syntax
        case TokenType.QUASIQUOTE:
        case TokenType.UNQUOTE:
        case TokenType.UNQUOTE_SPLICING:
        case TokenType.IDENTIFIER: // Atomics
        case TokenType.NUMBER:
        case TokenType.BOOLEAN:
        case TokenType.STRING:
        case TokenType.DOT:
          elements.push(c);
          break;
        case TokenType.HASH_SEMICOLON:
          // a datum comment
          // ignore the next grouping
          const _ignoredGrouping = this.grouping();
          break;
        case TokenType.EOF:
          // We should be unable to reach this point at top level as parse()
          // should prevent the grouping of the singular EOF token.
          // However, with any element that ranges beyond the end of the
          // file without its corresponding delemiter, we can reach this point.
          throw new ParserError.UnexpectedEOFError(this.source, c.pos);
        default:
          throw new ParserError.UnexpectedTokenError(this.source, c.pos, c);
      }
    } while (inList);
    return Group.build(elements);
  }

  /**
   * Groups an affector token with its target.
   */
  private affect(affector: Token, target: Token | Group): Group {
    return Group.build([affector, target]);
  }

  /**
   * Parse an expression.
   * @param expr A token or a group of tokens.
   * @returns
   */
  private parseExpression(expr: Token | Group): Expression {
    // Discern the type of expression
    if (expr instanceof Token) {
      return this.parseToken(expr);
    }

    // We now know it is a group

    // Due to group invariants we can determine if it represents a
    // single token instead
    if (expr.isSingleIdentifier()) {
      return this.parseToken(expr.unwrap()[0] as Token);
    }

    return this.parseGroup(expr);
  }

  private parseToken(token: Token): Expression {
    switch (token.type) {
      case TokenType.IDENTIFIER:
        return this.quoteMode === QuoteMode.NONE
          ? new Atomic.Identifier(this.toLocation(token), token.lexeme)
          : new Atomic.Symbol(this.toLocation(token), token.lexeme);
      // all of these are self evaluating, and so can be left alone regardless of quote mode
      case TokenType.NUMBER:
        return new Atomic.NumericLiteral(
          this.toLocation(token),
          token.literal as number,
        );
      case TokenType.BOOLEAN:
        return new Atomic.BooleanLiteral(
          this.toLocation(token),
          token.literal as boolean,
        );
      case TokenType.STRING:
        return new Atomic.StringLiteral(
          this.toLocation(token),
          token.literal as string,
        );
      default:
        // if in a quoting context, any keyword is instead treated as a symbol
        if (this.quoteMode !== QuoteMode.NONE) {
          return new Atomic.Symbol(this.toLocation(token), token.lexeme);
        }
        throw new ParserError.UnexpectedTokenError(
          this.source,
          token.pos,
          token,
        );
    }
  }

  private parseGroup(group: Group): Expression {
    // No need to check if group represents a single token as well
    if (!group.isParenthesized()) {
      // The only case left is the unparenthesized case
      // of a single affector token and a target group
      // Form: <affector token> <group>
      return this.parseAffectorGroup(group);
    }
    // Now we have fallen through to the generic group
    // case - a parenthesized group of tokens.
    switch (this.quoteMode) {
      case QuoteMode.NONE:
        return this.parseNormalGroup(group);
      case QuoteMode.QUOTE:
      case QuoteMode.QUASIQUOTE:
        return this.parseQuotedGroup(group);
    }
  }

  /**
   * Parse a group of tokens affected by an affector.
   * Important case as affector changes quotation mode.
   *
   * @param group A group of tokens, verified to be an affector and a target.
   * @returns An expression.
   */
  parseAffectorGroup(group: Group): Expression {
    const [affector, target] = group.unwrap();
    // Safe to cast affector due to group invariants
    switch ((<Token>affector).type) {
      case TokenType.APOSTROPHE:
      case TokenType.QUOTE:
        if (this.quoteMode !== QuoteMode.NONE) {
          const innerGroup = this.parseExpression(target);
          const newSymbol = new Atomic.Symbol(
            this.toLocation(<Token>affector),
            "quote",
          );

          const newLocation = newSymbol.location.merge(innerGroup.location);
          // wrap the entire expression in a list
          return new Extended.List(newLocation, [newSymbol, innerGroup]);
        }
        this.quoteMode = QuoteMode.QUOTE;
        const quotedExpression = this.parseExpression(target);
        this.quoteMode = QuoteMode.NONE;
        return quotedExpression;
      case TokenType.BACKTICK:
      case TokenType.QUASIQUOTE:
        if (this.quoteMode !== QuoteMode.NONE) {
          const innerGroup = this.parseExpression(target);
          const newSymbol = new Atomic.Symbol(
            this.toLocation(<Token>affector),
            "quasiquote",
          );

          const newLocation = newSymbol.location.merge(innerGroup.location);
          // wrap the entire expression in a list
          return new Extended.List(newLocation, [newSymbol, innerGroup]);
        }
        this.quoteMode = QuoteMode.QUASIQUOTE;
        const quasiquotedExpression = this.parseExpression(target);
        this.quoteMode = QuoteMode.NONE;
        return quasiquotedExpression;
      case TokenType.COMMA:
      case TokenType.UNQUOTE:
        let currentQuoteMode = this.quoteMode;
        if (currentQuoteMode === QuoteMode.NONE) {
          throw new ParserError.UnsupportedTokenError(
            this.source,
            (<Token>affector).pos,
            <Token>affector,
          );
        }
        if (currentQuoteMode === QuoteMode.QUOTE) {
          const innerGroup = this.parseExpression(target);
          const newSymbol = new Atomic.Symbol(
            this.toLocation(<Token>affector),
            "unquote",
          );

          const newLocation = newSymbol.location.merge(innerGroup.location);
          // wrap the entire expression in a list
          return new Extended.List(newLocation, [newSymbol, innerGroup]);
        }
        this.quoteMode = QuoteMode.NONE;
        const unquotedExpression = this.parseExpression(target);
        this.quoteMode = currentQuoteMode;
        return unquotedExpression;
      case TokenType.COMMA_AT:
      case TokenType.UNQUOTE_SPLICING:
        currentQuoteMode = this.quoteMode;
        if (currentQuoteMode === QuoteMode.NONE) {
          throw new ParserError.UnsupportedTokenError(
            this.source,
            (<Token>affector).pos,
            <Token>affector,
          );
        }
        if (currentQuoteMode === QuoteMode.QUOTE) {
          const innerGroup = this.parseExpression(target);
          const newSymbol = new Atomic.Symbol(
            this.toLocation(<Token>affector),
            "unquote-splicing",
          );

          const newLocation = newSymbol.location.merge(innerGroup.location);
          // wrap the entire expression in a list
          return new Extended.List(newLocation, [newSymbol, innerGroup]);
        }
        this.quoteMode = QuoteMode.NONE;
        const unquoteSplicedExpression = this.parseExpression(target);
        this.quoteMode = currentQuoteMode;
        const newLocation = this.toLocation(<Token>affector).merge(
          unquoteSplicedExpression.location,
        );
        return new Atomic.SpliceMarker(newLocation, unquoteSplicedExpression);
      case TokenType.HASH_VECTOR:
      case TokenType.VECTOR:
        return this.parseVector(group);
      default:
        throw new ParserError.UnexpectedTokenError(
          this.source,
          (<Token>affector).pos,
          <Token>affector,
        );
    }
  }

  private parseNormalGroup(group: Group): Expression {
    // it is an error if the group is empty in a normal context
    if (group.length() === 0) {
      throw new Error("unexpected syntax in form ()");
    }

    // get the first element
    const firstElement = group.unwrap()[0];

    // If the first element is a token, it may be a keyword or a procedure call
    if (firstElement instanceof Token) {
      switch (firstElement.type) {
        // Scheme chapter 1
        case TokenType.LAMBDA:
          this.validateChapter(firstElement, 1);
          return this.parseLambda(group);
        case TokenType.DEFINE:
          this.validateChapter(firstElement, 1);
          return this.parseDefinition(group);
        case TokenType.IF:
          this.validateChapter(firstElement, 1);
          return this.parseConditional(group);
        case TokenType.LET:
          this.validateChapter(firstElement, 1);
          return this.parseLet(group);
        case TokenType.COND:
          this.validateChapter(firstElement, 1);
          return this.parseExtendedCond(group);

        // Scheme chapter 2
        case TokenType.QUOTE:
        case TokenType.APOSTROPHE:
        case TokenType.QUASIQUOTE:
        case TokenType.BACKTICK:
        case TokenType.UNQUOTE:
        case TokenType.COMMA:
        case TokenType.UNQUOTE_SPLICING:
        case TokenType.COMMA_AT:
          this.validateChapter(firstElement, 2);
          // we can reuse the affector group method to control the quote mode
          return this.parseAffectorGroup(group);

        // Scheme chapter 3
        case TokenType.BEGIN:
          this.validateChapter(firstElement, 3);
          return this.parseBegin(group);
        case TokenType.DELAY:
          this.validateChapter(firstElement, 3);
          return this.parseDelay(group);
        case TokenType.SET:
          this.validateChapter(firstElement, 3);
          return this.parseSet(group);

        // Scm-slang misc
        case TokenType.IMPORT:
          this.validateChapter(firstElement, 1);
          return this.parseImport(group);
        case TokenType.EXPORT:
          this.validateChapter(firstElement, 1);
          return this.parseExport(group);
        case TokenType.VECTOR:
          this.validateChapter(firstElement, 1);
          // same as above, this is an affector group
          return this.parseAffectorGroup(group);

        default:
          // It's a procedure call
          return this.parseApplication(group);
      }
    }
    // Form: (<group> <expr>*)
    // It's a procedure call
    return this.parseApplication(group);
  }

  /**
   * We are parsing a list/dotted list.
   */
  private parseQuotedGroup(group: Group): Expression {
    // check if the group is an empty list
    if (group.length() === 0) {
      return new Atomic.Nil(group.location);
    }

    // check if the group is a list of length 1
    if (group.length() === 1) {
      const elem = [this.parseExpression(group.unwrap()[0])];
      return new Extended.List(group.location, elem);
    }

    // we now know that the group is at least of length 2

    const groupElements = group.unwrap();

    const [listElements, cdrElement] = this.destructureList(groupElements);

    return new Extended.List(group.location, listElements, cdrElement);
  }

  // _____________________CHAPTER 1_____________________

  /**
   * Parse a lambda expression.
   * @param group
   * @returns
   */
  private parseLambda(group: Group): Atomic.Lambda {
    // Form: (lambda <formals> <body>)
    //     | (lambda <formals> <body> <body>*)
    // ensure that the group has at least 3 elements
    if (group.length() < 3) {
      throw new ParserError.UnexpectedTokenError(
        this.source,
        group.firstToken().pos,
        group.firstToken(),
      );
    }
    const elements = group.unwrap();
    const formals = elements[1];
    const body = elements.slice(2);

    // Formals should be a group of identifiers or a single identifier
    let convertedFormals: Atomic.Identifier[] = [];
    // if a rest element is detected,
    let convertedRest: Atomic.Identifier | undefined = undefined;
    if (formals instanceof Token) {
      if (formals.type !== TokenType.IDENTIFIER) {
        throw new ParserError.UnexpectedTokenError(
          this.source,
          formals.pos,
          formals,
        );
      }
      convertedRest = new Atomic.Identifier(
        this.toLocation(formals),
        formals.lexeme,
      );
    } else {
      // it is a group
      const formalsElements = formals.unwrap();
      [convertedFormals, convertedRest] = this.destructureList(
        formalsElements,
        // pass in a verifier that checks if the elements are identifiers
        (formal) => {
          if (!(formal instanceof Token)) {
            throw new ParserError.UnexpectedTokenError(
              this.source,
              formal.pos,
              formal,
            );
          }
          if (formal.type !== TokenType.IDENTIFIER) {
            throw new ParserError.UnexpectedTokenError(
              this.source,
              formal.pos,
              formal,
            );
          }
        },
      ) as [Atomic.Identifier[], Atomic.Identifier | undefined];
    }

    // Body is treated as a group of expressions
    const convertedBody = body.map(this.parseExpression);

    // assert that body is not empty
    if (convertedBody.length < 1) {
      throw new Error("body cannot be empty");
    }

    if (convertedBody.length === 1) {
      return new Atomic.Lambda(
        group.location,
        convertedBody[0],
        convertedFormals,
        convertedRest,
      );
    }

    const newLocation = convertedBody
      .at(0)!
      .location.merge(convertedBody.at(-1)!.location);
    const bodySequence = new Atomic.Sequence(newLocation, convertedBody);
    return new Atomic.Lambda(
      group.location,
      bodySequence,
      convertedFormals,
      convertedRest,
    );
  }

  /**
   * Parse a define expression.
   * @param group
   * @returns
   */
  private parseDefinition(
    group: Group,
  ): Atomic.Definition | Extended.FunctionDefinition {
    // Form: (define <identifier> <expr>)
    //     | (define (<identifier> <formals>) <body>)
    //     | (define (<identifier> <formals>) <body> <body>*)
    // ensure that the group has at least 3 elements
    if (group.length() < 3) {
      throw new ParserError.UnexpectedTokenError(
        this.source,
        group.firstToken().pos,
        group.firstToken(),
      );
    }
    const elements = group.unwrap();
    const identifier = elements[1];
    const expr = elements.slice(2);

    let convertedIdentifier: Atomic.Identifier;
    let convertedFormals: Atomic.Identifier[] = [];
    let convertedRest: Atomic.Identifier | undefined = undefined;
    let isFunctionDefinition = false;

    // Identifier may be a token or a group of identifiers
    if (!(identifier instanceof Token)) {
      // its a function definition
      isFunctionDefinition = true;
      const identifierElements = identifier.unwrap();
      const function_name = identifierElements[0];
      const formals = identifierElements.splice(1);

      // verify that the first element is an identifier
      if (!(function_name instanceof Token)) {
        throw new ParserError.UnexpectedTokenError(
          this.source,
          function_name.firstToken().pos,
          function_name.firstToken(),
        );
      }
      if (function_name.type !== TokenType.IDENTIFIER) {
        throw new ParserError.UnexpectedTokenError(
          this.source,
          function_name.pos,
          function_name,
        );
      }

      // convert the first element to an identifier
      convertedIdentifier = new Atomic.Identifier(
        this.toLocation(function_name),
        function_name.lexeme,
      );

      // Formals should be a group of identifiers
      [convertedFormals, convertedRest] = this.destructureList(
        formals,
        (formal) => {
          if (!(formal instanceof Token)) {
            throw new ParserError.UnexpectedTokenError(
              this.source,
              formal.pos,
              formal,
            );
          }
          if (formal.type !== TokenType.IDENTIFIER) {
            throw new ParserError.UnexpectedTokenError(
              this.source,
              formal.pos,
              formal,
            );
          }
        },
      ) as [Atomic.Identifier[], Atomic.Identifier | undefined];
    } else if (identifier.type !== TokenType.IDENTIFIER) {
      throw new ParserError.UnexpectedTokenError(
        this.source,
        identifier.pos,
        identifier,
      );
    } else {
      // its a normal definition
      convertedIdentifier = new Atomic.Identifier(
        this.toLocation(identifier),
        identifier.lexeme,
      );
      isFunctionDefinition = false;
    }

    // expr cannot be empty
    if (expr.length < 1) {
      throw new Error("expr cannot be empty");
    }

    if (isFunctionDefinition) {
      // Body is treated as a group of expressions
      const convertedBody = expr.map(this.parseExpression);

      if (convertedBody.length === 1) {
        return new Extended.FunctionDefinition(
          group.location,
          convertedIdentifier,
          convertedBody[0],
          convertedFormals,
          convertedRest,
        );
      }

      const newLocation = convertedBody
        .at(0)!
        .location.merge(convertedBody.at(-1)!.location);
      const bodySequence = new Atomic.Sequence(newLocation, convertedBody);

      return new Extended.FunctionDefinition(
        group.location,
        convertedIdentifier,
        bodySequence,
        convertedFormals,
        convertedRest,
      );
    }

    // its a normal definition

    // Expr is treated as a single expression
    const convertedExpr = this.parseExpression(expr[0]);

    return new Atomic.Definition(
      group.location,
      convertedIdentifier,
      convertedExpr,
    );
  }

  /**
   * Parse a conditional expression.
   * @param group
   * @returns
   */
  private parseConditional(group: Group): Atomic.Conditional {
    // Form: (if <expr> <expr> <expr>)
    //     | (if <expr> <expr>)

    // ensure that the group has 3 or 4 elements
    if (group.length() < 3 || group.length() > 4) {
      throw new ParserError.UnexpectedTokenError(
        this.source,
        group.firstToken().pos,
        group.firstToken(),
      );
    }
    const elements = group.unwrap();
    const test = elements[1];
    const consequent = elements[2];
    const alternate = group.length() > 3 ? elements[3] : undefined;

    // Test is treated as a single expression
    const convertedTest = this.parseExpression(test);

    // Consequent is treated as a single expression
    const convertedConsequent = this.parseExpression(consequent);

    // Alternate is treated as a single expression

    const convertedAlternate = alternate
      ? this.parseExpression(alternate)
      : new Atomic.Nil(group.location);

    return new Atomic.Conditional(
      group.location,
      convertedTest,
      convertedConsequent,
      convertedAlternate,
    );
  }

  /**
   * Parse an application expression.
   */
  private parseApplication(group: Group): Atomic.Application {
    // Form: (<expr> <expr>*)
    // ensure that the group has at least 1 element
    if (group.length() < 1) {
      throw new ParserError.UnexpectedTokenError(
        this.source,
        group.firstToken().pos,
        group.firstToken(),
      );
    }
    const elements = group.unwrap();
    const operator = elements[0];
    const operands = elements.splice(1);

    // Operator is treated as a single expression
    const convertedOperator = this.parseExpression(operator);

    // Operands are treated as a group of expressions
    const convertedOperands: Expression[] = [];
    for (const operand of operands) {
      convertedOperands.push(this.parseExpression(operand));
    }

    return new Atomic.Application(
      group.location,
      convertedOperator,
      convertedOperands,
    );
  }

  /**
   * Parse a let expression.
   * @param group
   * @returns
   */
  private parseLet(group: Group): Extended.Let {
    // Form: (let (<binding>*) <body>)
    // ensure that the group has at least 3 elements
    if (group.length() < 3) {
      throw new ParserError.UnexpectedTokenError(
        this.source,
        group.firstToken().pos,
        group.firstToken(),
      );
    }
    const elements = group.unwrap();
    const bindings = elements[1];
    const body = elements.slice(2);

    // Verify bindings is a group
    if (!(bindings instanceof Group)) {
      throw new ParserError.UnexpectedTokenError(
        this.source,
        bindings.pos,
        bindings,
      );
    }

    // Bindings are treated as a group of grouped identifiers and values
    const convertedIdentifiers: Atomic.Identifier[] = [];
    const convertedValues: Expression[] = [];

    const bindingElements = bindings.unwrap();
    for (const bindingElement of bindingElements) {
      // Verify bindingElement is a group of size 2
      if (!(bindingElement instanceof Group)) {
        throw new ParserError.UnexpectedTokenError(
          this.source,
          bindingElement.pos,
          bindingElement,
        );
      }
      if (bindingElement.length() !== 2) {
        throw new ParserError.UnexpectedTokenError(
          this.source,
          bindingElement.firstToken().pos,
          bindingElement.firstToken(),
        );
      }
      const identifier = bindingElement.first();
      const value = bindingElement.last();

      // Verify identifier is a token and an identifier
      if (!(identifier instanceof Token)) {
        throw new ParserError.UnexpectedTokenError(
          this.source,
          identifier.firstToken().pos,
          identifier.firstToken(),
        );
      }
      if (identifier.type !== TokenType.IDENTIFIER) {
        throw new ParserError.UnexpectedTokenError(
          this.source,
          identifier.pos,
          identifier,
        );
      }
      convertedIdentifiers.push(
        new Atomic.Identifier(this.toLocation(identifier), identifier.lexeme),
      );
      convertedValues.push(this.parseExpression(value));
    }

    // Body is treated as a group of expressions
    const convertedBody = body.map(this.parseExpression);

    // assert that body is not empty
    if (convertedBody.length < 1) {
      throw new Error("let body cannot be empty");
    }

    if (convertedBody.length === 1) {
      return new Extended.Let(
        group.location,
        convertedIdentifiers,
        convertedValues,
        convertedBody[0],
      );
    }

    const newLocation = convertedBody
      .at(0)!
      .location.merge(convertedBody.at(-1)!.location);
    const bodySequence = new Atomic.Sequence(newLocation, convertedBody);

    return new Extended.Let(
      group.location,
      convertedIdentifiers,
      convertedValues,
      bodySequence,
    );
  }

  /**
   * Parse an extended cond expression.
   * @param group
   * @returns
   */
  private parseExtendedCond(group: Group): Extended.Cond {
    // Form: (cond (<expr> <sequence>)*)
    //     | (cond (<expr> <sequence>)* (else <sequence>*))
    // ensure that the group has at least 2 elements
    if (group.length() < 2) {
      throw new ParserError.UnexpectedTokenError(
        this.source,
        group.firstToken().pos,
        group.firstToken(),
      );
    }
    const elements = group.unwrap();
    const clauses = elements.splice(1);
    // safe to cast because of the check above
    const lastClause = <Token | Group>clauses.pop();

    // Clauses are treated as a group of groups of expressions
    // Form: (<expr> <sequence>)
    const convertedClauses: Expression[] = [];
    const convertedConsequents: Expression[] = [];

    for (const clause of clauses) {
      // Verify clause is a group with size no less than 2
      if (!(clause instanceof Group)) {
        throw new ParserError.UnexpectedTokenError(
          this.source,
          clause.pos,
          clause,
        );
      }
      if (clause.length() < 2) {
        throw new ParserError.UnexpectedTokenError(
          this.source,
          clause.firstToken().pos,
          clause.firstToken(),
        );
      }
      const test = clause.first();
      const consequent = clause.unwrap().slice(1);

      // verify that test is NOT an else token
      if (test instanceof Token && test.type === TokenType.ELSE) {
        throw new ParserError.UnexpectedTokenError(this.source, test.pos, test);
      }

      // verify that consequent is at least 1 expression
      if (consequent.length < 1) {
        throw new Error("consequent cannot be empty");
      }
      // Test is treated as a single expression
      const convertedTest = this.parseExpression(test);

      // Consequent is treated as a group of expressions
      const consequentExpressions = consequent.map(this.parseExpression);
      const consequentLocation = consequentExpressions
        .at(0)!
        .location.merge(consequentExpressions.at(-1)!.location);
      const convertedConsequent =
        consequent.length === 1
          ? consequentExpressions[0]
          : new Atomic.Sequence(consequentLocation, consequentExpressions);

      convertedClauses.push(convertedTest);
      convertedConsequents.push(convertedConsequent);
    }

    // Check last clause
    // Verify lastClause is a group with size 2
    if (!(lastClause instanceof Group)) {
      throw new ParserError.UnexpectedTokenError(
        this.source,
        lastClause.pos,
        lastClause,
      );
    }
    if (lastClause.length() !== 2) {
      throw new ParserError.UnexpectedTokenError(
        this.source,
        lastClause.firstToken().pos,
        lastClause.firstToken(),
      );
    }
    const test = lastClause.first();
    const consequent = lastClause.unwrap().slice(1);

    let isElse = false;

    // verify that test is an else token
    if (test instanceof Token && test.type === TokenType.ELSE) {
      isElse = true;
    }

    // verify that consequent is at least 1 expression
    if (consequent.length < 1) {
      throw new Error("consequent cannot be empty");
    }

    // Consequent is treated as a group of expressions
    const consequentExpressions = consequent.map(this.parseExpression);
    const consequentLocation = consequentExpressions
      .at(0)!
      .location.merge(consequentExpressions.at(-1)!.location);
    const lastConsequent =
      consequent.length === 1
        ? consequentExpressions[0]
        : new Atomic.Sequence(consequentLocation, consequentExpressions);

    if (isElse) {
      return new Extended.Cond(
        group.location,
        convertedClauses,
        convertedConsequents,
        lastConsequent,
      );
    }

    // If the last clause is not an else clause, we treat it as a normal cond clause instead
    const lastTest = this.parseExpression(test);

    // Test
    convertedClauses.push(lastTest);
    convertedConsequents.push(lastConsequent);

    return new Extended.Cond(
      group.location,
      convertedClauses,
      convertedConsequents,
    );
  }

  // _____________________CHAPTER 3_____________________

  /**
   * Parse a reassignment expression.
   * @param group
   * @returns
   */
  private parseSet(group: Group): Atomic.Reassignment {
    // Form: (set! <identifier> <expr>)
    // ensure that the group has 3 elements
    if (group.length() !== 3) {
      throw new ParserError.UnexpectedTokenError(
        this.source,
        group.firstToken().pos,
        group.firstToken(),
      );
    }
    const elements = group.unwrap();
    const identifier = elements[1];
    const expr = elements[2];

    // Identifier is treated as a single identifier
    if (!(identifier instanceof Token)) {
      throw new ParserError.UnexpectedTokenError(
        this.source,
        identifier.firstToken().pos,
        identifier.firstToken(),
      );
    }
    if (identifier.type !== TokenType.IDENTIFIER) {
      throw new ParserError.UnexpectedTokenError(
        this.source,
        identifier.pos,
        identifier,
      );
    }
    const convertedIdentifier = new Atomic.Identifier(
      this.toLocation(identifier),
      identifier.lexeme,
    );
    const convertedExpr = this.parseExpression(expr);
    return new Atomic.Reassignment(
      group.location,
      convertedIdentifier,
      convertedExpr,
    );
  }

  /**
   * Parse a begin expression.
   * @param group
   * @returns
   */
  private parseBegin(group: Group): Extended.Begin {
    // Form: (begin <sequence>)
    // ensure that the group has 2 or more elements
    if (group.length() < 2) {
      throw new ParserError.UnexpectedTokenError(
        this.source,
        group.firstToken().pos,
        group.firstToken(),
      );
    }
    const sequence = group.unwrap();
    const sequenceElements = sequence.slice(1);
    const convertedExpressions: Expression[] = [];
    for (const sequenceElement of sequenceElements) {
      convertedExpressions.push(this.parseExpression(sequenceElement));
    }
    return new Extended.Begin(group.location, convertedExpressions);
  }

  /**
   * Parse a delay expression.
   * @param group
   * @returns
   */
  private parseDelay(group: Group): Extended.Delay {
    // Form: (delay <expr>)
    // ensure that the group has 2 elements
    if (group.length() !== 2) {
      throw new ParserError.UnexpectedTokenError(
        this.source,
        group.firstToken().pos,
        group.firstToken(),
      );
    }
    const elements = group.unwrap();
    const expr = elements[1];

    // Expr is treated as a single expression
    const convertedExpr = this.parseExpression(expr);

    return new Extended.Delay(group.location, convertedExpr);
  }

  // ___________________MISCELLANEOUS___________________

  /**
   * Parse an import expression.
   * @param group
   * @returns
   */
  private parseImport(group: Group): Atomic.Import {
    // Form: (import <string> (<identifier>*))
    // ensure that the group has 3 elements
    if (group.length() !== 3) {
      throw new ParserError.UnexpectedTokenError(
        this.source,
        group.firstToken().pos,
        group.firstToken(),
      );
    }
    const elements = group.unwrap();
    const string = elements[1];
    const identifiers = elements[2];

    // String is treated as a single string
    if (!(string instanceof Token)) {
      throw new ParserError.UnexpectedTokenError(
        this.source,
        string.firstToken().pos,
        string.firstToken(),
      );
    }
    if (string.type !== TokenType.STRING) {
      throw new ParserError.UnexpectedTokenError(
        this.source,
        string.pos,
        string,
      );
    }

    // Identifiers are treated as a group of identifiers
    if (!(identifiers instanceof Group)) {
      throw new ParserError.UnexpectedTokenError(
        this.source,
        identifiers.pos,
        identifiers,
      );
    }
    const identifierElements = identifiers.unwrap();
    const convertedIdentifiers: Atomic.Identifier[] = [];
    for (const identifierElement of identifierElements) {
      if (!(identifierElement instanceof Token)) {
        throw new ParserError.UnexpectedTokenError(
          this.source,
          identifierElement.firstToken().pos,
          identifierElement.firstToken(),
        );
      }
      if (identifierElement.type !== TokenType.IDENTIFIER) {
        throw new ParserError.UnexpectedTokenError(
          this.source,
          identifierElement.pos,
          identifierElement,
        );
      }
      convertedIdentifiers.push(
        new Atomic.Identifier(
          this.toLocation(identifierElement),
          identifierElement.lexeme,
        ),
      );
    }
    const convertedString = new Atomic.StringLiteral(
      this.toLocation(string),
      string.literal,
    );
    return new Atomic.Import(
      group.location,
      convertedString,
      convertedIdentifiers,
    );
  }

  /**
   * Parse an export expression.
   * @param group
   * @returns
   */
  private parseExport(group: Group): Atomic.Export {
    // Form: (export (<definition>))
    // ensure that the group has 2 elements
    if (group.length() !== 2) {
      throw new ParserError.UnexpectedTokenError(
        this.source,
        group.firstToken().pos,
        group.firstToken(),
      );
    }
    const elements = group.unwrap();
    const definition = elements[1];

    // assert that definition is a group
    if (!(definition instanceof Group)) {
      throw new ParserError.UnexpectedTokenError(
        this.source,
        definition.pos,
        definition,
      );
    }

    const convertedDefinition = this.parseExpression(definition);
    // assert that convertedDefinition is a definition
    if (!(convertedDefinition instanceof Atomic.Definition)) {
      throw new ParserError.UnexpectedTokenError(
        this.source,
        definition.firstToken().pos,
        definition.firstToken(),
      );
    }

    return new Atomic.Export(group.location, convertedDefinition);
  }

  /**
   * Parses a vector expression
   */
  private parseVector(group: Group): Atomic.Vector {
    // Because of the group invariants, we can safely assume that the group
    // is strictly of size 2.
    // Additionally, we can safely assume that the second element is a group
    // because token HASH_VECTOR expects a parenthesis as the next immediate
    // token.
    const elements = group.unwrap()[1] as Group;

    // Vectors will be treated normally regardless of the quote mode.
    // but interior expressions will be affected by the mode.
    const convertedElements = elements.unwrap().map(this.parseExpression);

    return new Atomic.Vector(group.location, convertedElements);
  }

  // ___________________________________________________

  /**
   * Parses a sequence of tokens into an AST.
   *
   * @param group A group of tokens.
   * @returns An AST.
   */
  parse(): Expression[] {
    // collect all top-level elements
    const topElements: Expression[] = [];
    while (!this.isAtEnd()) {
      const currentGroup = this.grouping();
      // top level definitions are always wrapped up in
      // a second group
      // so unwrap them
      const currentElement = currentGroup.unwrap()[0];
      if (
        currentElement instanceof Token &&
        currentElement.type === TokenType.EOF
      ) {
        break;
      }
      const convertedElement = this.parseExpression(currentElement);
      console.log(currentElement);
      topElements.push(convertedElement);
    }
    return topElements;
  }
}
