import { schemeParse } from "../index";
import { SchemeInterpreter } from "../conductor/SchemeInterpreter";

/**
 * Helper functions to validate Scheme values
 */

// Check if value is a SchemeNumber and get its numeric value
const expectSchemeNumber = (result: any, expectedValue: number) => {
  expect(result).toBeDefined();
  expect(result.numberType).toBeDefined();
  expect(typeof result.coerce).toBe("function");
  expect(result.coerce()).toBe(expectedValue);
};

// Check if value is a Scheme boolean (#t or #f)
const expectSchemeBoolean = (result: any, expectedValue: boolean) => {
  expect(result).toBe(expectedValue);
};

// Helper to convert SchemePair to flat array for testing
const schemeListToArray = (schemeList: any): any[] => {
  if (!Array.isArray(schemeList)) return [];

  const result: any[] = [];
  let current = schemeList;

  while (Array.isArray(current) && (current as any).pair === true) {
    result.push(current[0]);
    current = current[1];
  }

  if (current !== null) {
    result.push(current);
  }

  return result;
};

const expectSchemeListValues = (
  result: any,
  expectedCount: number,
  validator?: (arr: any[]) => void
) => {
  const arr = schemeListToArray(result);
  expect(arr.length).toBe(expectedCount);
  if (validator) validator(arr);
};

// Check if value is undefined (from define statements)
const expectUndefined = (result: any) => {
  expect(result).toBeUndefined();
};

// Helper to evaluate code
const evaluate = (interpreter: SchemeInterpreter, code: string) => {
  const program = schemeParse(code);
  return interpreter.evaluate(program);
};

