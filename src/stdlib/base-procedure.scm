(import "./base-list" (fold))
(import "./core-list" (vector->list))

(export (define (identity x) x))
(export (define (compose . fs)
            (fold
                (lambda (f g) (lambda (x) (f (g x))))
                identity
                fs)))