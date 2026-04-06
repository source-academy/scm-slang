# scm-slang

## scm-slang?

`scm-slang` is an **experimental** implementation of the [Scheme](https://www.scheme.org/) programming language designed for compatibility with the online learning environment of [Source Academy](https://sourceacademy.org/). It aims to be faithful to the original *Structure and Interpretation of Computer Programs* (SICP) book whilst maintaining compatibility with modules designed for use with [`js-slang`](https://github.com/source-academy/js-slang), a subset of JavaScript intended for use with the SICP JS book in Source Academy.

`scm-slang` provides a special Scheme parser that is able to parse Scheme code. It also supports standard Scheme data structures such as Lists and Vectors, and a partial numeric tower (e.g. rationals and complex numbers; arbitrary-precision integers are not yet supported).

## How does it work?

`scm-slang` parses a subset of Scheme (SICP Chapters 1–3, with Chapter 3 as the full language used in Source Academy) and generates an `estree`-compatible AST. This way, `scm-slang` allows code written in SCM Source Languages to use modules written for JS Source Languages.

## Comparison with Revised⁵ Report on the Algorithmic Language Scheme

`scm-slang` is broadly aligned with the [R5RS language specification](https://schemers.org/Documents/Standards/R5RS/) of Scheme. However, there are several key deviations that differentiate `scm-slang` from a complete implementation of R5RS Scheme:

- Continuations: The parser itself does not support continuations, but in conjunction with the Source Academy Explicit Control Evaluator, continuations are supported within the Source Academy ecosystem.

- Macros: Not implemented.

- Types: `scm-slang` does not support characters or bytevectors at the moment.

- Parentheses: `scm-slang` supports the use of square brackets (i.e. []) interchangeably with parentheses in order to enhance the visual representation of Scheme code, similar to [Racket](https://racket-lang.org/) or [Guile Scheme](https://www.gnu.org/software/guile/). [See relevant discussion here](http://community.schemewiki.org/?scheme-faq-language)

- Named let is not supported.

- Import/Export: `scm-slang` follows a specialised import/export system that deviates from any standard Scheme implementation. It follows more closely to JavaScript syntax so as to maintain compatibility with current Source Academy modules.

- Output: `display` returns its argument (for debugging convenience) instead of an unspecified value.

```scheme
;equivalent JavaScript to import:
;import { stack, beside } from "runes";
(import "runes" (stack beside))
```

```scheme
;equivalent JavaScript to export:
;export let foo = "bar";
(export (define foo "bar"))
```

# Requirements

- `node`: known working version: v20.11.0 (CI uses Node 22)

# Documentation

The scm-slang language specification (Chapter 3) is published here:

- [scheme_3.pdf](https://source-academy.github.io/scm-slang/scheme_3.pdf)

# Usage

To build,

```{.}
$ git clone https://github.com/source-academy/scm-slang.git
$ cd scm-slang
$ yarn
```
