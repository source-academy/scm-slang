import { parseSchemeSimple } from "../CSE-machine/simple-parser";
import { Atomic } from "../transpiler/types/nodes/scheme-node-types";

function testParser() {
  console.log("🧪 Testing Parser");
  console.log("================\n");

  const testCases = [
    { code: "42", expected: "NumericLiteral", description: "Number literal" },
    {
      code: '"hello"',
      expected: "StringLiteral",
      description: "String literal",
    },
    { code: "#t", expected: "BooleanLiteral", description: "Boolean true" },
    { code: "#f", expected: "BooleanLiteral", description: "Boolean false" },
    { code: "()", expected: "Nil", description: "Empty list" },
    { code: "x", expected: "Identifier", description: "Identifier" },
    {
      code: "(+ 1 2)",
      expected: "Application",
      description: "Function application",
    },
    {
      code: "(define x 5)",
      expected: "Definition",
      description: "Variable definition",
    },
    {
      code: "(if #t 1 2)",
      expected: "Conditional",
      description: "Conditional expression",
    },
    {
      code: "(lambda (x) (+ x 1))",
      expected: "Lambda",
      description: "Lambda expression",
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    try {
      const expressions = parseSchemeSimple(testCase.code);

      if (expressions.length === 0) {
        console.log(`❌ ${testCase.description}: No expressions parsed`);
        failed++;
        continue;
      }

      const firstExpr = expressions[0];
      const actualType = firstExpr.constructor.name;

      if (actualType === testCase.expected) {
        console.log(
          `✅ ${testCase.description}: ${testCase.code} -> ${actualType}`
        );
        passed++;
      } else {
        console.log(
          `❌ ${testCase.description}: ${testCase.code} -> ${actualType} (expected ${testCase.expected})`
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

  console.log("\n📊 Parser Test Results:");
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(
    `📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`
  );

  if (failed === 0) {
    console.log("\n🎉 Parser is working correctly!");
  } else {
    console.log("\n🔧 Parser needs fixes");
  }
}

testParser();
