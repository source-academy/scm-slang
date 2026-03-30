/**
 * Runtime types for scm-slang evaluation
 */

import * as es from "estree";

/**
 * A value at runtime. In scm-slang, values can be:
 * - Primitives (numbers, strings, booleans, symbols)
 * - Lists (cons pairs)
 * - Functions (closures)
 * - Objects (vectors, records)
 */
export type Value = any;

// TODO: Replace with actual Context type from cse-machine/context when available.
export type Context = any;

/**
 * Result of evaluating a chunk. One of three states:
 * - Finished: evaluation completed (success or error)
 * - SuspendedCseEval: evaluation paused (for step-by-step debugging)
 */
export type Result = Finished | SuspendedCseEval;

/**
 * Finished evaluation result
 */
export interface Finished {
  status: "finished";
  context: Context;
  value: Value;
  representation: Representation;
}

/**
 * Suspended evaluation (for step-by-step debugging, future feature)
 */
export interface SuspendedCseEval {
  status: "suspended-cse-eval";
  context: Context;
}

/**
 * Handles Scheme-specific value formatting for display.
 *
 * Examples:
 * - #t / #f for booleans
 * - () for empty list
 * - (1 2 3) for proper list
 * - #<procedure> for functions
 */
export class Representation {
  private formatter: (value: any) => string;

  constructor(representation: string | ((value: any) => string)) {
    this.formatter =
      typeof representation === "string"
        ? () => representation
        : representation;
  }

  /**
   * Convert a value to its display representation.
   * Currently just returns the representation string.
   * In the future, could use stdlib's display function.
   */
  toString(value: any): string {
    return this.formatter(value);
  }
}

/**
 * Storage for native/built-in functions and modules.
 * Populated by the CSE machine's initialization.
 */
export interface NativeStorage {
  /** Built-in functions (car, cdr, cons, etc.) */
  builtins: Map<string, Value>;

  /** Identifiers defined in previous programs */
  previousProgramsIdentifiers: Set<string>;

  /** Operators for evaluation */
  operators: Map<string, (...operands: Value[]) => Value>;

  /** Max execution time (milliseconds) */
  maxExecTime: number;

  /** Loaded modules */
  loadedModules: Record<string, any>;

  /** Type information for modules */
  loadedModuleTypes: Record<string, Record<string, string>>;
}

/**
 * Recursively make properties partial (for flexible option types)
 */
export type RecursivePartial<T> =
  T extends Array<any>
    ? Array<RecursivePartial<T[number]>>
    : T extends Record<any, any>
      ? Partial<{
          [K in keyof T]: RecursivePartial<T[K]>;
        }>
      : T;
