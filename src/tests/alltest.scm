(import "rune" (square stack beside_n))

(export (define 你好世界 1))

;testinng the tokenizer name rules
#t
bad#name,butstillvalid!
#f
'a
a'
`a
a`
`(a b ,c d, )

(define a 1)
(define (f x) (+ x a))
(define (g x f) (f (+ x a)))
(cond [(= (g 1 f) 3) 'great]
      [(= (g 1 f) 4) 'fail]
      [else 'fail])
(if #t 'great 'fail)
(if #f 'fail)

(let () (+ 1 1 1 1) (- 1 1 1) 4)
(let ((x 1) (y 2)) (+ x y))
(lambda (x) (+ x 1))
(define nullary (lambda () (+ 1 1 1 1) (- 1 1 1) 4))

(cond [(= 1 1)]
      [(= 1 2) 'fail 1])

(if #t 1 (begin (error "help!") 1 2 3))

'(hello my 1 friend)

`(one is equal to ,(/ 100 100))
'(a . b)

(set! a 2)

(((((((((1)))))))))

(= #t true)