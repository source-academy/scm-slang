// The core library of scm-slang,
// different from the base library,
// this library contains all methods required
// for the language to function properly.

// This file contains the minimum subset for functions/procedures to work.

import { head, tail, is_list, error } from "sicp";

export function apply(fun, ...args) {
  // the last argument must be a list.
  // we need to convert it into an array,
  const lastList = args.pop();
  if (!is_list(lastList)) {
    error("apply: last argument must be a list");
  }
  // convert the list into an array.
  const lastArray: any[] = [];
  let current = lastList;
  while (current !== null) {
    lastArray.push(head(current));
    current = tail(current);
  }
  // append the array to the rest of the arguments.
  const allArgs = args.concat(lastArray);
  fun(...allArgs);
}