describe("SchemeInterpreter Integration Tests", () => {
  let interpreter: SchemeInterpreter;

  beforeEach(() => {
    interpreter = new SchemeInterpreter();
  });

  // ============================================================================
  // PART 1: BASIC ARITHMETIC
  // ============================================================================

  describe("Basic Arithmetic", () => {
    test("(+ 1 2) should return SchemeNumber 3", () => {
      const result = evaluate(interpreter, "(+ 1 2)");
      expectSchemeNumber(result, 3);
    });

    test("(* 3 4) should return SchemeNumber 12", () => {
      const result = evaluate(interpreter, "(* 3 4)");
      expectSchemeNumber(result, 12);
    });

    test("(- 10 3) should return SchemeNumber 7", () => {
      const result = evaluate(interpreter, "(- 10 3)");
      expectSchemeNumber(result, 7);
    });

    test("(/ 10 2) should return SchemeNumber 5", () => {
      const result = evaluate(interpreter, "(/ 10 2)");
      expectSchemeNumber(result, 5);
    });

    test("nested arithmetic (+ (* 2 3) 4) should return SchemeNumber 10", () => {
      const result = evaluate(interpreter, "(+ (* 2 3) 4)");
      expectSchemeNumber(result, 10);
    });
  });

  // ============================================================================
  // PART 2: VARIABLES AND DEFINITIONS
  // ============================================================================

  describe("Variables and Definitions", () => {
    test("(define x 5) followed by accessing x", () => {
      evaluate(interpreter, "(define x 5)");
      const result = evaluate(interpreter, "x");
      expectSchemeNumber(result, 5);
    });

    test("(define x 5) then (+ x 3) should return 8", () => {
      evaluate(interpreter, "(define x 5)");
      const result = evaluate(interpreter, "(+ x 3)");
      expectSchemeNumber(result, 8);
    });

    test("multiple definitions persist", () => {
      evaluate(interpreter, "(define x 10)");
      evaluate(interpreter, "(define y 20)");
      const result = evaluate(interpreter, "(+ x y)");
      expectSchemeNumber(result, 30);
    });
  });

  // ============================================================================
  // PART 3: FUNCTION DEFINITIONS
  // ============================================================================

  describe("Function Definitions", () => {
    test("(define (square x) (* x x)) then (square 5) should return 25", () => {
      evaluate(interpreter, "(define (square x) (* x x))");
      const result = evaluate(interpreter, "(square 5)");
      expectSchemeNumber(result, 25);
    });

    test("function with multiple parameters", () => {
      evaluate(interpreter, "(define (add x y) (+ x y))");
      const result = evaluate(interpreter, "(add 3 7)");
      expectSchemeNumber(result, 10);
    });

    test("nested function calls", () => {
      evaluate(interpreter, "(define (double x) (* x 2))");
      evaluate(interpreter, "(define (quad x) (double (double x)))");
      const result = evaluate(interpreter, "(quad 3)");
      expectSchemeNumber(result, 12);
    });
  });

  // ============================================================================
  // PART 4: CONDITIONALS
  // ============================================================================

  describe("Conditionals", () => {
    test("(if #t 1 2) should return SchemeNumber 1", () => {
      const result = evaluate(interpreter, "(if #t 1 2)");
      expectSchemeNumber(result, 1);
    });

    test("(if #f 1 2) should return SchemeNumber 2", () => {
      const result = evaluate(interpreter, "(if #f 1 2)");
      expectSchemeNumber(result, 2);
    });

    test("(if (> 5 3) 10 20) should return SchemeNumber 10", () => {
      const result = evaluate(interpreter, "(if (> 5 3) 10 20)");
      expectSchemeNumber(result, 10);
    });

    test("(if (< 5 3) 10 20) should return SchemeNumber 20", () => {
      const result = evaluate(interpreter, "(if (< 5 3) 10 20)");
      expectSchemeNumber(result, 20);
    });
  });

  // ============================================================================
  // PART 5: LAMBDAS (ANONYMOUS FUNCTIONS)
  // ============================================================================

  describe("Lambdas", () => {
    test("((lambda (x) (* x x)) 5) should return SchemeNumber 25", () => {
      const result = evaluate(interpreter, "((lambda (x) (* x x)) 5)");
      expectSchemeNumber(result, 25);
    });

    test("((lambda (x y) (+ x y)) 3 4) should return SchemeNumber 7", () => {
      const result = evaluate(interpreter, "((lambda (x y) (+ x y)) 3 4)");
      expectSchemeNumber(result, 7);
    });
  });

  // ============================================================================
  // PART 6: LISTS
  // ============================================================================

  describe("Lists", () => {
    test("(list 1 2 3) should return list of 3 SchemeNumbers", () => {
      const result = evaluate(interpreter, "(list 1 2 3)");
      expectSchemeListValues(result, 3, arr => {
        arr.forEach((elem, i) => {
          expectSchemeNumber(elem, i + 1);
        });
      });
    });

    test("(car (list 1 2 3)) should return SchemeNumber 1", () => {
      const result = evaluate(interpreter, "(car (list 1 2 3))");
      expectSchemeNumber(result, 1);
    });

    test("(cdr (list 1 2 3)) should return list of 2 SchemeNumbers", () => {
      const result = evaluate(interpreter, "(cdr (list 1 2 3))");
      expectSchemeListValues(result, 2);
    });
  });

  // ============================================================================
  // PART 7: RECURSION
  // ============================================================================

  describe("Recursion", () => {
    test("factorial: (define (fact n) (if (= n 0) 1 (* n (fact (- n 1))))) then (fact 5)", () => {
      evaluate(
        interpreter,
        "(define (fact n) (if (= n 0) 1 (* n (fact (- n 1)))))"
      );
      const result = evaluate(interpreter, "(fact 5)");
      expectSchemeNumber(result, 120);
    });

    test("fibonacci: (define (fib n) (if (< n 2) n (+ (fib (- n 1)) (fib (- n 2))))) then (fib 6)", () => {
      evaluate(
        interpreter,
        "(define (fib n) (if (< n 2) n (+ (fib (- n 1)) (fib (- n 2)))))"
      );
      const result = evaluate(interpreter, "(fib 6)");
      expectSchemeNumber(result, 8);
    });
  });

  // ============================================================================
  // PART 8: COMPARISONS
  // ============================================================================

  describe("Comparisons", () => {
    test("(= 5 5) should return #t", () => {
      const result = evaluate(interpreter, "(= 5 5)");
      expectSchemeBoolean(result, true);
    });

    test("(> 10 5) should return #t", () => {
      const result = evaluate(interpreter, "(> 10 5)");
      expectSchemeBoolean(result, true);
    });

    test("(< 3 8) should return #t", () => {
      const result = evaluate(interpreter, "(< 3 8)");
      expectSchemeBoolean(result, true);
    });
  });

  // ============================================================================
  // PART 9: ERROR HANDLING
  // ============================================================================

  describe("Error Handling", () => {
    test("undefined variable should throw error", () => {
      expect(() => evaluate(interpreter, "undefined_var")).toThrow(
        "Undefined variable"
      );
    });

    test("calling non-function should throw error", () => {
      expect(() => evaluate(interpreter, "(5 3)")).toThrow();
    });
  });

    // ============================================================================
  // PART 10: SET! (MUTATION - CHAPTER 3)
  // ============================================================================

  describe("Set! (Mutation)", () => {
    test("basic set! mutation", () => {
      evaluate(interpreter, "(define x 1)");
      evaluate(interpreter, "(set! x 2)");
      const result = evaluate(interpreter, "x");
      expectSchemeNumber(result, 2);
    });

    test("set! with expression value", () => {
      evaluate(interpreter, "(define x 10)");
      evaluate(interpreter, "(set! x (+ x 5))");
      const result = evaluate(interpreter, "x");
      expectSchemeNumber(result, 15);
    });

    test("set! counter pattern", () => {
      evaluate(interpreter, "(define count 0)");
      evaluate(interpreter, "(define (increment) (begin (set! count (+ count 1)) count))");
      evaluate(interpreter, "(increment)");
      evaluate(interpreter, "(increment)");
      const result = evaluate(interpreter, "(increment)");
      expectSchemeNumber(result, 3);
    });

    test("set! modifies variable in outer scope", () => {
      evaluate(interpreter, "(define x 1)");
      evaluate(interpreter, "(define (mutate) (set! x 99))");
      evaluate(interpreter, "(mutate)");
      const result = evaluate(interpreter, "x");
      expectSchemeNumber(result, 99);
    });

    test("set! make-counter closure", () => {
      evaluate(interpreter, `
        (define (make-counter)
          (define n 0)
          (lambda ()
            (begin (set! n (+ n 1)) n)))
      `);
      evaluate(interpreter, "(define counter (make-counter))");
      evaluate(interpreter, "(counter)");
      evaluate(interpreter, "(counter)");
      const result = evaluate(interpreter, "(counter)");
      expectSchemeNumber(result, 3);
    });

    test("set! independent counters", () => {
      evaluate(interpreter, `
        (define (make-counter)
          (define n 0)
          (lambda ()
            (begin (set! n (+ n 1)) n)))
      `);
      evaluate(interpreter, "(define c1 (make-counter))");
      evaluate(interpreter, "(define c2 (make-counter))");
      evaluate(interpreter, "(c1)");
      evaluate(interpreter, "(c1)");
      evaluate(interpreter, "(c1)");
      const result = evaluate(interpreter, "(c2)");
      expectSchemeNumber(result, 1);
    });

    test("set! on undefined variable throws error", () => {
      expect(() => evaluate(interpreter, "(set! undefined-var 5)")).toThrow();
    });

    test("set! with boolean value", () => {
      evaluate(interpreter, "(define flag #t)");
      evaluate(interpreter, "(set! flag #f)");
      const result = evaluate(interpreter, "flag");
      expectSchemeBoolean(result, false);
    });

    test("set! does not create new variable", () => {
      expect(() => evaluate(interpreter, "(set! never-defined 42)")).toThrow();
    });
  });

});

