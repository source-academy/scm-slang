// The core library of scm-slang,
// different from the base library,
// this library contains all methods required
// for the language to function properly.

// This file contains the minimum subset
// required for delayed evaluation to work.

// forces evaluation of a thunk.
// also used for delayed evaluation.
export function force(thunk) {
    return thunk();
}