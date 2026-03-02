import { schemeParse } from "../index";
import { SchemeInterpreter } from "../conductor/SchemeInterpreter";

describe("SchemeInterpreter Integration Tests", () => {
  let interpreter: SchemeInterpreter;

  beforeEach(() => {
    interpreter = new SchemeInterpreter();
  });

  // ============================================================================
  // PART 1: BASIC ARITHMETIC
  // ============================================================================

  describe("Basic Arithmetic", () => {
    test("(+ 1 2) should return 3", () => {
      const code = "(+ 1 2)";
      const program = schemeParse(code);
      const result = interpreter.evaluate(program);
      expect(result).toBe(3);
    });

    test("(* 3 4) should return 12", () => {
      const code = "(* 3 4)";
      const program = schemeParse(code);
      const result = interpreter.evaluate(program);
      expect(result).toBe(12);
    });

    test("(- 10 3) should return 7", () => {
      const code = "(- 10 3)";
      const program = schemeParse(code);
      const result = interpreter.evaluate(program);
      expect(result).toBe(7);
    });

    test("(/ 10 2) should return 5", () => {
      const code = "(/ 10 2)";
      const program = schemeParse(code);
      const result = interpreter.evaluate(program);
      expect(result).toBe(5);
    });

    test("nested arithmetic (+ (* 2 3) 4) should return 10", () => {
      const code = "(+ (* 2 3) 4)";
      const program = schemeParse(code);
      const result = interpreter.evaluate(program);
      expect(result).toBe(10);
    });
  });

  // ============================================================================
  // PART 2: VARIABLES AND DEFINITIONS
  // ============================================================================

  describe("Variables and Definitions", () => {
    test("(define x 5) followed by accessing x", () => {
      const defineCode = "(define x 5)";
      const defineProgram = schemeParse(defineCode);
      interpreter.evaluate(defineProgram);

      const accessCode = "x";
      const accessProgram = schemeParse(accessCode);
      const result = interpreter.evaluate(accessProgram);
      expect(result).toBe(5);
    });

    test("(define x 5) then (+ x 3) should return 8", () => {
      const defineCode = "(define x 5)";
      const defineProgram = schemeParse(defineCode);
      interpreter.evaluate(defineProgram);

      const code = "(+ x 3)";
      const program = schemeParse(code);
      const result = interpreter.evaluate(program);
      expect(result).toBe(8);
    });

    test("multiple definitions persist", () => {
      interpreter.evaluate(schemeParse("(define x 10)"));
      interpreter.evaluate(schemeParse("(define y 20)"));
      
      const result = interpreter.evaluate(schemeParse("(+ x y)"));
      expect(result).toBe(30);
    });
  });

  // ============================================================================
  // PART 3: FUNCTION DEFINITIONS
  // ============================================================================

  describe("Function Definitions", () => {
    test("(define (square x) (* x x)) then (square 5) should return 25", () => {
      const defineCode = "(define (square x) (* x x))";
      const defineProgram = schemeParse(defineCode);
      interpreter.evaluate(defineProgram);

      const callCode = "(square 5)";
      const callProgram = schemeParse(callCode);
      const result = interpreter.evaluate(callProgram);
      expect(result).toBe(25);
    });

    test("function with multiple parameters", () => {
      interpreter.evaluate(schemeParse("(define (add x y) (+ x y))"));
      const result = interpreter.evaluate(schemeParse("(add 3 7)"));
      expect(result).toBe(10);
    });

    test("nested function calls", () => {
      interpreter.evaluate(schemeParse("(define (double x) (* x 2))"));
      interpreter.evaluate(schemeParse("(define (quad x) (double (double x)))"));
      const result = interpreter.evaluate(schemeParse("(quad 3)"));
      expect(result).toBe(12);
    });
  });

  // ============================================================================
  // PART 4: CONDITIONALS
  // ============================================================================

  describe("Conditionals", () => {
    test("(if #t 1 2) should return 1", () => {
      const code = "(if #t 1 2)";
      const program = schemeParse(code);
      const result = interpreter.evaluate(program);
      expect(result).toBe(1);
    });

    test("(if #f 1 2) should return 2", () => {
      const code = "(if #f 1 2)";
      const program = schemeParse(code);
      const result = interpreter.evaluate(program);
      expect(result).toBe(2);
    });

    test("(if (> 5 3) 10 20) should return 10", () => {
      const code = "(if (> 5 3) 10 20)";
      const program = schemeParse(code);
      const result = interpreter.evaluate(program);
      expect(result).toBe(10);
    });

    test("(if (< 5 3) 10 20) should return 20", () => {
      const code = "(if (< 5 3) 10 20)";
      const program = schemeParse(code);
      const result = interpreter.evaluate(program);
      expect(result).toBe(20);
    });
  });

  // ============================================================================
  // PART 5: LAMBDAS (ANONYMOUS FUNCTIONS)
  // ============================================================================

  describe("Lambdas", () => {
    test("((lambda (x) (* x x)) 5) should return 25", () => {
      const code = "((lambda (x) (* x x)) 5)";
      const program = schemeParse(code);
      const result = interpreter.evaluate(program);
      expect(result).toBe(25);
    });

    test("((lambda (x y) (+ x y)) 3 4) should return 7", () => {
      const code = "((lambda (x y) (+ x y)) 3 4)";
      const program = schemeParse(code);
      const result = interpreter.evaluate(program);
      expect(result).toBe(7);
    });
  });

  // ============================================================================
  // PART 6: LISTS
  // ============================================================================

  describe("Lists", () => {
    test("(list 1 2 3) should return [1, 2, 3]", () => {
      const code = "(list 1 2 3)";
      const program = schemeParse(code);
      const result = interpreter.evaluate(program);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(3);
    });

    test("(car (list 1 2 3)) should return 1", () => {
      const code = "(car (list 1 2 3))";
      const program = schemeParse(code);
      const result = interpreter.evaluate(program);
      expect(result).toBe(1);
    });

    test("(cdr (list 1 2 3)) should return [2, 3]", () => {
      const code = "(cdr (list 1 2 3))";
      const program = schemeParse(code);
      const result = interpreter.evaluate(program);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
    });
  });

  // ============================================================================
  // PART 7: RECURSION
  // ============================================================================

  describe("Recursion", () => {
    test("factorial: (define (fact n) (if (= n 0) 1 (* n (fact (- n 1))))) then (fact 5)", () => {
      interpreter.evaluate(
        schemeParse("(define (fact n) (if (= n 0) 1 (* n (fact (- n 1)))))")
      );
      const result = interpreter.evaluate(schemeParse("(fact 5)"));
      expect(result).toBe(120);
    });

    test("fibonacci: (define (fib n) (if (< n 2) n (+ (fib (- n 1)) (fib (- n 2))))) then (fib 6)", () => {
      interpreter.evaluate(
        schemeParse(
          "(define (fib n) (if (< n 2) n (+ (fib (- n 1)) (fib (- n 2)))))"
        )
      );
      const result = interpreter.evaluate(schemeParse("(fib 6)"));
      expect(result).toBe(8);
    });
  });

  // ============================================================================
  // PART 8: COMPARISONS
  // ============================================================================

  describe("Comparisons", () => {
    test("(= 5 5) should return true", () => {
      const code = "(= 5 5)";
      const program = schemeParse(code);
      const result = interpreter.evaluate(program);
      expect(result).toBe(true);
    });

    test("(> 10 5) should return true", () => {
      const code = "(> 10 5)";
      const program = schemeParse(code);
      const result = interpreter.evaluate(program);
      expect(result).toBe(true);
    });

    test("(< 3 8) should return true", () => {
      const code = "(< 3 8)";
      const program = schemeParse(code);
      const result = interpreter.evaluate(program);
      expect(result).toBe(true);
    });
  });

  // ============================================================================
  // PART 9: ERROR HANDLING
  // ============================================================================

  describe("Error Handling", () => {
    test("undefined variable should throw error", () => {
      const code = "undefined_var";
      const program = schemeParse(code);
      expect(() => interpreter.evaluate(program)).toThrow(
        "Undefined variable"
      );
    });

    test("calling non-function should throw error", () => {
      const code = "(5 3)";
      const program = schemeParse(code);
      expect(() => interpreter.evaluate(program)).toThrow();
    });
  });
});

