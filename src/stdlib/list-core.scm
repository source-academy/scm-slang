#|
We will implement scm-slang's core list library using scheme itself.
|#
(import "sicp" (error pair head tail set_head set_tail is_pair is_list is_null))

;; these imports are required to support variadic functions and truthy values.
(import "./core" (truthy vector->list force))

;; Define the constructors
(export (define cons pair))
(export (define (xcons a b) (cons b a)))
(export (define (list . xs) xs))
(export (define (list* curr . rest) 
            (if (null? rest)
                curr
                (cons curr (apply list* rest)))))
(export (define cons* list*))
;; BTW, optional arguments aren't supported yet!
;; Mimic them with a variadic function instead.
(export (define (make-list n . v)
            (if (null? v)
                (if (= n 0)
                    '()
                    (cons '() (make-list (- n 1))))
                (cons (car v) (apply make-list n (cdr v))))))
(export (define (list-tabulate n init-proc)
            (if (= n 0)
                '()
                (cons (init-proc (- n 1)) (list-tabulate (- n 1) init-proc)))))
(export (define (list-copy xs)
            (filter (lambda (x) #t) xs)))
(export (define (circular-list . elems)
            ;; make a standard list first, then make it circular.
            (let ([xs (apply list elems)])
                (if (not (null? xs)) (set_tail (last-pair xs) xs))
                xs)))
;; Define the accessors
(export (define car head))
(export (define cdr tail))
(export (define caar (compose car car)))
(export (define cadr (compose car cdr)))
(export (define cdar (compose cdr car)))
(export (define cddr (compose cdr cdr)))
(export (define caaar (compose car caar)))
(export (define caadr (compose car cadr)))
(export (define cadar (compose car cdar)))
(export (define caddr (compose car cddr)))
(export (define cdaar (compose cdr caar)))
(export (define cdadr (compose cdr cadr)))
(export (define cddar (compose cdr cdar)))
(export (define cdddr (compose cdr cddr)))
(export (define caaaar (compose car caaar)))
(export (define caaadr (compose car caadr)))
(export (define caadar (compose car cadar)))
(export (define caaddr (compose car caddr)))
(export (define cadaar (compose car cdaar)))
(export (define cadadr (compose car cdadr)))
(export (define caddar (compose car cddar)))
(export (define cadddr (compose car cdddr)))
(export (define cdaaar (compose cdr caaar)))
(export (define cdaadr (compose cdr caadr)))
(export (define cdadar (compose cdr cadar)))
(export (define cdaddr (compose cdr caddr)))
(export (define cddaar (compose cdr cadaar)))
(export (define cddadr (compose cdr cadadr)))
(export (define cdddar (compose cdr caddar)))
(export (define cddddr (compose cdr cadddr)))

;; Define the mutators
(export (define set-car! set_head))
(export (define set-cdr! set_tail))

;; Define the predicates
(export (define pair? is_pair))
(export (define null? is_null))
(export (define proper-list? is_list))
(export (define (dotted-list? dxs)
            (and (pair? dxs) (not (proper-list? dxs)))))
(export (define (circular-list? xs)
            (let ([tortoise xs] [hare xs])
                (let loop ([tortoise (cdr tortoise)] [hare (cdr (cdr hare))])
                    (cond [(or (null? tortoise) (null? hare)) #f]
                          [(eq? tortoise hare) #t]
                          [else (loop (cdr tortoise) (cdr (cdr hare)))])))))
;; for SICP
(export (define list? proper-list?))

;; The core functions to work with lists: filter, map, reduce, fold etc...
(export (define (filter pred xs)
            (cond [(null? xs) '()]
                  [(pred (car xs)) (cons (car xs) (filter pred (cdr xs)))]
                  [else (filter pred (cdr xs))])))

(export (define (map f xs . rest-xs)
            ;;to define variadic map, we need atomic map first
            (define (atomic-map f xs)
                (if (null? xs)
                    '()
                    (cons (f (car xs)) (atomic-map f (cdr xs)))))
                    
            ;;the main logic is defined here for readability.
            ;;for this implementation, as long as one of the lists is empty, stop.
            (define (map-all f . xss)
                ;; we are assured that xxs is not empty.
                (if (any null? xxs)
                    '()
                    (cons 
                        (apply f (atomic-map car xxs)) 
                        (apply map-all f (atomic-map cdr xxs)))))

            (cond [(null? rest-xs) (atomic-map f xs)]
                  [else (map-all f (cons xs rest-xs))])))

;; applies the function to each element of each list, and accumulates the result.
(export (define (fold f init xs1 . rest)
            ;; it's easier to reason about all of the lists together
            (define all-xs (cons xs1 rest))
            (define elem (delay (apply f (append (map car all-xs) '(init)))))
            (if (any null? all-xs)
                init
                (apply fold f (force elem) (cdr xs1) (map cdr rest)))))

(export (define (fold-right f init xs1 . rest)
            ;; its easier to reason about all of the lists together
            (define all-xs (cons xs1 rest))
            (define elem (delay (apply f (append (map car all-xs) '(init)))))
            (if (any null? all-xs)
                init
                (apply f
                    (map car all-xs)
                    (apply fold-right f init (cdr xs1) (map cdr rest))))))

(export (define fold-left fold))

;; the reduces are implemented as derivations of the folds,
;; where the first call to f is on the first two elements of the list.
(export (define (reduce f ridentity xs)
            (if (null? xs)
                ridentity
                (fold f (car xs) (cdr xs)))))

(export (define (reduce-right f ridentity xs)
            (if (null? xs)
                ridentity
                (fold-right f (car xs) (cdr xs)))))

(export (define reduce-left reduce))

;; The rest of the functions needed to deal with lists.
;; Most can be implemented in terms of the core functions defined above.

(export (define (any pred xs)
            (> (length (filter pred xs)) 0)))

(export (define (length xs)
            (fold (lambda (x y) (+ 1 y)) 0 xs)))

(export (define (append . xss)
            (cond 
                [(null? xss) '()]
                [(< (length xss) 2) (car xss)]
                [(null? (car xss)) (apply append (cdr xss))]
                ;; else recursively destruct the first list and append the rest.
                [else (cons (caar xxs) (apply append (cons (cdar xss) (cdr xss))))])))

(export (define (reverse xs) 
            (fold (lambda (x y) (cons x y)) '() xs)))

(export (define (list-tail xs k)
            (if (= k 0)
                xs
                (list-tail (cdr xs) (- k 1)))))

(export (define (list-ref xs k)
            (car (list-tail xs k))))

(export (define (list-set! xs k v)
            (set-car! (list-tail xs k) v)))