import { SchemeParser } from "../scheme-parser";
import { SchemeLexer } from "../../lexer";
import { Expression } from "../../types/nodes/scheme-node-types";

// Unfortunately, we are currently unable to test the parser in isolation from the
// lexer, as the parser depends on the lexer to generate tokens. Generating the tokens
// manually would be a lot of work and would duplicate the lexer logic.
// As a result, we will have to test the parser in conjunction with the lexer.
// We will avoid testing the more advanced features of the lexer here.

function parse(input: string, chapter: number = Infinity): Expression[] {
  const lexer = new SchemeLexer(input);
  const parser = new SchemeParser(input, lexer.scanTokens(), chapter);
  return parser.parse();
}

// Additionally, with the way the parser is currently implemented, it is difficult to
// test for equality of the parsed expressions. Unfortunately, we will currently test for the
// LACK of erroneous behavior, rather than the presence of correct behavior.
test("does not throw on parsing empty program", () => {
  expect(() => parse("")).not.toThrow();
});

test("does not throw on parsing literals", () => {
  expect(() => parse("1")).not.toThrow();
  expect(() => parse("1.0")).not.toThrow();
  expect(() => parse('"hello"')).not.toThrow();
  expect(() => parse("#t")).not.toThrow();
  expect(() => parse("#f")).not.toThrow();
});

test("does not throw on parsing identifiers", () => {
  expect(() => parse("hello")).not.toThrow();
  expect(() => parse("hello-world")).not.toThrow();
  expect(() => parse("hello?")).not.toThrow();
  expect(() => parse("hello-world!")).not.toThrow();
});

test("does not throw on parsing normal lambda functions", () => {
  expect(() => parse("(lambda (x) x)")).not.toThrow();
  expect(() => parse("(lambda (x y) x)")).not.toThrow();
  expect(() => parse("(lambda (x y z) x)")).not.toThrow();
});

test("does not throw on parsing variadic lambda functions", () => {
  expect(() => parse("(lambda x x)")).not.toThrow();
  expect(() => parse("(lambda (x . y) x)")).not.toThrow();
  expect(() => parse("(lambda (x y . z) x)")).not.toThrow();
});

test("does not throw on parsing functions with body", () => {
  expect(() => parse("(lambda (x) x x)")).not.toThrow();
  expect(() => parse("(lambda (x y) x y)")).not.toThrow();
  expect(() => parse("(lambda (x y z) x y z)")).not.toThrow();
});

test("does not throw on parsing definitions", () => {
  expect(() => parse("(define x 1)")).not.toThrow();
  expect(() => parse("(define x 1.0)")).not.toThrow();
  expect(() => parse('(define x "hello")')).not.toThrow();
  expect(() => parse("(define x #t)")).not.toThrow();
  expect(() => parse("(define x #f)")).not.toThrow();
  expect(() => parse("(define x (lambda (x) x))")).not.toThrow();
});

test("does not throw on parsing function definitions", () => {
  expect(() => parse("(define (f x) x)")).not.toThrow();
  expect(() => parse("(define (f x y) x y)")).not.toThrow();
  expect(() => parse("(define (f x y z) x y z)")).not.toThrow();
});

test("does not throw on parsing function applications", () => {
  expect(() => parse("(f)")).not.toThrow();
  expect(() => parse("(f x)")).not.toThrow();
  expect(() => parse("(f x y)")).not.toThrow();
  expect(() => parse("(f x y z)")).not.toThrow();
});

test("does not throw on parsing conditionals", () => {
  expect(() => parse("(if #t 1 2)")).not.toThrow();
  expect(() => parse("(if #f 1 2)")).not.toThrow();
  expect(() => parse("(if #t 1)")).not.toThrow();
  expect(() => parse("(if #f 1)")).not.toThrow();
});

test("does not throw on parsing quoted literals and identifiers", () => {
  expect(() => parse("'1")).not.toThrow();
  expect(() => parse("'1.0")).not.toThrow();
  expect(() => parse('\'"hello"')).not.toThrow();
  expect(() => parse("'hello")).not.toThrow();
});

test("does not throw on quoted vectors", () => {
  expect(() => parse("'#(1 2 3)")).not.toThrow();
  expect(() => parse("'#(1 2 3 4)")).not.toThrow();
  expect(() => parse("'#(1 testy 3 4 5)")).not.toThrow();
});

test("does not throw on parsing quotations in lists", () => {
  expect(() => parse("'(1 2 3)")).not.toThrow();
  expect(() => parse('\'("1" (2 3) 4)')).not.toThrow();
  expect(() => parse("'(1 (2 (3 will-this be a symbol)) 5)")).not.toThrow();
});

test("does not throw when evaluating the empty list", () => {
  expect(() => parse("'()")).not.toThrow();
});

test("does not throw on parsing dotted lists", () => {
  expect(() => parse("'(1 . 2)")).not.toThrow();
  expect(() => parse("'(1 2 . 3)")).not.toThrow();
  expect(() => parse("'(1 2 3 . 4)")).not.toThrow();
});

test("does not throw on parsing nested dotted lists", () => {
  expect(() => parse("'(1 . (2 . 3))")).not.toThrow();
  expect(() => parse("'(1 2 . (3 . 4))")).not.toThrow();
  expect(() => parse("'((1 2 . 3) 2 3 . (4 . 5))")).not.toThrow();
});

test("does not throw on parsing nested lists", () => {
  expect(() => parse("'(1 (2 3) 4)")).not.toThrow();
  expect(() => parse("'(1 (2 (3 4)) 5)")).not.toThrow();
  expect(() => parse("'((1 2 (3 4)) 2 3 (4 5))")).not.toThrow();
});

