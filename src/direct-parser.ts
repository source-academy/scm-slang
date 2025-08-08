// import { Expression, Atomic, Extended } from './transpiler/types/nodes/scheme-node-types';
// import { Location, Position } from './transpiler/types/location';

// export function parseSchemeDirect(code: string): Expression[] {
//   const tokens = tokenize(code);
//   const parser = new DirectSchemeParser(tokens);
//   return parser.parse();
// }

// function tokenize(code: string): Token[] {
//   const tokens: Token[] = [];
//   let current = 0;
//   let line = 1;
//   let column = 1;

//   while (current < code.length) {
//     const char = code[current];
    
//     if (char === '(' || char === '[') {
//       tokens.push({ type: 'LPAREN', value: char, line, column });
//       current++;
//       column++;
//     } else if (char === ')' || char === ']') {
//       tokens.push({ type: 'RPAREN', value: char, line, column });
//       current++;
//       column++;
//     } else if (char === '\'') {
//       tokens.push({ type: 'QUOTE', value: char, line, column });
//       current++;
//       column++;
//     } else if (char === '`') {
//       tokens.push({ type: 'BACKQUOTE', value: char, line, column });
//       current++;
//       column++;
//     } else if (char === ',') {
//       tokens.push({ type: 'COMMA', value: char, line, column });
//       current++;
//       column++;
//     } else if (char === '.') {
//       tokens.push({ type: 'DOT', value: char, line, column });
//       current++;
//       column++;
//     } else if (isWhitespace(char)) {
//       if (char === '\n') {
//         line++;
//         column = 1;
//       } else {
//         column++;
//       }
//       current++;
//     } else if (char === ';') {
//       // Skip comments
//       while (current < code.length && code[current] !== '\n') {
//         current++;
//       }
//     } else if (char === '"') {
//       // String literal
//       const startColumn = column;
//       current++;
//       column++;
//       let value = '';
//       while (current < code.length && code[current] !== '"') {
//         if (code[current] === '\\' && current + 1 < code.length) {
//           current++;
//           column++;
//           value += code[current];
//         } else {
//           value += code[current];
//         }
//         current++;
//         column++;
//       }
//       if (current < code.length) {
//         current++;
//         column++;
//       }
//       tokens.push({ type: 'STRING', value, line, column: startColumn });
//     } else if (isDigit(char)) {
//       // Number literal
//       const startColumn = column;
//       let value = '';
//       while (current < code.length && (isDigit(code[current]) || code[current] === '.' || code[current] === 'e' || code[current] === 'E' || code[current] === '+' || code[current] === '-')) {
//         value += code[current];
//         current++;
//         column++;
//       }
//       tokens.push({ type: 'NUMBER', value, line, column: startColumn });
//     } else if (isIdentifierStart(char)) {
//       // Identifier or keyword
//       const startColumn = column;
//       let value = '';
//       while (current < code.length && isIdentifierPart(code[current])) {
//         value += code[current];
//         current++;
//         column++;
//       }
      
//       // Check for special keywords
//       if (value === '#t' || value === '#true') {
//         tokens.push({ type: 'BOOLEAN', value: true, line, column: startColumn });
//       } else if (value === '#f' || value === '#false') {
//         tokens.push({ type: 'BOOLEAN', value: false, line, column: startColumn });
//       } else {
//         // Treat all keywords as identifiers - they'll be distinguished in the parser
//         tokens.push({ type: 'IDENTIFIER', value, line, column: startColumn });
//       }
//     } else {
//       // Unknown character
//       current++;
//       column++;
//     }
//   }

//   tokens.push({ type: 'EOF', value: '', line, column });
//   return tokens;
// }

// function isWhitespace(char: string): boolean {
//   return char === ' ' || char === '\t' || char === '\n' || char === '\r';
// }

// function isDigit(char: string): boolean {
//   return char >= '0' && char <= '9';
// }

// function isIdentifierStart(char: string): boolean {
//   return (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z') || char === '+' || char === '-' || char === '*' || char === '/' || char === '=' || char === '<' || char === '>' || char === '?' || char === '!' || char === '#' || char === '$' || char === '%' || char === '&' || char === '|' || char === '~' || char === '^' || char === '_';
// }

// function isIdentifierPart(char: string): boolean {
//   return isIdentifierStart(char) || isDigit(char);
// }

// interface Token {
//   type: string;
//   value: string | boolean | number;
//   line: number;
//   column: number;
// }

// class DirectSchemeParser {
//   private tokens: Token[];
//   private current: number = 0;

//   constructor(tokens: Token[]) {
//     this.tokens = tokens;
//   }

