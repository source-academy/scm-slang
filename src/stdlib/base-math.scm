(import "core-math" 
    (is_number is_integer is_rational is_real is_complex
    atomic_negate atomic_inverse 
    atomic_equals atomic_less_than atomic_less_than_or_equals atomic_greater_than atomic_greater_than_or_equals
    atomic_add atomic_subtract atomic_multiply atomic_divide))

(import "base-list" (fold last reverse car cdr null?))

(export (define number? is_number))
(export (define integer? is_integer))
(export (define rational? is_rational))
(export (define real? is_real))
(export (define complex? is_complex))
(export (define (exact? n)
    (and (rational? n) (integer? n))))
(export (define (inexact? n)
    (and (real? n) (not (exact? n)))))
(export (define (= . ns)
    (fold (lambda (curr wish)
        (and wish (atomic_equals curr (car ns)))) 
    #t 
    ns)))
(export (define (< . ns)
    (cond
        [(null? ns) #t]
        [(null? (cdr ns)) #t]
        [else (let ([a (last ns)] [ns_no_a (reverse (cdr (reverse ns)))])
                (fold 
                    (lambda (curr wish) 
                        (begin
                            (define res (and wish (atomic_less_than curr a)))
                            (set! a curr)
                            res))
                    #t
                    ns_no_a))])))
(export (define (<= . ns)
    (cond
        [(null? ns) #t]
        [(null? (cdr ns)) #t]
        [else (let ([a (last ns)] [ns_no_a (reverse (cdr (reverse ns)))])
                (fold 
                    (lambda (curr wish) 
                        (begin
                            (define res (and wish (atomic_less_than_or_equals curr a)))
                            (set! a curr)
                            res))
                    #t
                    ns_no_a))])))
(export (define (> . ns)
    (cond
        [(null? ns) #t]
        [(null? (cdr ns)) #t]
        [else (let ([a (last ns)] [ns_no_a (reverse (cdr (reverse ns)))])
                (fold 
                    (lambda (curr wish) 
                        (begin
                            (define res (and wish (atomic_greater_than curr a)))
                            (set! a curr)
                            res))
                    #t
                    ns_no_a))])))
(export (define (>= . ns)
    (cond
        [(null? ns) #t]
        [(null? (cdr ns)) #t]
        [else (let ([a (last ns)] [ns_no_a (reverse (cdr (reverse ns)))])
                (fold 
                    (lambda (curr wish) 
                        (begin
                            (define res (and wish (atomic_greater_than_or_equals curr a)))
                            (set! a curr)
                            res))
                    #t
                    ns_no_a))])))
(export (define (zero? n) (= n 0)))
(export (define (positive? n) (> n 0)))
(export (define (negative? n) (< n 0)))
#;(export (define (odd? n) (integer? n) (atomic_equals (atomic_modulo n 2) 1)))
#;(export (define (even? n) (integer? n) (atomic_equals (atomic_modulo n 2) 0)))
(export (define (max . ns)
    (fold (lambda (curr max) 
        (if (atomic_greater_than curr max) curr max)) 
    (car ns) 
    (cdr ns))))
(export (define (min . ns)
    (fold (lambda (curr min) 
        (if (atomic_less_than curr min) curr min)) 
    (car ns) 
    (cdr ns))))

(export (define (+ . ns) 
    (fold atomic_add 0 ns)))
(export (define (* . ns) 
    (fold atomic_multiply 1 ns)))
(export (define (- n . ns)
    (if (null? ns) 
        (atomic_negate n)
        (atomic_subtract n (apply + ns)))))
(export (define (/ n . ns)
    (if (null? ns) 
        (atomic_inverse n)
        (atomic_divide n (apply * ns)))))
(export (define (abs n)
    (if (negative? n) (atomic_negate n) n)))

;; everything else is incomplete, please refer to cmu's r4rs math library