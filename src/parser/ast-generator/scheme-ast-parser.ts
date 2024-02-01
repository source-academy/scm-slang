import { Token } from "../types/token";
import { TokenType } from "../types/token-type";
import { Location, Position } from "../types/location";
import { Atomic, Expression, Extended } from "../types/node-types";
import * as ParserError from "../parser-error";
import { Group } from "./token-grouping";


export class SchemeParser {
  private readonly source: string;
  private readonly tokens: Token[];
  private readonly ast: Expression | undefined;
  private readonly chapter: number;
  private current: number = 0;

  constructor(source: string, tokens: Token[], chapter: number = Infinity) {
    this.source = source;
    this.tokens = tokens;
    this.chapter = chapter;
    this.ast = undefined
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
        this.chapter
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
   * Returns a group of associated tokens.
   * Tokens are grouped by level of parentheses.
   *
   * @param openparen The type of opening parenthesis.
   * @returns A group of tokens or groups of tokens.
   */
  private grouping(openparen?: Token): Group {
    // grouping() is called without parentheses at top level or when quoting a token
    let inList = openparen === undefined ? false : true;
    const elements: (Token | Group)[] = [];
    do {
      let c = this.advance();
      switch (c.type) {
        case TokenType.LEFT_PAREN:
        case TokenType.LEFT_BRACKET:
          const innerGroup = this.grouping(c);
          // append this parenthesis to the inner group
          innerGroup.admit(c);
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
        case TokenType.APOSTROPHE:
        case TokenType.BACKTICK:
        case TokenType.HASH:
        case TokenType.COMMA:
        case TokenType.COMMA_AT:
          // These special notations are converted to their
          // corresponding "procedure-style" tokens.
          const convertedToken = c.convertToken();
          // add this token to the next group
          const nextGroup = this.grouping();
          nextGroup.admit(convertedToken);
          // modify the next group's location
          elements.push(nextGroup);
          break;
        case TokenType.IMPORT:
        case TokenType.EXPORT:
        case TokenType.BEGIN:
        case TokenType.DELAY:
        case TokenType.COND:
        case TokenType.ELSE:
        case TokenType.IDENTIFIER:
        case TokenType.NUMBER:
        case TokenType.BOOLEAN:
        case TokenType.STRING:
        case TokenType.IF:
        case TokenType.DEFINE:
        case TokenType.QUOTE:
        case TokenType.SET:
        case TokenType.LAMBDA:
        case TokenType.LET:
        case TokenType.DOT:
          elements.push(c);
          break;
        case TokenType.EOF:
          if (inList) {
            throw new ParserError.UnexpectedEOFError(this.source, c.pos);
          } else {
            elements.push(c);
          }
          break;
        default:
          throw new ParserError.UnexpectedTokenError(this.source, c.pos, c);
      }
    } while (inList);
    return new Group(elements);
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
    // It's a group
    return this.parseGroup(expr);
  }

  private parseToken(token: Token): Expression {
    switch (token.type) {
      case TokenType.IDENTIFIER:
        return new Atomic.Identifier(this.toLocation(token), token.lexeme);
      case TokenType.NUMBER:
        return new Atomic.NumericLiteral(this.toLocation(token), token.literal as number);
      case TokenType.BOOLEAN:
        return new Atomic.BooleanLiteral(this.toLocation(token), token.literal as boolean);
      case TokenType.STRING:
        return new Atomic.StringLiteral(this.toLocation(token), token.literal as string);
      default:
        throw new ParserError.UnexpectedTokenError(this.source, token.pos, token);
    }
  }

  private parseGroup(group: Group): Expression {
    // No need to check for empty groups because they are not valid
    if (!group.isParenthesized() && group.length() === 1) {
      // Literal or Identifier
      // Form: <literal> 
      //     | <identifier>
      const firstElement = group.first();
      if (firstElement instanceof Token) {
        return this.parseToken(firstElement);
      } else {
        // Form: <group>
        // Evaluate the inner grouping
        return this.parseExpression(firstElement);
      }
    } else if (!group.isParenthesized() && group.length() === 2) {
      // A product of admitting converted tokens to the start of groups
      // Form: <converted-token> <group>
      //     | <converted-token> <token>
      const firstElement = group.first();
      const secondElement = group.last();
      if (firstElement instanceof Token) {
        switch (firstElement.type) {
          case TokenType.QUOTE:
            this.validateChapter(firstElement, 2);
            return this.parseQuote(group, false);
          case TokenType.QUASIQUOTE:
            this.validateChapter(firstElement, 2);
            return this.parseQuote(group, true);
          case TokenType.UNQUOTE:
            this.validateChapter(firstElement, 2);
            return this.parseUnquote(group);
          default:
            throw new ParserError.UnexpectedTokenError(this.source, firstElement.pos, firstElement);
        }
      } else {
        // Form: <group> <group>
        // invalid
        const firstInvalid = firstElement.firstToken();
        throw new ParserError.UnexpectedTokenError(this.source, firstInvalid.pos, firstInvalid);
      }
    } else {
      // the group is parenthesized and has more than 2 elements
      // Form: (<expr> <expr>*)
      // more work is needed
      const elements = group.unwrap();
      const firstElement = elements[0];

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
            this.validateChapter(firstElement, 2);
            return this.parseQuote(group, false);
          case TokenType.QUASIQUOTE:
            this.validateChapter(firstElement, 2);
            return this.parseQuote(group, true);
          case TokenType.UNQUOTE:
            this.validateChapter(firstElement, 2);
            return this.parseUnquote(group);

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

          default:
            // It's a procedure call
            return this.parseApplication(group);
        }
      }
      // Form: (<group> <expr>*)
      // It's a procedure call
      return this.parseApplication(group);
    }
  }

  // _____________________CHAPTER 1_____________________
  /**
   * Parse a single group as a sequence expression. Only used
   * for top-level expressions and function bodies.
   * @param group 
   * @returns 
   */
  private parseAsSequence(group: Group): Atomic.Sequence {
    const sourceElements = group.unwrap();
    const convertedExpressions: Expression[] = [];
    for (const sourceElement of sourceElements) {
      convertedExpressions.push(this.parseExpression(sourceElement));
    }
    return new Atomic.Sequence(
      group.location,
      convertedExpressions);
  }

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
      throw new ParserError.UnexpectedTokenError(this.source, group.firstToken().pos, group.firstToken());
    }
    const elements = group.unwrap();
    const formals = elements[1];
    const body = group.truncate(2);

    // Formals should be a group of identifiers or a single identifier
    const convertedFormals: Atomic.Identifier[] = [];

    if (formals instanceof Token) {
      if (formals.type !== TokenType.IDENTIFIER) {
        throw new ParserError.UnexpectedTokenError(this.source, formals.pos, formals);
      }
      convertedFormals.push(new Atomic.Identifier(this.toLocation(formals), formals.lexeme));
    } else {
      const formalsElements = formals.unwrap();
      for (const formalsElement of formalsElements) {
        if (formalsElement instanceof Token) {
          if (formalsElement.type !== TokenType.IDENTIFIER) {
            throw new ParserError.UnexpectedTokenError(this.source, formalsElement.pos, formalsElement);
          }
          convertedFormals.push(new Atomic.Identifier(this.toLocation(formalsElement), formalsElement.lexeme));
        } else {
          throw new ParserError.UnexpectedTokenError(this.source, formalsElement.firstToken().pos, formalsElement.firstToken());
        }
      }
    }

    // Body is treated as a group of expressions
    const convertedBody = this.parseAsSequence(body);

    return new Atomic.Lambda(
      group.location,
      convertedFormals,
      convertedBody
    );
  }

  /**
   * Parse a define expression.
   * @param group
   * @returns
   */
  private parseDefinition(group: Group): Atomic.Definition | Extended.FunctionDefinition {
    // Form: (define <identifier> <expr>)
    //     | (define (<identifier> <formals>) <body>)
    //     | (define (<identifier> <formals>) <body> <body>*)
    // ensure that the group has at least 3 elements
    if (group.length() < 3) {
      throw new ParserError.UnexpectedTokenError(this.source, group.firstToken().pos, group.firstToken());
    }
    const elements = group.unwrap();
    const identifier = elements[1];
    const expr = group.truncate(2);

    let convertedIdentifier: Atomic.Identifier;
    let convertedFormals: Atomic.Identifier[] = [];
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
        throw new ParserError.UnexpectedTokenError(this.source, function_name.firstToken().pos, function_name.firstToken());
      }
      if (function_name.type !== TokenType.IDENTIFIER) {
        throw new ParserError.UnexpectedTokenError(this.source, function_name.pos, function_name);
      }

      // convert the first element to an identifier
      convertedIdentifier = new Atomic.Identifier(this.toLocation(function_name), function_name.lexeme);

      // verify that the rest of the elements are identifiers
      for (const formalsElement of formals) {
        if (!(formalsElement instanceof Token)) {
          throw new ParserError.UnexpectedTokenError(this.source, formalsElement.firstToken().pos, formalsElement.firstToken());
        }
        if (formalsElement.type !== TokenType.IDENTIFIER) {
          throw new ParserError.UnexpectedTokenError(this.source, formalsElement.pos, formalsElement);
        }
        convertedFormals.push(new Atomic.Identifier(this.toLocation(formalsElement), formalsElement.lexeme));
      }

    } else if (identifier.type !== TokenType.IDENTIFIER) {
      throw new ParserError.UnexpectedTokenError(this.source, identifier.pos, identifier);
    } else {
      // its a normal definition
      convertedIdentifier = new Atomic.Identifier(this.toLocation(identifier), identifier.lexeme);
      isFunctionDefinition = false;
    }

    if (isFunctionDefinition) {
      // Body is treated as a group of expressions
      const convertedBody = this.parseAsSequence(expr);

      return new Extended.FunctionDefinition(
        group.location,
        convertedIdentifier,
        convertedFormals,
        convertedBody
      );
    }

    // Expr is treated as a single expression
    const convertedExpr = this.parseExpression(expr);

    return new Atomic.Definition(
      group.location,
      convertedIdentifier,
      convertedExpr
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
      throw new ParserError.UnexpectedTokenError(this.source, group.firstToken().pos, group.firstToken());
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

    const convertedAlternate = alternate ? this.parseExpression(alternate) : new Atomic.Nil(group.location);

    return new Atomic.Conditional(
      group.location,
      convertedTest,
      convertedConsequent,
      convertedAlternate
    );
  }

  /**
   * Parse an application expression.
   */
  private parseApplication(group: Group): Atomic.Application {
    // Form: (<expr> <expr>*)
    // ensure that the group has at least 1 element
    if (group.length() < 1) {
      throw new ParserError.UnexpectedTokenError(this.source, group.firstToken().pos, group.firstToken());
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
      convertedOperands
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
      throw new ParserError.UnexpectedTokenError(this.source, group.firstToken().pos, group.firstToken());
    }
    const elements = group.unwrap();
    const bindings = elements[1];
    const body = group.truncate(2);

    // Verify bindings is a group
    if (!(bindings instanceof Group)) {
      throw new ParserError.UnexpectedTokenError(this.source, bindings.pos, bindings);
    }

    // Bindings are treated as a group of grouped identifiers and values
    const convertedIdentifiers: Atomic.Identifier[] = [];
    const convertedValues: Expression[] = [];

    const bindingElements = bindings.unwrap();
    for (const bindingElement of bindingElements) {
      // Verify bindingElement is a group of size 2
      if (!(bindingElement instanceof Group)) {
        throw new ParserError.UnexpectedTokenError(this.source, bindingElement.pos, bindingElement);
      }
      if (bindingElement.length() !== 2) {
        throw new ParserError.UnexpectedTokenError(this.source, bindingElement.firstToken().pos, bindingElement.firstToken());
      }
      const identifier = bindingElement.first();
      const value = bindingElement.last();

      // Verify identifier is a token and an identifier
      if (!(identifier instanceof Token)) {
        throw new ParserError.UnexpectedTokenError(this.source, identifier.firstToken().pos, identifier.firstToken());
      }
      if (identifier.type !== TokenType.IDENTIFIER) {
        throw new ParserError.UnexpectedTokenError(this.source, identifier.pos, identifier);
      }
      convertedIdentifiers.push(new Atomic.Identifier(this.toLocation(identifier), identifier.lexeme));
      convertedValues.push(this.parseExpression(value));
    }

    // Body is treated as a group of expressions
    const convertedBody = this.parseAsSequence(body);

    return new Extended.Let(
      group.location,
      convertedIdentifiers,
      convertedValues,
      convertedBody
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
      throw new ParserError.UnexpectedTokenError(this.source, group.firstToken().pos, group.firstToken());
    }
    const elements = group.unwrap();
    const clauses = elements.splice(1);
    // safe to cast because of the check above
    const lastClause = <Token | Group>clauses.pop();

    // Clauses are treated as a group of groups of expressions
    // Form: (<expr> <sequence>)
    const convertedClauses: Expression[] = [];
    const convertedConsequents: Atomic.Sequence[] = [];

    for (const clause of clauses) {
      // Verify clause is a group with size no less than 2
      if (!(clause instanceof Group)) {
        throw new ParserError.UnexpectedTokenError(this.source, clause.pos, clause);
      }
      if (clause.length() < 2) {
        throw new ParserError.UnexpectedTokenError(this.source, clause.firstToken().pos, clause.firstToken());
      }
      const test = clause.first();
      const consequent = clause.truncate(1);

      // verify that test is NOT an else token
      if (test instanceof Token && test.type === TokenType.ELSE) {
        throw new ParserError.UnexpectedTokenError(this.source, test.pos, test);
      }

      // Test is treated as a single expression
      const convertedTest = this.parseExpression(test);

      // Consequent is treated as a group of expressions
      const convertedConsequent = this.parseAsSequence(consequent);

      convertedClauses.push(convertedTest);
      convertedConsequents.push(convertedConsequent);
    }

    // Check last clause
    // Verify lastClause is a group with size 2
    if (!(lastClause instanceof Group)) {
      throw new ParserError.UnexpectedTokenError(this.source, lastClause.pos, lastClause);
    }
    if (lastClause.length() !== 2) {
      throw new ParserError.UnexpectedTokenError(this.source, lastClause.firstToken().pos, lastClause.firstToken());
    }
    const test = lastClause.first();
    const consequent = lastClause.truncate(1);
    let isElse = false;

    // verify that test is an else token
    if ((test instanceof Token) && test.type === TokenType.ELSE) {
      isElse = true;
    }

    // Consequent is treated as a group of expressions
    const lastConsequent = this.parseAsSequence(consequent);

    if (isElse) {
      return new Extended.Cond(
        group.location,
        convertedClauses,
        convertedConsequents,
        lastConsequent
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
      convertedConsequents
    );
  }
  // _____________________CHAPTER 2_____________________
  // We leave the proper logic of quote, unquote, and quasiquote to a quoter visitor.
  // It is important that the quoter visitor runs immediately after the parser, before
  // any optimization passes. 
  // The parser only needs to convert the tokens to the appropriate expressions.

  /**
   * Parse a quote expression.
   * @param group
   * @returns
   */
  private parseQuote(group: Group, isQuasiquote: boolean): Extended.Quote {
    // Form: (quote <expr>)
    // ensure that the group has 2 elements
    if (group.length() !== 2) {
      throw new ParserError.UnexpectedTokenError(this.source, group.firstToken().pos, group.firstToken());
    }
    const elements = group.unwrap();
    const expr = elements[1];

    // Expr is treated as a single expression
    const convertedExpr = this.parseExpression(expr);

    return new Extended.Quote(
      group.location,
      convertedExpr,
      isQuasiquote
    );
  }

  /**
   * Parse an unquote expression.
   * @param group
   * @returns
   */
  private parseUnquote(group: Group): Extended.Unquote {
    // Form: (unquote <expr>)
    // ensure that the group has 2 elements
    if (group.length() !== 2) {
      throw new ParserError.UnexpectedTokenError(this.source, group.firstToken().pos, group.firstToken());
    }
    const elements = group.unwrap();
    const expr = elements[1];

    // Expr is treated as a single expression
    const convertedExpr = this.parseExpression(expr);

    return new Extended.Unquote(
      group.location,
      convertedExpr
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
      throw new ParserError.UnexpectedTokenError(this.source, group.firstToken().pos, group.firstToken());
    }
    const elements = group.unwrap();
    const identifier = elements[1];
    const expr = elements[2];

    // Identifier is treated as a single identifier
    if (!(identifier instanceof Token)) {
      throw new ParserError.UnexpectedTokenError(this.source, identifier.firstToken().pos, identifier.firstToken());
    }
    if (identifier.type !== TokenType.IDENTIFIER) {
      throw new ParserError.UnexpectedTokenError(this.source, identifier.pos, identifier);
    }
    const convertedIdentifier = new Atomic.Identifier(this.toLocation(identifier), identifier.lexeme);
    const convertedExpr = this.parseExpression(expr);
    return new Atomic.Reassignment(
      group.location,
      convertedIdentifier,
      convertedExpr
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
      throw new ParserError.UnexpectedTokenError(this.source, group.firstToken().pos, group.firstToken());
    }
    const sequence = group.truncate(1);
    const sequenceElements = sequence.unwrap();
    const convertedExpressions: Expression[] = [];
    for (const sequenceElement of sequenceElements) {
      convertedExpressions.push(this.parseExpression(sequenceElement));
    }
    return new Extended.Begin(
      group.location,
      convertedExpressions
    );
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
      throw new ParserError.UnexpectedTokenError(this.source, group.firstToken().pos, group.firstToken());
    }
    const elements = group.unwrap();
    const expr = elements[1];

    // Expr is treated as a single expression
    const convertedExpr = this.parseExpression(expr);

    return new Extended.Delay(
      group.location,
      convertedExpr
    );
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
      throw new ParserError.UnexpectedTokenError(this.source, group.firstToken().pos, group.firstToken());
    }
    const elements = group.unwrap();
    const string = elements[1];
    const identifiers = elements[2];

    // String is treated as a single string
    if (!(string instanceof Token)) {
      throw new ParserError.UnexpectedTokenError(this.source, string.firstToken().pos, string.firstToken());
    }
    if (string.type !== TokenType.STRING) {
      throw new ParserError.UnexpectedTokenError(this.source, string.pos, string);
    }

    // Identifiers are treated as a group of identifiers
    if (!(identifiers instanceof Group)) {
      throw new ParserError.UnexpectedTokenError(this.source, identifiers.pos, identifiers);
    }
    const identifierElements = identifiers.unwrap();
    const convertedIdentifiers: Atomic.Identifier[] = [];
    for (const identifierElement of identifierElements) {
      if (!(identifierElement instanceof Token)) {
        throw new ParserError.UnexpectedTokenError(this.source, identifierElement.firstToken().pos, identifierElement.firstToken());
      }
      if (identifierElement.type !== TokenType.IDENTIFIER) {
        throw new ParserError.UnexpectedTokenError(this.source, identifierElement.pos, identifierElement);
      }
      convertedIdentifiers.push(new Atomic.Identifier(this.toLocation(identifierElement), identifierElement.lexeme));
    }
    const convertedString = new Atomic.StringLiteral(this.toLocation(string), string.literal);
    return new Atomic.Import(
      group.location,
      convertedString,
      convertedIdentifiers
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
      throw new ParserError.UnexpectedTokenError(this.source, group.firstToken().pos, group.firstToken());
    }
    const elements = group.unwrap();
    const definition = elements[1];

    // assert that definition is a group
    if (!(definition instanceof Group)) {
      throw new ParserError.UnexpectedTokenError(this.source, definition.pos, definition);
    }

    const convertedDefinition = this.parseExpression(definition);
    // assert that convertedDefinition is a definition
    if (!(convertedDefinition instanceof Atomic.Definition)) {
      throw new ParserError.UnexpectedTokenError(this.source, definition.firstToken().pos, definition.firstToken());
    }

    return new Atomic.Export(
      group.location,
      convertedDefinition
    );
  }

  // ___________________________________________________

  /**
   * Parses a sequence of tokens into an AST.
   *
   * @param group A group of tokens.
   * @returns An AST.
   */
  parse(): Atomic.Sequence {
    // collect all top-level elements
    const topElements: Expression[] = [];
    while (!this.isAtEnd()) {
      const currentGroup = this.grouping();
      // top level definitions are always wrapped up in
      // a second group
      // so unwrap them
      const currentElement = currentGroup.unwrap()[0];
      if (currentElement instanceof Token && currentElement.type === TokenType.EOF) {
        break;
      }
      const convertedElement = this.parseExpression(currentElement);
      console.log(currentElement);
      topElements.push(convertedElement);
    }
    return new Atomic.Sequence(
      new Location(
        new Position(0, 0),
        this.previous().endPos
      ),
      topElements
    );
  }
}