import { schemeParse } from "../index.js";

test("transpiler + interpreter: simple arithmetic", () => {
  const code = "(+ 1 2)";
  const program = schemeParse(code);
  console.log("=== Test: (+ 1 2) ===");
  console.log(JSON.stringify(program, null, 2));
  expect(program.type).toBe("Program");
});

test("transpiler + interpreter: variable definition", () => {
  const code = "(define x 42)";
  const program = schemeParse(code);
  console.log("\n=== Test: (define x 42) ===");
  console.log(JSON.stringify(program, null, 2));
  expect(program.type).toBe("Program");
});

test("transpiler + interpreter: lambda", () => {
  const code = "(lambda (x) (* x x))";
  const program = schemeParse(code);
  console.log("\n=== Test: (lambda (x) (* x x)) ===");
  console.log(JSON.stringify(program, null, 2));
  expect(program.type).toBe("Program");
});

test("transpiler + interpreter: conditional", () => {
  const code = "(if (> 5 3) 10 20)";
  const program = schemeParse(code);
  console.log("\n=== Test: (if (> 5 3) 10 20) ===");
  console.log(JSON.stringify(program, null, 2));
  expect(program.type).toBe("Program");
});

test("interpreter: arithmetic (+ 1 2)", () => {
  const { SchemeInterpreter } = require("../conductor/SchemeInterpreter");
  const interpreter = new SchemeInterpreter();

  const code = "(+ 1 2)";
  const program = schemeParse(code);

  console.log("\n=== Evaluating: (+ 1 2) ===");
  try {
    const result = interpreter.evaluate(program);
    console.log("Result:", result);
    expect(result).toBeDefined();
  } catch (error) {
    console.log("Error:", error);
    throw error;
  }
});

test("debug: what exports are available?", () => {
  const stdlib = require("../stdlib/base");

  console.log("\n=== Available stdlib exports ===");
  const keys = Object.keys(stdlib).sort();

  // Show all keys
  console.log("Total exports:", keys.length);
  console.log("First 30 keys:", keys.slice(0, 30));

  // Look for string symbol and list
  const stringSymbolKey = keys.find(k => k.includes("string"));
  const listKey = keys.find(k => k === "list");

  console.log("String-related key:", stringSymbolKey);
  console.log("List key:", listKey);

  expect(listKey).toBeDefined();
});