test('debug: what does schemeParse output?', () => {
  const code = '(+ 1 2)';
  const program = schemeParse(code);
  console.log('\n=== schemeParse output for (+ 1 2) ===');
  console.log(JSON.stringify(program, null, 2));
});

test('debug: what names are decoded?', () => {
  const { decode } = require('../index');
  const stdlib = require('../stdlib/base');
  
  const keys = Object.keys(stdlib);
  const decodedNames = new Map();
  
  keys.forEach(key => {
    const decoded = decode(key);
    decodedNames.set(key, decoded);
  });
  
  // Look for string->symbol and make_number
  const stringSymbolKey = keys.find(k => decode(k) === 'string->symbol');
  const makeNumberKey = keys.find(k => decode(k) === 'make-number');
  const listKey = keys.find(k => k === 'list');
  
  console.log('\nstring->symbol key:', stringSymbolKey);
  console.log('make-number key:', makeNumberKey);
  console.log('list key:', listKey);
  
  // Show first 10 decoded names
  console.log('\nFirst 10 decoded names:');
  Array.from(decodedNames.entries()).slice(0, 10).forEach(([encoded, decoded]) => {
    console.log(`  ${encoded} -> ${decoded}`);
  });
});

test('debug: trace eval', () => {
  const code = '(+ 1 2)';
  const program = schemeParse(code);
  const interpreter = new SchemeInterpreter();
  
  console.log('\n=== Before evaluate ===');
  console.log('Program:', JSON.stringify(program, null, 2).substring(0, 500));
  
  const result = interpreter.evaluate(program);
  
  console.log('\n=== After evaluate ===');
  console.log('Result type:', typeof result);
  console.log('Result:', result);
  console.log('Is array?', Array.isArray(result));
  if (Array.isArray(result)) {
    console.log('Result length:', result.length);
    console.log('Result[0]:', result[0]);
  }
});

