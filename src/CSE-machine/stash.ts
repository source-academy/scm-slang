import { SchemeComplexNumber } from "./complex";

export type Value =
  | { type: "number"; value: number }
  | { type: "boolean"; value: boolean }
  | { type: "string"; value: string }
  | { type: "symbol"; value: string }
  | { type: "complex"; value: SchemeComplexNumber }
  | { type: "pair"; car: Value; cdr: Value }
  | { type: "list"; elements: Value[] }
  | { type: "vector"; elements: Value[] }
  | { type: "nil" }
  | { type: "void" }
  | { type: "closure"; params: string[]; body: any[]; env: any }
  | { type: "primitive"; name: string; func: Function }
  | { type: "error"; message: string };

export class Stash {
  private values: Value[] = [];

  push(value: Value): void {
    this.values.push(value);
  }

  pop(): Value | undefined {
    return this.values.pop();
  }

  peek(): Value | undefined {
    return this.values[this.values.length - 1];
  }

  size(): number {
    return this.values.length;
  }

  clear(): void {
    this.values = [];
  }

  getValues(): Value[] {
    return [...this.values];
  }
}