test("does not throw on parsing quasiquoted lists", () => {
  expect(() => parse("`(1 2 3)")).not.toThrow();
  expect(() => parse("`(1 (2 ,(+ 1 2)) 4)")).not.toThrow();
  expect(() => parse("`(1 (,a (3 4)) 5)")).not.toThrow();
});

/*
test("does not throw on parsing quasiquoted structures with unquote-splicing", () => {
  expect(() => parse("`(1 2 ,@a 4)")).not.toThrow();
  expect(() => parse("`(1 (2 ,@a) 5)")).not.toThrow();
  expect(() => parse("`(1 ,@(list 1 2 3) 3 4)")).not.toThrow();
});
 */

test("does not throw on parsing reassignments", () => {
  expect(() => parse("(set! x 1)")).not.toThrow();
  expect(() => parse("(set! x 1.0)")).not.toThrow();
  expect(() => parse('(set! x "hello")')).not.toThrow();
  expect(() => parse("(set! x #t)")).not.toThrow();
  expect(() => parse("(set! x #f)")).not.toThrow();
  expect(() => parse("(set! x (lambda (x) x))")).not.toThrow();
});

test("does not throw on nested reassignments", () => {
  expect(() => parse("(set! x (set! y 1))")).not.toThrow();
  expect(() => parse("(set! x (set! y 1.0))")).not.toThrow();
  expect(() => parse('(set! x (set! y "hello"))')).not.toThrow();
  expect(() => parse("(set! x (set! y #t))")).not.toThrow();
  expect(() => parse("(set! x (set! y #f))")).not.toThrow();
  expect(() => parse("(set! x (set! y (lambda (x) x)))")).not.toThrow();
});

test("does not throw on parsing import statements", () => {
  expect(() => parse('(import "path/to/file" (a b c d))')).not.toThrow();
});

test("does not throw on parsing export statements", () => {
  expect(() => parse("(export (define a 1))")).not.toThrow();
});

test("does not throw on parsing vector literals", () => {
  expect(() => parse("#(1 2 3)")).not.toThrow();
  expect(() => parse("#(1 2 3 4)")).not.toThrow();
  expect(() => parse("#(1 testy 3 4 5)")).not.toThrow();
});

test("does not throw on parsing vector literals with nested lists", () => {
  expect(() => parse("#(1 (2 3) 4)")).not.toThrow();
  expect(() => parse("#(1 (2 (3 4)) 5)")).not.toThrow();
  expect(() => parse("#((1 2 (3 4)) 2 3 (4 5))")).not.toThrow();
});

test("does not throw on parsing let expressions", () => {
  expect(() => parse("(let () (= 1 1))")).not.toThrow();
  expect(() => parse("(let ((x 1)) x)")).not.toThrow();
  expect(() => parse("(let ((x 1) (y 2)) x y)")).not.toThrow();
  expect(() => parse("(let ((x 1) (y 2) (z 3)) x y z)")).not.toThrow();
});

test("does not throw on parsing cond expressions", () => {
  expect(() => parse("(cond (else 1))")).not.toThrow();
  expect(() => parse("(cond ((foo) (bar) (baz)))")).not.toThrow();
  expect(() =>
    parse("(cond ((= 1 1) 1 ) ((= 2 2) 2 2) (else 3))"),
  ).not.toThrow();
});

test("does not throw on parsing begin expressions", () => {
  expect(() => parse("(begin 1)")).not.toThrow();
  expect(() => parse("(begin 1 2)")).not.toThrow();
  expect(() => parse("(begin 1 2 3)")).not.toThrow();
});

test("does not throw on parsing delay expressions", () => {
  expect(() => parse("(delay 1)")).not.toThrow();
  expect(() => parse("(delay (+ 1 2))")).not.toThrow();
  expect(() => parse("(delay (lambda (x) x))")).not.toThrow();
});

test("does not throw on parsing datum comments", () => {
  expect(() => parse("#; (this-should-be-ignored)")).not.toThrow();
  expect(() =>
    parse("#; (this-should-be-ignored) (but-this-should-not)"),
  ).not.toThrow();
});

test("able to parse a program with all features", () => {
  expect(() =>
    parse(`
#|

a test of the parser

|#

#; (this-should-be-ignored) (but-this-should-not)

(import "rune" (square stack beside_n))

(export (define 你好世界 1))

;testinng the tokenizer name rules
#t
bad#name,butstillvalid!
#f
'a
a'
\`a
a\`
\`(a b ,c d, )

(define a 1)
(define (f x) (+ x a))
(define (g x f) (f (+ x a)))
(cond [(= (g 1 f) 3) 'great]
      [(= (g 1 f) 4) 'fail]
      [else 'fail])
(if #t 'great 'fail)
(if #f 'fail)

(let ((x 1)) (+ 1 1 1 1) (- 1 1 1) 4)
(let ((x 1) (y 2)) (+ x y))
(lambda () (+ x 1))
(define nullary (lambda () (+ 1 1 1 1) (- 1 1 1) 4))

(lambda x x)
(lambda (. x) x)
(lambda (x . y) y)

(define (test x) x)
(define (test x y) x y)
(define (test . x) x)

(cond [(= 1 1)]
      [(= 1 2) 'fail 1])

(if #t 1 (begin (error "help!") 1 2 3))

'(hello my 1 friend)

\`(one is equal to ,(/ 100 100))
'(a . b)

(set! a 2)

(((((((((1)))))))))

(= #t true)
`),
  ).not.toThrow();
});

test("rejects a program with lower chapter than expected", () => {
  expect(() => parse("'(delay stack beside_n)", 1)).toThrow();
});