/*

// ============================================================================
// DEBUG TESTS (Optional - can be kept for development)
// ============================================================================

test("debug: what does schemeParse output?", () => {
  const code = "(+ 1 2)";
  const program = schemeParse(code);
  console.log("\n=== schemeParse output for (+ 1 2) ===");
  console.log(JSON.stringify(program, null, 2));
});

test("debug: what names are decoded?", () => {
  const { decode } = require("../index");
  const stdlib = require("../stdlib/base");

  const keys = Object.keys(stdlib);
  const decodedNames = new Map();

  keys.forEach(key => {
    const decoded = decode(key);
    decodedNames.set(key, decoded);
  });

  // Look for string->symbol and make_number
  const stringSymbolKey = keys.find(k => decode(k) === "string->symbol");
  const makeNumberKey = keys.find(k => decode(k) === "make-number");
  const listKey = keys.find(k => k === "list");

  console.log("\nstring->symbol key:", stringSymbolKey);
  console.log("make-number key:", makeNumberKey);
  console.log("list key:", listKey);

  // Show first 10 decoded names
  console.log("\nFirst 10 decoded names:");
  Array.from(decodedNames.entries())
    .slice(0, 10)
    .forEach(([encoded, decoded]) => {
      console.log(`  ${encoded} -> ${decoded}`);
    });
});

test("debug: trace eval", () => {
  const code = "(+ 1 2)";
  const program = schemeParse(code);
  const interpreter = new SchemeInterpreter();

  console.log("\n=== Before evaluate ===");
  console.log("Program:", JSON.stringify(program, null, 2).substring(0, 500));

  const result = interpreter.evaluate(program);

  console.log("\n=== After evaluate ===");
  console.log("Result type:", typeof result);
  console.log("Result:", result);
  console.log("Is array?", Array.isArray(result));
  if (Array.isArray(result)) {
    console.log("Result length:", result.length);
    console.log("Result[0]:", result[0]);
  }
});

test("debug: what does evalSchemeExpression receive?", () => {
  const stdlib = require("../stdlib/base");
  const SchemeInterpreter =
    require("../conductor/SchemeInterpreter").SchemeInterpreter;

  // Manually create what eval() receives
  const string_to_symbol = stdlib.string$45$$62$symbol;
  const make_number = require("../stdlib/core-math").make_number;
  const list = stdlib.list;

  const expr = list(string_to_symbol("+"), make_number("1"), make_number("2"));

  console.log("\n=== Raw pair structure ===");
  console.log("expr:", expr);
  console.log("expr.pair:", (expr as any).pair);
  console.log("expr[0]:", expr[0]);
  console.log("expr[0].sym:", expr[0]?.sym);

  // Now test pairToArray
  const interpreter = new SchemeInterpreter();

  // Actually, let's just check if pair conversion works
  console.log("\n=== Testing pair conversion ===");
  if (Array.isArray(expr) && (expr as any).pair === true) {
    console.log("✓ Detected as pair structure");
  } else {
    console.log("✗ NOT detected as pair structure");
  }
});

test("debug: pairToArray conversion", () => {
  const stdlib = require("../stdlib/base");

  const string_to_symbol = stdlib.string$45$$62$symbol;
  const make_number = require("../stdlib/core-math").make_number;
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

  console.log("\n=== Original pair ===");
  console.log("expr:", expr);
  console.log("expr.length:", expr.length);

  const flatArray = pairToArray(expr);
  console.log("\n=== After pairToArray ===");
  console.log("flatArray:", flatArray);
  console.log("flatArray.length:", flatArray.length);
  console.log("flatArray[0]:", flatArray[0]);
  console.log("flatArray[0].sym:", flatArray[0]?.sym);
  console.log("flatArray[1]:", flatArray[1]);
  console.log("flatArray[2]:", flatArray[2]);
});

test("debug: full trace of (+ 1 2)", () => {
  const { schemeParse } = require("../index");
  const { SchemeInterpreter } = require("../conductor/SchemeInterpreter");
  const stdlib = require("../stdlib/base");

  const interpreter = new SchemeInterpreter();

  const code = "(+ 1 2)";
  const program = schemeParse(code);

  console.log("\n=== STEP 1: Program structure ===");
  const stmt = program.body[0];
  const callExpr = (stmt as any).expression;
  console.log("Call expression callee:", callExpr.callee.name);
  console.log("Call expression arguments count:", callExpr.arguments.length);
  console.log("First argument type:", callExpr.arguments[0].type);

  console.log("\n=== STEP 2: Evaluating ===");
  const result = interpreter.evaluate(program);

  console.log("\n=== STEP 3: Result ===");
  console.log("Result:", result);
  console.log("Result type:", typeof result);
  if (typeof result === "function") {
    console.log("Result.name:", result.name);
  }

  console.log("\n=== STEP 4: Test + directly ===");
  const plusFunc = stdlib.$43$;
  const num1 = require("../stdlib/core-math").make_number("1");
  const num2 = require("../stdlib/core-math").make_number("2");
  console.log("plusFunc:", plusFunc);
  console.log("num1:", num1);
  console.log("num2:", num2);
  const directResult = plusFunc(num1, num2);
  console.log("Direct +:", directResult);
});

test("debug: trace what evaluate() returns", () => {
  const interpreter = new SchemeInterpreter();
  const code = "(+ 1 2)";
  const program = schemeParse(code);

  console.log("\n=== Program body ===");
  console.log("program.body.length:", program.body.length);
  console.log("program.body[0]:", program.body[0]);

  const stmt = program.body[0];
  console.log("\nStatement type:", (stmt as any).type);
  console.log(
    "Is ExpressionStatement?",
    (stmt as any).type === "ExpressionStatement"
  );

  if ((stmt as any).type === "ExpressionStatement") {
    const expr = (stmt as any).expression;
    console.log("Expression type:", expr.type);
    console.log("Expression callee:", expr.callee?.name);
    console.log("Expression arguments:", expr.arguments?.length);
  }

  console.log("\n=== Calling interpreter.evaluate() ===");
  const result = interpreter.evaluate(program);

  console.log("\nResult:", result);
  console.log("Result type:", typeof result);
  console.log("Result is undefined?", result === undefined);
});

test("debug: what does schemeParse really generate?", () => {
  const code = "(+ 1 2)";
  const program = schemeParse(code);

  const stmt = program.body[0] as any;
  const callExpr = stmt.expression;

  console.log("\n=== Call expression details ===");
  console.log("Callee:", callExpr.callee.name);
  console.log("Arguments count:", callExpr.arguments.length);

  const arg = callExpr.arguments[0];
  console.log("\nFirst argument:");
  console.log("Type:", arg.type);
  console.log("Full argument:", JSON.stringify(arg, null, 2));
});

test("debug: what does list() return when called directly?", () => {
  const interpreter = new SchemeInterpreter();

  const stdlib = require("../stdlib/base");
  const list = stdlib.list;
  const string_to_symbol = stdlib.string$45$$62$symbol;
  const make_number = require("../stdlib/core-math").make_number;

  console.log("\n=== Testing list() directly ===");

  const plus = string_to_symbol("+");
  const one = make_number("1");
  const two = make_number("2");

  console.log("plus:", plus);
  console.log("one:", one);
  console.log("two:", two);

  const result = list(plus, one, two);
  console.log("\nlist(plus, one, two):", result);
  console.log("Is array?", Array.isArray(result));
  console.log("Has pair property?", (result as any).pair);
  console.log("result[0]:", result[0]);
  console.log("result[1]:", result[1]);

  // Now test what eval receives when we pass this
  const evalFunc = (schemeExpr: any) => {
    console.log("\n[EVAL] Received:", schemeExpr);
    console.log("[EVAL] Type:", typeof schemeExpr);
    console.log("[EVAL] Is array?", Array.isArray(schemeExpr));
    if (Array.isArray(schemeExpr)) {
      console.log("[EVAL] Length:", schemeExpr.length);
      console.log("[EVAL] [0]:", schemeExpr[0]);
      console.log("[EVAL] [1]:", schemeExpr[1]);
      console.log("[EVAL] pair property:", (schemeExpr as any).pair);
    }
  };

  evalFunc(result);
});

test("debug: what does (square 5) transpile to?", () => {
  const program = schemeParse("(square 5)");
  console.log("\n=== (square 5) transpilation ===");
  const stmt = program.body[0] as any;
  const callExpr = stmt.expression;
  console.log("Callee:", callExpr.callee.name);
  console.log("Arguments:", callExpr.arguments.length);
  console.log("Full:", JSON.stringify(callExpr, null, 2).substring(0, 500));
});

*/