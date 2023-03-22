(define (fac n)
    (if (= n 0)
        1
        (* n (fac (- n 1)))))

(define (id x) x)

(define (fac-cps n k)
    (if (= n 0)
        (k 1)
        (fac-cps (- n 1)
                 (lambda (x) (k (* n x))))))

(display (fac 5))

(display (fac-cps 6 id))
