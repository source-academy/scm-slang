// The core library of scm-slang,
// different from the base library,
// this library contains all methods required
// for the language to function properly.

import { pair, head, tail, is_list, error } from "sicp";

// important distinction between scheme truthy
// and falsy values and javascript truthy and falsy values.
// in scheme, only #f is false, everything else is true.
export function truthy(x) {
  return !(x === false);
}

// converts a vector to a list.
// needed because of the way rest parameters
// are handled in javascript.
export function vector$45$$62$list(v) {
  if (v.length === 0) {
    return null;
  }
  return pair(v[0], vector$45$$62$list(v.slice(1)));
}

// forces evaluation of a thunk.
// also used for delayed evaluation.
export function force(thunk) {
  return thunk();
}

export function apply(fun, ...args) {
  // the last argument must be a list.
  // we need to convert it into an array,
  const lastList = args.pop();
  if (!is_list(lastList)) {
    error("apply: last argument must be a list");
  }
  // convert the list into an array.
  const lastArray = [];
  let current = lastArray;
  while (current !== null) {
    lastArray.push(head(current));
    current = tail(current);
  }
  // append the array to the rest of the arguments.
  const allArgs = args.concat(lastArray);
  fun(...allArgs);
}