//   parse(): Expression[] {
//     const expressions: Expression[] = [];
    
//     while (!this.isAtEnd()) {
//       const expr = this.parseExpression();
//       if (expr) {
//         expressions.push(expr);
//       }
//     }
    
//     return expressions;
//   }

//   private parseExpression(): Expression | null {
//     const token = this.peek();
    
//     if (token.type === 'LPAREN') {
//       return this.parseList();
//     } else if (token.type === 'QUOTE') {
//       return this.parseQuote();
//     } else if (token.type === 'BACKQUOTE') {
//       return this.parseBackquote();
//     } else if (token.type === 'NUMBER') {
//       return this.parseNumber();
//     } else if (token.type === 'STRING') {
//       return this.parseString();
//     } else if (token.type === 'BOOLEAN') {
//       return this.parseBoolean();
//     } else if (token.type === 'IDENTIFIER') {
//       return this.parseIdentifier();
//     } else if (token.type === 'EOF') {
//       return null;
//     } else {
//       throw new Error(`Unexpected token: ${token.type} at line ${token.line}, column ${token.column}`);
//     }
//   }

//   private parseList(): Expression {
//     const startToken = this.advance();
//     const location = this.createLocation(startToken);
//     const elements: Expression[] = [];
    
//     while (!this.isAtEnd() && this.peek().type !== 'RPAREN') {
//       const element = this.parseExpression();
//       if (element) {
//         elements.push(element);
//       }
//     }
    
//     if (this.isAtEnd()) {
//       throw new Error('Unmatched parentheses');
//     }
    
//     this.advance(); // consume ')'
    
//     if (elements.length === 0) {
//       return new Atomic.Nil(location);
//     }
    
//     // Check for special forms
//     const first = elements[0];
//     if (first instanceof Atomic.Identifier) {
//       const name = first.name;
      
//       if (name === 'define') {
//         return this.parseDefine(elements, location);
//       } else if (name === 'lambda') {
//         return this.parseLambda(elements, location);
//       } else if (name === 'if') {
//         return this.parseIf(elements, location);
//       } else if (name === 'let') {
//         return this.parseLet(elements, location);
//       } else if (name === 'cond') {
//         return this.parseCond(elements, location);
//       } else if (name === 'begin') {
//         return this.parseBegin(elements, location);
//       } else if (name === 'set!') {
//         return this.parseSet(elements, location);
//       } else if (name === 'quote') {
//         return this.parseQuoteForm(elements, location);
//       }
//     }
    
//     // Regular function application
//     const operator = elements[0];
//     const operands = elements.slice(1);
//     return new Atomic.Application(location, operator, operands);
//   }

//   private parseDefine(elements: Expression[], location: Location): Expression {
//     if (elements.length < 3) {
//       throw new Error('define requires at least 2 arguments');
//     }
    
//     const name = elements[1];
//     const value = elements[2];
    
//     if (!(name instanceof Atomic.Identifier)) {
//       throw new Error('define name must be an identifier');
//     }
    
//     return new Atomic.Definition(location, name, value);
//   }

//   private parseLambda(elements: Expression[], location: Location): Expression {
//     if (elements.length < 3) {
//       throw new Error('lambda requires at least 2 arguments');
//     }
    
//     const params = elements[1];
//     const body = elements[2];
    
//     let paramIdentifiers: Atomic.Identifier[] = [];
    
//     if (params instanceof Extended.List) {
//       // Parameters are in a list like (lambda (x y) ...)
//       paramIdentifiers = params.elements.filter(e => e instanceof Atomic.Identifier) as Atomic.Identifier[];
//     } else if (params instanceof Atomic.Application) {
//       // Parameters are individual identifiers like (lambda x ...)
//       paramIdentifiers = [params.operator as Atomic.Identifier];
//     } else if (params instanceof Atomic.Identifier) {
//       // Single parameter like (lambda x ...)
//       paramIdentifiers = [params];
//     } else {
//       throw new Error('lambda parameters must be identifiers or a list of identifiers');
//     }
    
//     return new Atomic.Lambda(location, body, paramIdentifiers);
//   }

//   private parseIf(elements: Expression[], location: Location): Expression {
//     if (elements.length < 4) {
//       throw new Error('if requires 3 arguments');
//     }
    
//     const test = elements[1];
//     const consequent = elements[2];
//     const alternate = elements[3];
    
//     return new Atomic.Conditional(location, test, consequent, alternate);
//   }

//   private parseLet(elements: Expression[], location: Location): Expression {
//     if (elements.length < 3) {
//       throw new Error('let requires at least 2 arguments');
//     }
    
