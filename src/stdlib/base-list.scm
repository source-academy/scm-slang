#|
We will implement scm-slang's core list library using scheme itself.
list-core implements SRFI-1, which is the core list library for scheme.
|#
(import "sicp" (error pair head tail set_head set_tail is_pair is_list is_null))

;; these imports are required to support variadic functions and truthy values.
(import "./core" (truthy vector->list force))
(import "./core" (apply))
(import "./base" (compose))
(import "./base" (< = + -))

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
(export (define (list-tail xs k)
            (if (= k 0)
                xs
                (list-tail (cdr xs) (- k 1)))))
(export (define (list-ref xs k)
            (car (list-tail xs k))))
(export (define car head))
(export (define cdr tail))
(export (define (take xs i)
            (define (take-helper xs i acc)
                (if (or (null? xs) (= i 0))
                    (reverse acc)
                    (take-helper (cdr xs) (- i 1) (cons (car xs) acc))))
            (take-helper xs i '())))
(export (define (drop xs i)
            (if (or (null? xs) (= i 0))
                xs
                (drop (cdr xs) (- i 1)))))
;; we have omitted quite a few functions from SRFI-1 here.
;; see take-right, drop-right, take-while, drop-while, etc...
(export (define (last xs)
            (if (null? xs)
                (error "last: empty list")
                (if (null? (cdr xs))
                    (car xs)
                    (last (cdr xs))))))
(export (define (last-pair xs)
            (if (null? xs)
                (error "last-pair: empty list")
                (if (null? (cdr xs))
                    xs
                    (last-pair (cdr xs))))))
(export (define first car))
(export (define second cadr))
(export (define third caddr))
(export (define fourth cadddr))
(export (define fifth (compose car cddddr)))
(export (define sixth (compose cadr cddddr)))
(export (define seventh (compose caddr cddddr)))
(export (define eighth (compose cadddr cddddr)))
(export (define ninth (compose car cddddr cddddr)))
(export (define tenth (compose cadr cddddr cddddr)))
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
(export (define (list-set! xs k v)
            (set-car! (list-tail xs k) v)))

;; Define the predicates
(export (define pair? is_pair))
(export (define not-pair? (compose not pair?)))
(export (define null? is_null))
(export (define (circular-list? cxs)
            (define (circular-helper xs ys)
                (cond
                    [(null? xs) #f]
                    [(null? ys) #f]
                    [(not (pair? xs)) #f]
                    [(not (pair? ys)) #f]
                    [(not (pair? (cdr ys))) #f]
                    [(eq? xs ys) #t]
                    [else (circular-helper (cdr xs) (cddr ys))]))
            (cond 
                [(null? cxs) #f]
                [(not (pair? cxs)) #f]
                [else (circular-helper cxs (cdr cxs))])))
(export (define (proper-list? pxs)
            ;; ensure that the list is not circular before
            ;; using our helper function.
            (define (list-helper xs)
                (cond
                    [(null? xs) #t]
                    [(not (pair? xs)) #f]
                    [else (list-helper (cdr xs))]))
            (and
                (not (circular-list? pxs))
                (is_list pxs))))
;; we have defined proper lists and circular lists.
;; dotted lists are the remainder of cases.
(export (define (dotted-list? dxs)
            (and 
                (not (proper-list? dxs))
                (not (circular-list? dxs)))))
(export (define null-list? null?))
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
            (define elem (delay (apply f (append (map car all-xs) (list init)))))
            (if (any null? all-xs)
                init
                (apply fold f (force elem) (cdr xs1) (map cdr rest)))))

(export (define (fold-right f init xs1 . rest)
            ;; its easier to reason about all of the lists together
            (define all-xs (cons xs1 rest))
            (if (any null? all-xs)
                init
                (apply f 
                    (append
                        (map car all-xs)
                        (list (apply fold-right f init (cdr xs1) (map cdr rest))))))))

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

;; list equality predicate
(export (define (list= elt= . rest)
            ;; length-helper helps to find if each list is of the same length.
            ;; the list is assured not to be empty
            (define (length-helper xxs)
                (reduce 
                    ;; wish is the length of the first list
                    ;; or false
                    (lambda (curr wish) 
                        (cond
                            [wish (if (= (length curr) wish) wish #f)]
                            [else #f])) 
                    #t 
                    xxs))

            ;; list=helper is a helper function that takes a list of lists
            ;; where it is assured that each are of the same length.
            (define (list=helper elt= . rest)
                (apply fold
                    (lambda all 
                        ;; all represents all the elements plus
                        ;; one wish element
                        (let ([wish (car (reverse all))] [curr (cdr (reverse all))])
                            (and 
                                wish
                                (apply elt= curr))))
                    #t
                    rest))
            (cond
                [(null? rest) #t]
                [(not (length-helper rest)) #f]
                [else (apply list=helper elt= rest)])))
            

(export (define (any pred xs)
            (> (length (filter pred xs)) 0)))

(export (define (length xs)
            (fold (lambda (x y) (+ 1 y)) 0 xs)))

(export (define (length+ xs)
            (if (circular-list? xs)
                #f
                (fold (lambda (x y) (+ 1 y)) 0 xs))))

(export (define (append . xss)
            (cond 
                [(null? xss) '()]
                [(< (length xss) 2) (car xss)]
                [(null? (car xss)) (apply append (cdr xss))]
                ;; else recursively destruct the first list and append the rest.
                [else (cons (caar xxs) (apply append (cons (cdar xss) (cdr xss))))])))

(export (define (concatenate xss)
            (apply append xss)))

(export (define (reverse xs) 
            (fold (lambda (x y) (cons x y)) '() xs)))