test('debug: what does list() return?', () => {
  const stdlib = require('../stdlib/base');
  
  // Simulate what the transpiler generates
  const string_to_symbol = stdlib.string$45$$62$symbol;
  const make_number = require('../stdlib/core-math').make_number;
  const list = stdlib.list;
  
  console.log('\n=== Creating s-expression manually ===');
  console.log('string_to_symbol("+"):', string_to_symbol("+"));
  console.log('make_number("1"):', make_number("1"));
  console.log('make_number("2"):', make_number("2"));
  
  const expr = list(string_to_symbol("+"), make_number("1"), make_number("2"));
  console.log('\n=== list() result ===');
  console.log('Type:', typeof expr);
  console.log('Is array?', Array.isArray(expr));
  console.log('Value:', expr);
  console.log('expr[0]:', expr[0]);
  console.log('expr[0].sym?', expr[0]?.sym);
  console.log('JSON:', JSON.stringify(expr, null, 2).substring(0, 500));
});


test('debug: what does evalSchemeExpression receive?', () => {
  const stdlib = require('../stdlib/base');
  const SchemeInterpreter = require('../conductor/SchemeInterpreter').SchemeInterpreter;
  
  // Manually create what eval() receives
  const string_to_symbol = stdlib.string$45$$62$symbol;
  const make_number = require('../stdlib/core-math').make_number;
  const list = stdlib.list;
  
  const expr = list(string_to_symbol("+"), make_number("1"), make_number("2"));
  
  console.log('\n=== Raw pair structure ===');
  console.log('expr:', expr);
  console.log('expr.pair:', (expr as any).pair);
  console.log('expr[0]:', expr[0]);
  console.log('expr[0].sym:', expr[0]?.sym);
  
  // Now test pairToArray
  const interpreter = new SchemeInterpreter();
  // We need to call the private method, so let's test it differently
  
  // Actually, let's just check if pair conversion works
  console.log('\n=== Testing pair conversion ===');
  if (Array.isArray(expr) && (expr as any).pair === true) {
    console.log('✓ Detected as pair structure');
  } else {
    console.log('✗ NOT detected as pair structure');
  }
});


test('debug: pairToArray conversion', () => {
  const stdlib = require('../stdlib/base');
  
  const string_to_symbol = stdlib.string$45$$62$symbol;
  const make_number = require('../stdlib/core-math').make_number;
  const list = stdlib.list;
  
  const expr = list(string_to_symbol("+"), make_number("1"), make_number("2"));
  
  // Manually implement pairToArray to test
  const pairToArray = (pair: any): any[] => {
    const result: any[] = [];
    let current = pair;

    while (
      current !== null &&
      Array.isArray(current) &&
      (current as any).pair === true
    ) {
      result.push(current[0]);
      current = current[1];
    }

    if (current !== null) {
      result.push(current);
    }

    return result;
  };
  
  console.log('\n=== Original pair ===');
  console.log('expr:', expr);
  console.log('expr.length:', expr.length);
  
  const flatArray = pairToArray(expr);
  console.log('\n=== After pairToArray ===');
  console.log('flatArray:', flatArray);
  console.log('flatArray.length:', flatArray.length);
  console.log('flatArray[0]:', flatArray[0]);
  console.log('flatArray[0].sym:', flatArray[0]?.sym);
  console.log('flatArray[1]:', flatArray[1]);
  console.log('flatArray[2]:', flatArray[2]);
});