# scm-slang

## scm-slang?

`scm-slang` is an **experimental** implementation of the [Scheme Language](https://www.scheme.org/) designed for compatibiity with the online learning environment of Source Academy. It aims to be faithful to the original SICP book whilst maintaining compatibility with newer modules designed for SICP JS in Source Academy.

## How does it work?

`scm-slang` parses a subset of Scheme (minimally, enough to fulfil SICP chapters 1-4) and generates an `estree`-compatible AST. This way, `scm-slang` allows code written in SCM Source Languages to use modules written for JS Source Languages.

## Comparison with R7RS Scheme

`scm-slang` is designed following the [R7RS language specification](https://small.r7rs.org/) of Scheme. However, there are several key differences that differentiate `scm-slang` from a complete implementation of R7RS Scheme:

- Continuations: Continuations do not currently have first-class status in Source (as of 12-03-2023). Hence, procedures such as `call/cc`, which operate on continuations, are not implemented.

- Numerical types: `scm-slang` does not support complex numbers.

- Parentheses: `scm-slang` supports the use of square brackets (i.e. []) interchangably with parentheses in order to enhance the visual representation of Scheme code, similar to [Racket](https://racket-lang.org/) or [Guile Scheme](https://www.gnu.org/software/guile/). [See relevant discussion here](http://community.schemewiki.org/?scheme-faq-language)

# Requirements

- node: known working version: v16.19.0

# Usage

To build,

```{.}
$ git clone https://github.com/source-academy/scm-slang.git
$ cd scm-slang
$ yarn
```