import { Expression, Atomic, Extended } from '../transpiler/types/nodes/scheme-node-types';
import { Location, Position } from '../transpiler/types/location';
import { SchemeComplexNumber } from './complex';

interface Token {
  type: string;
  value: string;
  line: number;
  column: number;
}

export function parseSchemeSimple(code: string): Expression[] {
  const tokens = tokenize(code);
  const parser = new SimpleSchemeParser(tokens);
  return parser.parse();
}

function tokenize(code: string): Token[] {
  const tokens: Token[] = [];
  let current = 0;
  let line = 1;
  let column = 1;

  while (current < code.length) {
    const char = code[current];
    
    if (char === '(' || char === '[') {
      tokens.push({ type: 'LPAREN', value: char, line, column });
      current++;
      column++;
    } else if (char === ')' || char === ']') {
      tokens.push({ type: 'RPAREN', value: char, line, column });
      current++;
      column++;
    } else if (char === '\'') {
      tokens.push({ type: 'QUOTE', value: char, line, column });
      current++;
      column++;
    } else if (isWhitespace(char)) {
      if (char === '\n') {
        line++;
        column = 1;
      } else {
        column++;
      }
      current++;
    } else if (char === ';') {
      // Skip comments
      while (current < code.length && code[current] !== '\n') {
        current++;
      }
    } else if (char === '"') {
      // String literal
      const startColumn = column;
      current++;
      column++;
      let value = '';
      while (current < code.length && code[current] !== '"') {
        if (code[current] === '\\' && current + 1 < code.length) {
          current++;
          column++;
          value += code[current];
        } else {
          value += code[current];
        }
        current++;
        column++;
      }
      if (current < code.length) {
        current++;
        column++;
      }
      tokens.push({ type: 'STRING', value, line, column: startColumn });
    } else if (isDigit(char) || (char === '+' || char === '-') && isDigit(code[current + 1])) {
      // Number literal (including complex numbers)
      const startColumn = column;
      let value = '';
      
      // Handle potential complex numbers or signed numbers
      if (char === '+' || char === '-') {
        value += char;
        current++;
        column++;
      }
      
      // Read number part
      while (current < code.length && (isDigit(code[current]) || code[current] === '.' || code[current] === 'e' || code[current] === 'E' || code[current] === '+' || code[current] === '-')) {
        value += code[current];
        current++;
        column++;
      }
      
      // Check for complex number suffix 'i' or 'I'
      if (current < code.length && (code[current] === 'i' || code[current] === 'I')) {
        value += code[current];
        current++;
        column++;
        tokens.push({ type: 'COMPLEX', value, line, column: startColumn });
      } else {
        tokens.push({ type: 'NUMBER', value, line, column: startColumn });
      }
    } else if (char === '#') {
      // Handle # prefixed tokens
      const startColumn = column;
      current++;
      column++;
      let value = '#';
      while (current < code.length && isIdentifierPart(code[current])) {
        value += code[current];
        current++;
        column++;
      }
      
      // Check for special keywords
      if (value === '#t' || value === '#true') {
        tokens.push({ type: 'BOOLEAN', value: 'true', line, column: startColumn });
      } else if (value === '#f' || value === '#false') {
        tokens.push({ type: 'BOOLEAN', value: 'false', line, column: startColumn });
      } else {
        tokens.push({ type: 'IDENTIFIER', value, line, column: startColumn });
      }
    } else if (isIdentifierStart(char)) {
      // Identifier or keyword
      const startColumn = column;
      let value = '';
      while (current < code.length && isIdentifierPart(code[current])) {
        value += code[current];
        current++;
        column++;
      }
      
      tokens.push({ type: 'IDENTIFIER', value, line, column: startColumn });
    } else {
      // Unknown character
      current++;
      column++;
    }
  }
  
  tokens.push({ type: 'EOF', value: '', line, column });
  return tokens;
}

function isWhitespace(char: string): boolean {
  return /\s/.test(char);
}

function isDigit(char: string): boolean {
  return /\d/.test(char);
}

function isIdentifierStart(char: string): boolean {
  return /[a-zA-Z_+\-*/=<>!?]/.test(char);
}

function isIdentifierPart(char: string): boolean {
  return /[a-zA-Z0-9_+\-*/=<>!?]/.test(char);
}

class SimpleSchemeParser {
  private tokens: Token[];
  private current: number = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parse(): Expression[] {
    const expressions: Expression[] = [];
    
    while (!this.isAtEnd()) {
      const expr = this.parseExpression();
      if (expr) {
        expressions.push(expr);
      }
    }
    
    return expressions;
  }

