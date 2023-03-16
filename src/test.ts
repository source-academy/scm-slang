import { Tokenizer } from "./tokenizer";
import { SchemeParser } from "./scheme-parser"; 

const str = 
"\
;;; This is a comment. the code below tests the define-variable code\n\
(define x 5)\n\
;;; This is another comment. the code below tests the define-function code\n\
(define (f x y) (+ x y))\n\
;;; This is yet another comment. the code below tests the let and lambda codes\n\
(let ((ev (lambda(n) (display \"Evaluating \")\n\
                     (display (if (procedure? n) \"procedure\" n))\n\
                     (newline) n)))\n\
  ((ev +) (ev 1) (ev 2)))\n\
;;; A comment again. the code below tests the cond code\n\
;;; without else.\n\
(cond ([= x 5] 1)\n\
      ([= 1 2] 2))\n\
;;; Okay, another comment. the code below tests the cond code\n\
;;; with else.\n\
(cond ([> x 5] 1)\n\
      ([= 1 2] (define a 1) 1)\n\
      (else x))\n\
;;; comment. the code below tests the if code\n\
;;; with alternate.\n\
(if (= x 5) 1 2)\n\
;;; the code below tests the if code\n\
;;; without alternate. also tests begin code\n\
(if (= x 5) (begin (define a 1) 1 2 (+ 1 2)))\n\
;;; the code below also tests the begin code\n\
(begin\n\
    (define x 5)\n\
    (define y 6)\n\
    (+ x y))\n\
";

const tz = new Tokenizer(str);

const tok = tz.scanTokens();

const ps = new SchemeParser(tok);

console.log(ps.parse());