//     const bindings = elements[1];
//     const body = elements[2];
    
//     if (!(bindings instanceof Extended.List)) {
//       throw new Error('let bindings must be a list');
//     }
    
//     const identifiers: Atomic.Identifier[] = [];
//     const values: Expression[] = [];
    
//     for (const binding of bindings.elements) {
//       if (binding instanceof Extended.List && binding.elements.length === 2) {
//         const [id, val] = binding.elements;
//         if (id instanceof Atomic.Identifier) {
//           identifiers.push(id);
//           values.push(val);
//         }
//       }
//     }
    
//     return new Extended.Let(location, identifiers, values, body);
//   }

//   private parseCond(elements: Expression[], location: Location): Expression {
//     if (elements.length < 2) {
//       throw new Error('cond requires at least 1 clause');
//     }
    
//     const clauses = elements.slice(1);
//     const predicates: Expression[] = [];
//     const consequents: Expression[] = [];
//     let catchall: Expression | undefined;
    
//     for (const clause of clauses) {
//       if (clause instanceof Extended.List && clause.elements.length >= 2) {
//         const [pred, cons] = clause.elements;
//         predicates.push(pred);
//         consequents.push(cons);
//       } else if (clause instanceof Atomic.Identifier && clause.name === 'else') {
//         catchall = clause;
//       }
//     }
    
//     return new Extended.Cond(location, predicates, consequents, catchall);
//   }

//   private parseBegin(elements: Expression[], location: Location): Expression {
//     const expressions = elements.slice(1);
//     return new Extended.Begin(location, expressions);
//   }

//   private parseSet(elements: Expression[], location: Location): Expression {
//     if (elements.length !== 3) {
//       throw new Error('set! requires exactly 2 arguments');
//     }
    
//     const name = elements[1];
//     const value = elements[2];
    
//     if (!(name instanceof Atomic.Identifier)) {
//       throw new Error('set! name must be an identifier');
//     }
    
//     return new Atomic.Reassignment(location, name, value);
//   }

//   private parseQuoteForm(elements: Expression[], location: Location): Expression {
//     if (elements.length !== 2) {
//       throw new Error('quote requires exactly 1 argument');
//     }
    
//     return elements[1];
//   }

//   private parseQuote(): Expression {
//     const token = this.advance();
//     const location = this.createLocation(token);
//     const quoted = this.parseExpression();
    
//     if (!quoted) {
//       throw new Error('quote requires an expression');
//     }
    
//     return quoted;
//   }

//   private parseBackquote(): Expression {
//     // Simplified backquote implementation
//     const token = this.advance();
//     const location = this.createLocation(token);
//     const quoted = this.parseExpression();
    
//     if (!quoted) {
//       throw new Error('backquote requires an expression');
//     }
    
//     return quoted;
//   }

//   private parseNumber(): Expression {
//     const token = this.advance();
//     const location = this.createLocation(token);
//     return new Atomic.NumericLiteral(location, token.value.toString());
//   }

//   private parseString(): Expression {
//     const token = this.advance();
//     const location = this.createLocation(token);
//     return new Atomic.StringLiteral(location, token.value.toString());
//   }

//   private parseBoolean(): Expression {
//     const token = this.advance();
//     const location = this.createLocation(token);
//     return new Atomic.BooleanLiteral(location, token.value as boolean);
//   }

//   private parseIdentifier(): Expression {
//     const token = this.advance();
//     const location = this.createLocation(token);
//     return new Atomic.Identifier(location, token.value.toString());
//   }

//   private createLocation(token: Token): Location {
//     const start = new Position(token.line, token.column);
//     const end = new Position(token.line, token.column + token.value.toString().length);
//     return new Location(start, end);
//   }

//   private advance(): Token {
//     if (!this.isAtEnd()) {
//       this.current++;
//     }
//     return this.previous();
//   }

//   private peek(): Token {
//     return this.tokens[this.current];
//   }

//   private previous(): Token {
//     return this.tokens[this.current - 1];
//   }

//   private isAtEnd(): boolean {
//     return this.peek().type === 'EOF';
//   }
// } 
import { SchemeParser } from './transpiler/parser/scheme-parser';
import { SchemeLexer } from './transpiler/lexer';
import { Expression } from './transpiler/types/nodes/scheme-node-types';

// Thay thế hàm parseSchemeDirect bằng SchemeParser chuẩn
export function parseSchemeDirect(code: string): Expression[] {
  const lexer = new SchemeLexer(code);
  const tokens = lexer.scanTokens();
  const parser = new SchemeParser(code, tokens);
  return parser.parse();
}