(import "core-bool" (atomic_and atomic_or atomic_not is_boolean))
(import "core-list" (fold))

(export (define boolean? is_boolean))
(export (define (and . args)
            (fold atomic_and #t args)))
(export (define (or . args)
            (fold atomic_or #f args)))
(export (define not atomic_not))
(export (define (boolean=? p1 p2)
            (and 
                (boolean? p1) 
                (boolean? p2) 
                (or 
                    (and p1 p2) 
                    (and (not p1) (not p2))))))