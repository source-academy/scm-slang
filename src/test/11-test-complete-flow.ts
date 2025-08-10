import { parseSchemeSimple } from "../CSE-machine/simple-parser";
import { evaluate, Context } from "../CSE-machine/interpreter";
import { createProgramEnvironment } from "../CSE-machine/environment";
import { Stash } from "../CSE-machine/stash";
import { Control } from "../CSE-machine/control";

function testCompleteFlow() {
  console.log("🧪 Testing Complete Evaluation Flow - Scheme Chapter 1");
  console.log("=====================================================\n");

  const testCases = [
    // Basic literals
    {
      code: "42",
      expected: { type: "number", value: 42 },
      description: "Number literal",
    },
    {
      code: "3.14",
      expected: { type: "number", value: 3.14 },
      description: "Float literal",
    },
    {
      code: '"hello"',
      expected: { type: "string", value: "hello" },
      description: "String literal",
    },
    {
      code: "#t",
      expected: { type: "boolean", value: true },
      description: "Boolean true",
    },
    {
      code: "#f",
      expected: { type: "boolean", value: false },
      description: "Boolean false",
    },
    { code: "()", expected: { type: "nil" }, description: "Empty list" },

    // Complex numbers
    {
      code: "3+4i",
      expected: { type: "complex", value: { real: 3, imag: 4 } },
      description: "Complex number",
    },
    {
      code: "(+ 3+4i 1+2i)",
      expected: { type: "complex", value: { real: 4, imag: 6 } },
      description: "Complex addition",
    },

    // Basic arithmetic
    {
      code: "(+ 1 2)",
      expected: { type: "number", value: 3 },
      description: "Addition",
    },
    {
      code: "(* 3 4)",
      expected: { type: "number", value: 12 },
      description: "Multiplication",
    },
    {
      code: "(- 10 3)",
      expected: { type: "number", value: 7 },
      description: "Subtraction",
    },
    {
      code: "(/ 15 3)",
      expected: { type: "number", value: 5 },
      description: "Division",
    },

    // Comparison operations
    {
      code: "(> 5 3)",
      expected: { type: "boolean", value: true },
      description: "Greater than",
    },
    {
      code: "(< 2 4)",
      expected: { type: "boolean", value: true },
      description: "Less than",
    },
    {
      code: "(= 5 5)",
      expected: { type: "boolean", value: true },
      description: "Equal",
    },
    {
      code: "(>= 5 5)",
      expected: { type: "boolean", value: true },
      description: "Greater or equal",
    },
    {
      code: "(<= 3 5)",
      expected: { type: "boolean", value: true },
      description: "Less or equal",
    },

    // Variable declarations (Chapter 1 feature)
    {
      code: "(define x 10)",
      expected: { type: "void" },
      description: "Variable declaration",
    },
    {
      code: "(define y (+ 5 3))",
      expected: { type: "void" },
      description: "Variable declaration with expression",
    },

    // Variable usage (Chapter 1 feature)
    {
      code: "x",
      expected: { type: "number", value: 10 },
      description: "Variable usage",
    },
    {
      code: "y",
      expected: { type: "number", value: 8 },
      description: "Variable usage with expression",
    },

    // Function definitions (Chapter 1 feature)
    {
      code: "(define (square x) (* x x))",
      expected: { type: "void" },
      description: "Function definition",
    },
    {
      code: "(define (add x y) (+ x y))",
      expected: { type: "void" },
      description: "Function definition with multiple parameters",
    },

    // Function calls (Chapter 1 feature)
    {
      code: "(square 5)",
      expected: { type: "number", value: 25 },
      description: "Function call",
    },
    {
      code: "(add 3 4)",
      expected: { type: "number", value: 7 },
      description: "Function call with multiple parameters",
    },

    // Conditional expressions (Chapter 1 feature)
    {
      code: '(if (> 5 3) "yes" "no")',
      expected: { type: "string", value: "yes" },
      description: "If expression true",
    },
    {
      code: '(if (< 2 1) "yes" "no")',
      expected: { type: "string", value: "no" },
      description: "If expression false",
    },

    // List operations (Chapter 1 feature)
    {
      code: "(cons 1 ())",
      expected: {
        type: "pair",
        car: { type: "number", value: 1 },
        cdr: { type: "nil" },
      },
      description: "Cons operation",
    },
    {
      code: "(car (cons 1 2))",
      expected: { type: "number", value: 1 },
      description: "Car operation",
    },
    {
      code: "(cdr (cons 1 2))",
      expected: { type: "number", value: 2 },
      description: "Cdr operation",
    },

    // Boolean operations (Chapter 1 feature)
    {
      code: "(and #t #t)",
      expected: { type: "boolean", value: true },
      description: "And operation true",
    },
    {
      code: "(and #t #f)",
      expected: { type: "boolean", value: false },
      description: "And operation false",
    },
    {
      code: "(or #f #t)",
      expected: { type: "boolean", value: true },
      description: "Or operation true",
    },
    {
      code: "(not #f)",
      expected: { type: "boolean", value: true },
      description: "Not operation",
    },

    // Built-in functions (Chapter 1 feature)
    {
      code: "(abs -5)",
      expected: { type: "number", value: 5 },
      description: "Absolute value",
    },
    {
      code: "(max 3 7 2)",
      expected: { type: "number", value: 7 },
      description: "Maximum value",
    },
    {
      code: "(min 3 7 2)",
      expected: { type: "number", value: 2 },
      description: "Minimum value",
    },

    // Type predicates (Chapter 1 feature)
    {
      code: "(number? 42)",
      expected: { type: "boolean", value: true },
      description: "Number predicate",
    },
    {
      code: '(string? "hello")',
      expected: { type: "boolean", value: true },
      description: "String predicate",
    },
    {
      code: "(boolean? #t)",
      expected: { type: "boolean", value: true },
      description: "Boolean predicate",
    },
    {
      code: "(null? ())",
      expected: { type: "boolean", value: true },
      description: "Null predicate",
    },
    {
      code: "(pair? (cons 1 2))",
      expected: { type: "boolean", value: true },
      description: "Pair predicate",
    },
  ];

  let passed = 0;
  let failed = 0;
  let environment = createProgramEnvironment();

  for (const testCase of testCases) {
    try {
      const context: Context = {
        control: new Control(),
        stash: new Stash(),
        environment: environment,
        runtime: { isRunning: true },
      };

      const expressions = parseSchemeSimple(testCase.code);
      const result = evaluate(testCase.code, expressions, context);

      // Update environment for next test
      environment = context.environment;

      const success =
        JSON.stringify(result) === JSON.stringify(testCase.expected);

      if (success) {
        console.log(
          `✅ ${testCase.description}: ${testCase.code} -> ${JSON.stringify(result)}`
        );
        passed++;
      } else {
        console.log(
          `❌ ${testCase.description}: ${testCase.code} -> ${JSON.stringify(result)} (expected ${JSON.stringify(testCase.expected)})`
        );
        failed++;
      }
    } catch (error: any) {
      console.log(
        `❌ ${testCase.description}: ${testCase.code} -> ERROR: ${error.message}`
      );
      failed++;
    }
  }

  console.log("\n📊 Complete Flow Test Results:");
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(
    `📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`
  );

  if (failed === 0) {
    console.log("\n🎉 All Scheme Chapter 1 features are working correctly!");
  } else {
    console.log("\n🔧 Some features need fixes");
  }

  console.log("\n📋 Scheme Chapter 1 Features Tested:");
  console.log("✅ Basic literals (numbers, strings, booleans, lists)");
  console.log("✅ Complex numbers");
  console.log("✅ Arithmetic operations (+, -, *, /)");
  console.log("✅ Comparison operations (>, <, =, >=, <=)");
  console.log("✅ Variable declarations (define)");
  console.log("✅ Variable usage");
  console.log("✅ Function definitions");
  console.log("✅ Function calls");
  console.log("✅ Conditional expressions (if)");
  console.log("✅ List operations (cons, car, cdr)");
  console.log("✅ Boolean operations (and, or, not)");
  console.log("✅ Built-in functions (abs, max, min)");
  console.log("✅ Type predicates (number?, string?, boolean?, null?, pair?)");
}

testCompleteFlow();
