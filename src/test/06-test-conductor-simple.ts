import { SchemeEvaluator } from "../conductor/runner/SchemeEvaluator";
import { ConductorError } from "../common/errors/ConductorError";

// Simple mock for testing
class MockConductor {
  public outputs: string[] = [];
  public errors: ConductorError[] = [];

  sendOutput(output: string): void {
    this.outputs.push(output);
  }

  sendError(error: ConductorError): void {
    this.errors.push(error);
  }

  // Mock methods that aren't used in evaluateChunk
  async requestFile(fileName: string): Promise<string | undefined> {
    return undefined;
  }

  async requestChunk(): Promise<string> {
    throw new Error("Mock chunk request");
  }

  clear(): void {
    this.outputs = [];
    this.errors = [];
  }
}

async function testSimpleConductor() {
  console.log("🧪 Testing Simple Conductor Integration");
  console.log("=======================================\n");

  const mockConductor = new MockConductor() as any;
  const evaluator = new SchemeEvaluator(mockConductor);

  const testCases = [
    { code: "42", expected: "42", description: "Number literal" },
    { code: '"hello"', expected: "hello", description: "String literal" },
    { code: "#t", expected: "#t", description: "Boolean true" },
    { code: "(+ 1 2)", expected: "3", description: "Addition" },
    { code: "3+4i", expected: "3+4i", description: "Complex number" },
    {
      code: "(+ 3+4i 1+2i)",
      expected: "4+6i",
      description: "Complex addition",
    },
    { code: "(* 2 3)", expected: "6", description: "Multiplication" },
  ];

  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    try {
      mockConductor.clear();

      // Test evaluateChunk
      await evaluator.evaluateChunk(testCase.code);

      if (mockConductor.errors.length > 0) {
        console.log(
          `❌ ${testCase.description}: ${testCase.code} -> Error: ${mockConductor.errors[0].message}`
        );
        failed++;
      } else if (mockConductor.outputs.length > 0) {
        const actualOutput = mockConductor.outputs[0];
        if (actualOutput === testCase.expected) {
          console.log(
            `✅ ${testCase.description}: ${testCase.code} -> ${actualOutput}`
          );
          passed++;
        } else {
          console.log(
            `❌ ${testCase.description}: ${testCase.code} -> ${actualOutput} (expected ${testCase.expected})`
          );
          failed++;
        }
      } else {
        console.log(
          `❌ ${testCase.description}: ${testCase.code} -> No output`
        );
        failed++;
      }
    } catch (error: any) {
      console.log(
        `❌ ${testCase.description}: ${testCase.code} -> Exception: ${error.message}`
      );
      failed++;
    }
  }

  console.log("\n📊 Simple Conductor Test Results:");
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(
    `📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`
  );

  if (failed === 0) {
    console.log("\n🎉 Conductor integration is working correctly!");
  } else {
    console.log("\n🔧 Conductor integration needs fixes");
  }

  // Test error cases
  console.log("\n🧪 Testing Error Cases:");

  const errorCases = [
    { code: '(+ 1 "hello")', description: "Type error" },
    { code: "(undefined-function)", description: "Undefined function" },
  ];

  for (const testCase of errorCases) {
    try {
      mockConductor.clear();
      await evaluator.evaluateChunk(testCase.code);

      if (mockConductor.errors.length > 0) {
        console.log(
          `✅ ${testCase.description}: ${testCase.code} -> Error correctly caught`
        );
      } else {
        console.log(
          `❌ ${testCase.description}: ${testCase.code} -> Expected error but got: ${mockConductor.outputs[0] || "no output"}`
        );
      }
    } catch (error: any) {
      console.log(
        `✅ ${testCase.description}: ${testCase.code} -> Exception correctly caught: ${error.message}`
      );
    }
  }
}

testSimpleConductor().catch(console.error);
