import type { CseContext } from "../cse-machine/context.js";
import { runInContext } from "../runner/schemeRunner.js";

const expectSchemeNumber = (result: any, expectedValue: number) => {
  expect(result).toBeDefined();
  expect(result.numberType).toBeDefined();
  expect(typeof result.coerce).toBe("function");
  expect(result.coerce()).toBe(expectedValue);
};

const expectSchemeBoolean = (result: any, expectedValue: boolean) => {
  expect(result).toBe(expectedValue);
};

describe("CSE Machine Special Forms", () => {
  let context: CseContext | undefined;

  beforeEach(() => {
    context = undefined;
  });

  const evaluate = async (code: string) => {
    const result = await runInContext(code, context, {});
    context = result.context as CseContext;
    if (result.status !== "finished") {
      throw new Error("Unexpected suspended evaluation in test");
    }
    return result.value;
  };

  test("let binds variables and evaluates body", async () => {
    const result = await evaluate("(let ((x 1) (y 2)) (+ x y))");
    expectSchemeNumber(result, 3);
  });

  test("cond selects first matching clause", async () => {
    const result = await evaluate("(cond ((> 2 3) 1) ((< 2 3) 4) (else 9))");
    expectSchemeNumber(result, 4);
  });

  test("quote preserves symbols", async () => {
    const result = await evaluate("(car '(a b))");
    expect(result).toBeDefined();
    expect(result.sym).toBe("a");
  });

  test("quasiquote with unquote evaluates embedded expression", async () => {
    const result = await evaluate("(begin (define x 5) (car (cdr `(1 ,x 3))))");
    expectSchemeNumber(result, 5);
  });

  test("and short-circuits to false", async () => {
    const result = await evaluate("(and #t #f 1)");
    expectSchemeBoolean(result, false);
  });

  test("or returns first truthy value", async () => {
    const result = await evaluate("(or #f 0 #f)");
    expectSchemeNumber(result, 0);
  });

  test("begin evaluates expressions in order and returns last", async () => {
    const result = await evaluate("(begin (define x 1) (define y 2) (+ x y))");
    expectSchemeNumber(result, 3);
  });

  test("set! mutates existing bindings", async () => {
    const result = await evaluate("(begin (define x 1) (set! x 4) x)");
    expectSchemeNumber(result, 4);
  });

  test("lambda application works", async () => {
    const result = await evaluate("((lambda (x) (+ x 1)) 4)");
    expectSchemeNumber(result, 5);
  });

  test("lambda closures retain state with set!", async () => {
    const result = await evaluate(
      `(begin
         (define (make-counter)
           (define n 0)
           (lambda () (begin (set! n (+ n 1)) n)))
         (define c (make-counter))
         (c)
         (c)
         (c))`
    );
    expectSchemeNumber(result, 3);
  });
});
