// The core library of scm-slang,
// different from the base library,
// this library contains all methods required
// for the language to function properly.

// This file contains the minimum subset
// required for lists to work.
import { pair } from "sicp";

// internal types required for list operations.
export type Pair = [any, any];
export type List = Pair | null;

// converts a vector to a list.
// needed because of the way rest parameters
// are handled in javascript.
export function vector$45$$62$list(v: any[]): List {
  if (v.length === 0) {
    return null;
  }
  return pair(v[0], vector$45$$62$list(v.slice(1)));
}
