import { parseSchemeSimple } from "../CSE-machine/simple-parser";
import { evaluate, Context } from "../CSE-machine/interpreter";
import { createProgramEnvironment } from "../CSE-machine/environment";
import { Stash } from "../CSE-machine/stash";
import { Control } from "../CSE-machine/control";

function testCSEBasic() {
  console.log("🧪 Testing CSE Machine - Basic Expressions");
  console.log("==========================================\n");

  const testCases = [
    {
      code: "42",
      expected: { type: "number", value: 42 },
      description: "Number literal",
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
  ];

  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    try {
      const context: Context = {
        control: new Control(),
        stash: new Stash(),
        environment: createProgramEnvironment(),
        runtime: { isRunning: true },
      };

      const expressions = parseSchemeSimple(testCase.code);
      const result = evaluate(testCase.code, expressions, context);

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

  console.log("\n📊 Basic CSE Test Results:");
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(
    `📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`
  );

  if (failed === 0) {
    console.log("\n🎉 Basic CSE machine is working correctly!");
  } else {
    console.log("\n🔧 Basic CSE machine needs fixes");
  }
}

testCSEBasic();