  private parseExpression(): Expression | null {
    const token = this.peek();
    
    if (token.type === 'NUMBER') {
      return this.parseNumber();
    } else if (token.type === 'COMPLEX') {
      return this.parseComplex();
    } else if (token.type === 'STRING') {
      return this.parseString();
    } else if (token.type === 'BOOLEAN') {
      return this.parseBoolean();
    } else if (token.type === 'IDENTIFIER') {
      return this.parseIdentifier();
    } else if (token.type === 'LPAREN') {
      return this.parseList();
    } else if (token.type === 'QUOTE') {
      return this.parseQuote();
    } else {
      this.advance(); // Skip unknown tokens
      return null;
    }
  }

  private parseNumber(): Expression {
    const token = this.advance();
    const location = this.createLocation(token);
    return new Atomic.NumericLiteral(location, token.value);
  }

  private parseComplex(): Expression {
    const token = this.advance();
    const location = this.createLocation(token);
    return new Atomic.ComplexLiteral(location, token.value);
  }

  private parseString(): Expression {
    const token = this.advance();
    const location = this.createLocation(token);
    return new Atomic.StringLiteral(location, token.value);
  }

  private parseBoolean(): Expression {
    const token = this.advance();
    const location = this.createLocation(token);
    return new Atomic.BooleanLiteral(location, token.value === 'true');
  }

  private parseIdentifier(): Expression {
    const token = this.advance();
    const location = this.createLocation(token);
    return new Atomic.Identifier(location, token.value);
  }

  private parseList(): Expression {
    const openToken = this.advance(); // Consume '('
    const location = this.createLocation(openToken);
    const elements: Expression[] = [];
    
    while (!this.isAtEnd() && this.peek().type !== 'RPAREN') {
      const expr = this.parseExpression();
      if (expr) {
        elements.push(expr);
      }
    }
    
    if (this.peek().type === 'RPAREN') {
      this.advance(); // Consume ')'
    }
    
    if (elements.length === 0) {
      return new Atomic.Nil(location);
    }
    
    // Check for special forms
    if (elements.length > 0 && elements[0] instanceof Atomic.Identifier) {
      const first = elements[0] as Atomic.Identifier;
      console.log('DEBUG: parseList - checking special form:', first.name);
      
      if (first.name === 'define') {
        return this.parseDefine(elements, location);
      } else if (first.name === 'lambda') {
        return this.parseLambda(elements, location);
      } else if (first.name === 'if') {
        return this.parseConditional(elements, location);
      } else if (first.name === 'let') {
        return this.parseLet(elements, location);
      } else if (first.name === 'begin') {
        return this.parseBegin(elements, location);
      } else if (first.name === 'cond') {
        return this.parseCond(elements, location);
      }
    }
    
    // Check if this is a parameter list (single element that's not a special form)
    if (elements.length === 1 && elements[0] instanceof Atomic.Identifier) {
      // This could be a parameter list like (x) in lambda
      return new Extended.List(location, elements);
    }
    
    // Regular function application
    if (elements.length > 0) {
      const operator = elements[0];
      const operands = elements.slice(1);
      return new Atomic.Application(location, operator, operands);
    }
    
    return new Extended.List(location, elements);
  }

  private parseDefine(elements: Expression[], location: Location): Expression {
    if (elements.length < 3) {
      throw new Error('define requires at least 2 arguments');
    }
    
    const name = elements[1];
    const value = elements[2];
    
    console.log('DEBUG: parseDefine - name type:', name.constructor.name);
    console.log('DEBUG: parseDefine - name:', name);
    console.log('DEBUG: parseDefine - Extended.List check:', name instanceof Extended.List);
    
    // Handle function definition: (define (func-name args) body)
    if ((name instanceof Extended.List && name.elements.length > 0) || 
        (name instanceof Atomic.Application && name.operator instanceof Atomic.Identifier)) {
      console.log('DEBUG: parseDefine - Processing function definition');
      
      let funcName: Atomic.Identifier;
      let params: Atomic.Identifier[];
      
      if (name instanceof Extended.List) {
        funcName = name.elements[0] as Atomic.Identifier;
        params = name.elements.slice(1).filter(e => e instanceof Atomic.Identifier) as Atomic.Identifier[];
      } else {
        // Handle Application case: (add x y) -> operator is 'add', operands are [x, y]
        funcName = name.operator as Atomic.Identifier;
        params = name.operands.filter(e => e instanceof Atomic.Identifier) as Atomic.Identifier[];
      }
      
      console.log('DEBUG: parseDefine - funcName type:', funcName.constructor.name);
      console.log('DEBUG: parseDefine - funcName:', funcName.name);
      
      if (!(funcName instanceof Atomic.Identifier)) {
        throw new Error('function name must be an identifier');
      }
      
      console.log('DEBUG: parseDefine - params:', params.length);
      
      // Create lambda expression for the function body
      const lambda = new Atomic.Lambda(location, value, params);
      
      // Return definition with lambda as value
      return new Atomic.Definition(location, funcName, lambda);
    }
    
    // Handle variable definition: (define name value)
    console.log('DEBUG: parseDefine - Processing variable definition');
    if (!(name instanceof Atomic.Identifier)) {
      throw new Error('define name must be an identifier');
    }
    
    return new Atomic.Definition(location, name, value);
  }

