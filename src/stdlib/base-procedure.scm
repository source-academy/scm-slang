(import "base" (fold))

(export (define (identity x) x))
(export (define (compose . fs)
            (fold
                (lambda (f g) (lambda (x) (f (g x)))
                identity
                fs))))