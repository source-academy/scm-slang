import type { CseContext } from "../cse-machine/context";
import { runInContext } from "../runner/schemeRunner";

describe("Scheme output formatting", () => {
  let context: CseContext | undefined;

  beforeEach(() => {
    context = undefined;
  });

  const evaluate = async (code: string) => {
    const result = await runInContext(code, context, { chapter: 3 });
    context = result.context as CseContext;
    if (result.status !== "finished") {
      throw new Error("Unexpected suspended evaluation in test");
    }
    return result;
  };

  test("formats Scheme numbers via coerce()", async () => {
    const result = await evaluate("(+ 1 2)");
    expect(result.representation.toString(result.value)).toBe("3");
  });

  test("formats proper lists", async () => {
    const result = await evaluate("(list 1 2 3)");
    expect(result.representation.toString(result.value)).toBe("(1 2 3)");
  });

  test("formats dotted lists", async () => {
    const result = await evaluate("(list* 1 2 3)");
    expect(result.representation.toString(result.value)).toBe("(1 2 . 3)");
  });

  test("formats symbols", async () => {
    const result = await evaluate("(car '(a b))");
    expect(result.representation.toString(result.value)).toBe("a");
  });

  test("formats vectors", async () => {
    const result = await evaluate("#(1 2 3)");
    expect(result.representation.toString(result.value)).toBe("#(1 2 3)");
  });

  test("formats booleans", async () => {
    const resultTrue = await evaluate("#t");
    const resultFalse = await evaluate("#f");
    expect(resultTrue.representation.toString(resultTrue.value)).toBe("#t");
    expect(resultFalse.representation.toString(resultFalse.value)).toBe("#f");
  });
});
