import { Value } from "./stash";
import { SchemeComplexNumber } from "./complex";

// Helper functions for numeric operations
function isNumericValue(value: Value): boolean {
  return value.type === "number" || value.type === "complex";
}

function toComplexNumber(value: Value): SchemeComplexNumber {
  if (value.type === "number") {
    return SchemeComplexNumber.fromNumber(value.value);
  } else if (value.type === "complex") {
    return value.value;
  } else {
    throw new Error(`Cannot convert ${value.type} to complex number`);
  }
}

function complexValueToResult(complex: SchemeComplexNumber): Value {
  // If purely real, return as number
  if (complex.imag === 0) {
    return { type: "number", value: complex.real };
  }
  return { type: "complex", value: complex };
}

export const primitives: Record<string, (...args: Value[]) => Value> = {
  // Arithmetic operations
  "+": (...args: Value[]) => {
    if (args.length === 0) return { type: "number", value: 0 };

    // Check if all args are numeric (number or complex)
    if (!args.every(isNumericValue)) {
      throw new Error("+ requires numeric arguments");
    }

    // Convert all to complex and add
    const complexNumbers = args.map(toComplexNumber);
    const result = complexNumbers.reduce(
      (acc, curr) => acc.add(curr),
      SchemeComplexNumber.fromNumber(0)
    );
    return complexValueToResult(result);
  },

  "*": (...args: Value[]) => {
    if (args.length === 0) return { type: "number", value: 1 };

    if (!args.every(isNumericValue)) {
      throw new Error("* requires numeric arguments");
    }

    const complexNumbers = args.map(toComplexNumber);
    const result = complexNumbers.reduce(
      (acc, curr) => acc.mul(curr),
      SchemeComplexNumber.fromNumber(1)
    );
    return complexValueToResult(result);
  },

  "-": (...args: Value[]) => {
    if (args.length === 0)
      throw new Error("Subtraction requires at least one argument");

    if (!args.every(isNumericValue)) {
      throw new Error("- requires numeric arguments");
    }

    const complexNumbers = args.map(toComplexNumber);
    const result =
      args.length === 1
        ? complexNumbers[0].negate()
        : complexNumbers.reduce((acc, curr) => acc.sub(curr));
    return complexValueToResult(result);
  },

  "/": (...args: Value[]) => {
    if (args.length === 0)
      throw new Error("Division requires at least one argument");

    if (!args.every(isNumericValue)) {
      throw new Error("/ requires numeric arguments");
    }

    const complexNumbers = args.map(toComplexNumber);
    const result =
      args.length === 1
        ? SchemeComplexNumber.fromNumber(1).div(complexNumbers[0])
        : complexNumbers.reduce((acc, curr) => acc.div(curr));
    return complexValueToResult(result);
  },

  // Comparison operations
  "=": (a: Value, b: Value) => {
    if (a.type !== b.type) return { type: "boolean", value: false };
    if (a.type === "number" && b.type === "number") {
      return { type: "boolean", value: a.value === b.value };
    }
    if (a.type === "string" && b.type === "string") {
      return { type: "boolean", value: a.value === b.value };
    }
    if (a.type === "boolean" && b.type === "boolean") {
      return { type: "boolean", value: a.value === b.value };
    }
    return { type: "boolean", value: false };
  },

  ">": (a: Value, b: Value) => {
    if (a.type !== "number" || b.type !== "number") {
      throw new Error("> requires numbers");
    }
    return { type: "boolean", value: a.value > b.value };
  },

  "<": (a: Value, b: Value) => {
    if (a.type !== "number" || b.type !== "number") {
      throw new Error("< requires numbers");
    }
    return { type: "boolean", value: a.value < b.value };
  },

  ">=": (a: Value, b: Value) => {
    if (a.type !== "number" || b.type !== "number") {
      throw new Error(">= requires numbers");
    }
    return { type: "boolean", value: a.value >= b.value };
  },

  "<=": (a: Value, b: Value) => {
    if (a.type !== "number" || b.type !== "number") {
      throw new Error("<= requires numbers");
    }
    return { type: "boolean", value: a.value <= b.value };
  },

  // Logical operations
  not: (x: Value) => {
    if (x.type === "boolean") {
      return { type: "boolean", value: !x.value };
    }
    return { type: "boolean", value: false };
  },

  and: (...args: Value[]) => {
    for (const arg of args) {
      if (arg.type === "boolean" && !arg.value) {
        return { type: "boolean", value: false };
      }
    }
    return { type: "boolean", value: true };
  },

  or: (...args: Value[]) => {
    for (const arg of args) {
      if (arg.type === "boolean" && arg.value) {
        return { type: "boolean", value: true };
      }
    }
    return { type: "boolean", value: false };
  },

  // List operations
  cons: (car: Value, cdr: Value) => {
    return { type: "pair", car, cdr };
  },

  car: (pair: Value) => {
    if (pair.type !== "pair") {
      throw new Error("car requires a pair");
    }
    return pair.car;
  },

  cdr: (pair: Value) => {
    if (pair.type !== "pair") {
      throw new Error("cdr requires a pair");
    }
    return pair.cdr;
  },

  list: (...args: Value[]) => {
    return { type: "list", elements: args };
  },

  // Type predicates
  "null?": (value: Value) => {
    return { type: "boolean", value: value.type === "nil" };
  },

  "pair?": (value: Value) => {
    return { type: "boolean", value: value.type === "pair" };
  },

  "list?": (value: Value) => {
    return { type: "boolean", value: value.type === "list" };
  },

  "number?": (value: Value) => {
    return { type: "boolean", value: value.type === "number" };
  },

  "string?": (value: Value) => {
    return { type: "boolean", value: value.type === "string" };
  },

  "boolean?": (value: Value) => {
    return { type: "boolean", value: value.type === "boolean" };
  },

  "symbol?": (value: Value) => {
    return { type: "boolean", value: value.type === "symbol" };
  },
};
