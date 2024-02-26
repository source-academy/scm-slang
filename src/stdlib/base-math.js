import {
    is_number as importedis_number,
    is_integer as importedis_integer,
    is_rational as importedis_rational,
    is_real as importedis_real,
    is_complex as importedis_complex,
    atomic_negate as importedatomic_negate,
    atomic_inverse as importedatomic_inverse,
    atomic_equals as importedatomic_equals,
    atomic_less_than as importedatomic_less_than,
    atomic_less_than_or_equals as importedatomic_less_than_or_equals,
    atomic_greater_than as importedatomic_greater_than,
    atomic_greater_than_or_equals as importedatomic_greater_than_or_equals,
    atomic_add as importedatomic_add,
    atomic_subtract as importedatomic_subtract,
    atomic_multiply as importedatomic_multiply,
    atomic_divide as importedatomic_divide
} from 'core-math';
let is_number = importedis_number;
let is_integer = importedis_integer;
let is_rational = importedis_rational;
let is_real = importedis_real;
let is_complex = importedis_complex;
let atomic_negate = importedatomic_negate;
let atomic_inverse = importedatomic_inverse;
let atomic_equals = importedatomic_equals;
let atomic_less_than = importedatomic_less_than;
let atomic_less_than_or_equals = importedatomic_less_than_or_equals;
let atomic_greater_than = importedatomic_greater_than;
let atomic_greater_than_or_equals = importedatomic_greater_than_or_equals;
let atomic_add = importedatomic_add;
let atomic_subtract = importedatomic_subtract;
let atomic_multiply = importedatomic_multiply;
let atomic_divide = importedatomic_divide;
import {
    fold as importedfold,
    last as importedlast,
    reverse as importedreverse,
    car as importedcar,
    cdr as importedcdr,
    null$63$ as importednull$63$
} from 'base-list';
let fold = importedfold;
let last = importedlast;
let reverse = importedreverse;
let car = importedcar;
let cdr = importedcdr;
let null$63$ = importednull$63$;
import { and as importedand } from 'base-boolean';
let and = importedand;
export let number$63$ = is_number;
export let integer$63$ = is_integer;
export let rational$63$ = is_rational;
export let real$63$ = is_real;
export let complex$63$ = is_complex;
export let exact$63$ = n => and(rational$63$(n), integer$63$(n));
export let inexact$63$ = n => and(real$63$(n), not(exact$63$(n)));
export let $61$ = (...ns) => {
    ns = vector$45$$62$list(ns);
    return fold((curr, wish) => and(wish, atomic_equals(curr, car(ns))), true, ns);
};
export let $60$ = (...ns) => {
    ns = vector$45$$62$list(ns);
    return truthy(null$63$(ns)) ? true : truthy(null$63$(cdr(ns))) ? true : ((a, ns_no_a) => fold((curr, wish) => {
        let res = and(wish, atomic_less_than(curr, a));
        a = curr;
        return res;
    }, true, ns_no_a))(last(ns), reverse(cdr(reverse(ns))));
};
export let $60$$61$ = (...ns) => {
    ns = vector$45$$62$list(ns);
    return truthy(null$63$(ns)) ? true : truthy(null$63$(cdr(ns))) ? true : ((a, ns_no_a) => fold((curr, wish) => {
        let res = and(wish, atomic_less_than_or_equals(curr, a));
        a = curr;
        return res;
    }, true, ns_no_a))(last(ns), reverse(cdr(reverse(ns))));
};
export let $62$ = (...ns) => {
    ns = vector$45$$62$list(ns);
    return truthy(null$63$(ns)) ? true : truthy(null$63$(cdr(ns))) ? true : ((a, ns_no_a) => fold((curr, wish) => {
        let res = and(wish, atomic_greater_than(curr, a));
        a = curr;
        return res;
    }, true, ns_no_a))(last(ns), reverse(cdr(reverse(ns))));
};
export let $62$$61$ = (...ns) => {
    ns = vector$45$$62$list(ns);
    return truthy(null$63$(ns)) ? true : truthy(null$63$(cdr(ns))) ? true : ((a, ns_no_a) => fold((curr, wish) => {
        let res = and(wish, atomic_greater_than_or_equals(curr, a));
        a = curr;
        return res;
    }, true, ns_no_a))(last(ns), reverse(cdr(reverse(ns))));
};
export let zero$63$ = n => $61$(n, 0);
export let positive$63$ = n => $62$(n, 0);
export let negative$63$ = n => $60$(n, 0);
export let max = (...ns) => {
    ns = vector$45$$62$list(ns);
    return fold((curr, max) => truthy(atomic_greater_than(curr, max)) ? curr : max, car(ns), cdr(ns));
};
export let min = (...ns) => {
    ns = vector$45$$62$list(ns);
    return fold((curr, min) => truthy(atomic_less_than(curr, min)) ? curr : min, car(ns), cdr(ns));
};
export let $43$ = (...ns) => {
    ns = vector$45$$62$list(ns);
    return fold(atomic_add, 0, ns);
};
export let $42$ = (...ns) => {
    ns = vector$45$$62$list(ns);
    return fold(atomic_multiply, 1, ns);
};
export let $45$ = (n, ...ns) => {
    ns = vector$45$$62$list(ns);
    return truthy(null$63$(ns)) ? atomic_negate(n) : atomic_subtract(n, apply($43$, ns));
};
export let $47$ = (n, ...ns) => {
    ns = vector$45$$62$list(ns);
    return truthy(null$63$(ns)) ? atomic_inverse(n) : atomic_divide(n, apply($42$, ns));
};
export let abs = n => truthy(negative$63$(n)) ? atomic_negate(n) : n;