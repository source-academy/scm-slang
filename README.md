# scm-slang

## scm-slang?

`scm-slang` is an **experimental** implementation of the [Scheme](https://www.scheme.org/) programming language designed for compatibiity with the online learning environment of [Source Academy](https://sourceacademy.org/). It aims to be faithful to the original *Structure and Interpretation of Computer Programs* (SICP) book whilst maintaining compatibility with modules designed for use with [`js-slang`](https://github.com/source-academy/js-slang), a subset of JavaScript intended for use with the SICP JS book in Source Academy.

## How does it work?

`scm-slang` parses a subset of Scheme (minimally, enough to fulfil SICP chapters 1-4) and generates an `estree`-compatible AST. This way, `scm-slang` allows code written in SCM Source Languages to use modules written for JS Source Languages.

## Comparison with Revised⁷ Report on the Algorithmic Language Scheme

`scm-slang` is designed following the [R7RS language specification](https://small.r7rs.org/) of Scheme. However, there are several key deviations that differentiate `scm-slang` from a complete implementation of R7RS Scheme:

- Continuations: Continuations do not currently have first-class status in Source. Hence, procedures such as `call/cc`, which operate on continuations, are not yet implemented.

- Numerical types: `scm-slang` does not support complex numbers.

- Parentheses: `scm-slang` supports the use of square brackets (i.e. []) interchangably with parentheses in order to enhance the visual representation of Scheme code, similar to [Racket](https://racket-lang.org/) or [Guile Scheme](https://www.gnu.org/software/guile/). [See relevant discussion here](http://community.schemewiki.org/?scheme-faq-language)

- Import/Export: `scm-slang` follows a specialised import/export system that deviates from any standard Scheme implementation.

```scheme
;equivaent JavaScript to import:
;import { stack, beside } from "runes";
(import "runes" (stack beside))
```

```scheme
;equivaent JavaScript to export:
;export let foo = "bar";
(export (define foo "bar"))
```

# Requirements

- `node`: known working version: v16.19.0

# Usage

To build,

```{.}
$ git clone https://github.com/source-academy/scm-slang.git
$ cd scm-slang
$ yarn
```