  private parseLambda(elements: Expression[], location: Location): Expression {
    if (elements.length < 3) {
      throw new Error('lambda requires at least 2 arguments');
    }
    
    const paramsExpr = elements[1];
    const body = elements[2];
    
    console.log('DEBUG: parseLambda - paramsExpr type:', paramsExpr.constructor.name);
    console.log('DEBUG: parseLambda - paramsExpr:', paramsExpr);
    
    let params: Atomic.Identifier[] = [];
    if (paramsExpr instanceof Extended.List) {
      // Handle parameter list like (x y z)
      params = paramsExpr.elements.filter(e => e instanceof Atomic.Identifier) as Atomic.Identifier[];
    } else if (paramsExpr instanceof Atomic.Application && paramsExpr.operator instanceof Atomic.Identifier) {
      // Handle Application case: (x y) -> operator is 'x', operands are ['y']
      params = [paramsExpr.operator as Atomic.Identifier];
      params.push(...paramsExpr.operands.filter(e => e instanceof Atomic.Identifier) as Atomic.Identifier[]);
    } else if (paramsExpr instanceof Atomic.Identifier) {
      // Handle single parameter like x
      params = [paramsExpr];
    } else if (paramsExpr instanceof Atomic.Nil) {
      // Handle empty parameter list like ()
      params = [];
    } else {
      throw new Error('lambda parameters must be identifiers');
    }
    
    console.log('DEBUG: parseLambda - params:', params.length);
    return new Atomic.Lambda(location, body, params);
  }

  private parseConditional(elements: Expression[], location: Location): Expression {
    if (elements.length !== 4) {
      throw new Error('if requires exactly 3 arguments');
    }
    
    const test = elements[1];
    const consequent = elements[2];
    const alternate = elements[3];
    
    return new Atomic.Conditional(location, test, consequent, alternate);
  }

  private parseLet(elements: Expression[], location: Location): Expression {
    if (elements.length < 3) {
      throw new Error('let requires at least 2 arguments');
    }
    
    const bindingsExpr = elements[1];
    const body = elements[2];
    
    let identifiers: Atomic.Identifier[] = [];
    let values: Expression[] = [];
    
    if (bindingsExpr instanceof Extended.List) {
      for (const binding of bindingsExpr.elements) {
        if (binding instanceof Extended.List && binding.elements.length === 2) {
          const id = binding.elements[0];
          const val = binding.elements[1];
          if (id instanceof Atomic.Identifier) {
            identifiers.push(id);
            values.push(val);
          }
        }
      }
    }
    
    return new Extended.Let(location, identifiers, values, body);
  }

  private parseBegin(elements: Expression[], location: Location): Expression {
    const expressions = elements.slice(1);
    return new Extended.Begin(location, expressions);
  }

  private parseCond(elements: Expression[], location: Location): Expression {
    const clauses = elements.slice(1);
    const predicates: Expression[] = [];
    const consequents: Expression[] = [];
    let catchall: Expression | undefined;
    
    for (const clause of clauses) {
      if (clause instanceof Extended.List && clause.elements.length >= 2) {
        const predicate = clause.elements[0];
        const consequent = clause.elements[1];
        
        if (predicate instanceof Atomic.Identifier && predicate.name === 'else') {
          catchall = consequent;
        } else {
          predicates.push(predicate);
          consequents.push(consequent);
        }
      }
    }
    
    return new Extended.Cond(location, predicates, consequents, catchall);
  }

  private parseQuote(): Expression {
    this.advance(); // Consume quote
    const quoted = this.parseExpression();
    if (!quoted) {
      throw new Error('quote requires an expression');
    }
    return quoted; // Return the quoted expression directly
  }

  private createLocation(token: Token): Location {
    const start = new Position(token.line, token.column);
    const end = new Position(token.line, token.column + token.value.length);
    return new Location(start, end);
  }

  private advance(): Token {
    if (!this.isAtEnd()) {
      this.current++;
    }
    return this.previous();
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  private isAtEnd(): boolean {
    return this.peek().type === 'EOF';
  }
} 