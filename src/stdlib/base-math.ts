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
    atomic_divide as importedatomic_divide,
    make_number
} from './core-math';

let is_number: any = importedis_number;
let is_integer: any = importedis_integer;
let is_rational: any = importedis_rational;
let is_real: any = importedis_real;
let is_complex: any = importedis_complex;
let atomic_negate: any = importedatomic_negate;
let atomic_inverse: any = importedatomic_inverse;
let atomic_equals: any = importedatomic_equals;
let atomic_less_than: any = importedatomic_less_than;
let atomic_less_than_or_equals: any = importedatomic_less_than_or_equals;
let atomic_greater_than: any = importedatomic_greater_than;
let atomic_greater_than_or_equals: any = importedatomic_greater_than_or_equals;
let atomic_add: any = importedatomic_add;
let atomic_subtract: any = importedatomic_subtract;
let atomic_multiply: any = importedatomic_multiply;
let atomic_divide: any = importedatomic_divide;

import {
    fold as importedfold,
    last as importedlast,
    reverse as importedreverse,
    car as importedcar,
    cdr as importedcdr,
    null$63$ as importednull$63$
} from './base-list';

let fold: any = importedfold;
let last: any = importedlast;
let reverse: any = importedreverse;
let car: any = importedcar;
let cdr: any = importedcdr;
let null$63$: any = importednull$63$;

import { and as importedand, not } from './base-bool';
import { vector$45$$62$list } from './core-list';
import { truthy } from './core-bool';
import { apply } from './core-procedure';

let and: any = importedand;

export let number$63$: any = is_number;
export let integer$63$: any = is_integer;
export let rational$63$: any = is_rational;
export let real$63$: any = is_real;
export let complex$63$: any = is_complex;

export let exact$63$ = (n: any): boolean => and(rational$63$(n), integer$63$(n));
export let inexact$63$ = (n: any): boolean => and(real$63$(n), not(exact$63$(n)));

export let $61$ = (...ns: any[]): boolean => {
    ns = vector$45$$62$list(ns);
    return fold((curr: any, wish: any) => and(wish, atomic_equals(curr, car(ns))), true, ns);
};

export let $60$ = (...ns: any[]): boolean => {
    ns = vector$45$$62$list(ns);
    return truthy(null$63$(ns)) ? true : truthy(null$63$(cdr(ns))) ? true : ((a: any, ns_no_a: any) => fold((curr: any, wish: any) => {
        let res = and(wish, atomic_less_than(curr, a));
        a = curr;
        return res;
    }, true, ns_no_a))(last(ns), reverse(cdr(reverse(ns))));
};

export let $60$$61$ = (...ns: any[]): boolean => {
    ns = vector$45$$62$list(ns);
    return truthy(null$63$(ns)) ? true : truthy(null$63$(cdr(ns))) ? true : ((a: any, ns_no_a: any) => fold((curr: any, wish: any) => {
        let res = and(wish, atomic_less_than_or_equals(curr, a));
        a = curr;
        return res;
    }, true, ns_no_a))(last(ns), reverse(cdr(reverse(ns))));
};

export let $62$ = (...ns: any[]): boolean => {
    ns = vector$45$$62$list(ns);
    return truthy(null$63$(ns)) ? true : truthy(null$63$(cdr(ns))) ? true : ((a: any, ns_no_a: any) => fold((curr: any, wish: any) => {
        let res = and(wish, atomic_greater_than(curr, a));
        a = curr;
        return res;
    }, true, ns_no_a))(last(ns), reverse(cdr(reverse(ns))));
};

export let $62$$61$ = (...ns: any[]): boolean => {
    ns = vector$45$$62$list(ns);
    return truthy(null$63$(ns)) ? true : truthy(null$63$(cdr(ns))) ? true : ((a: any, ns_no_a: any) => fold((curr: any, wish: any) => {
        let res = and(wish, atomic_greater_than_or_equals(curr, a));
        a = curr;
        return res;
    }, true, ns_no_a))(last(ns), reverse(cdr(reverse(ns))));
};

export let zero$63$ = (n: any): boolean => $61$(n, make_number(0));

export let positive$63$ = (n: any): boolean => $62$(n, make_number(0));

export let negative$63$ = (n: any): boolean => $60$(n, make_number(0));

export let max = (...ns: any[]): any => {
    ns = vector$45$$62$list(ns);
    return fold((curr: any, max: any) => truthy(atomic_greater_than(curr, max)) ? curr : max, car(ns), cdr(ns));
};

export let min = (...ns: any[]): any => {
    ns = vector$45$$62$list(ns);
    return fold((curr: any, min: any) => truthy(atomic_less_than(curr, min)) ? curr : min, car(ns), cdr(ns));
};

export let $43$ = (...ns: any[]): any => {
    ns = vector$45$$62$list(ns);
    return fold(atomic_add, make_number(0), ns);
};

export let $42$ = (...ns: any[]): any => {
    ns = vector$45$$62$list(ns);
    return fold(atomic_multiply, make_number(1), ns);
};

export let $45$ = (n: any, ...ns: any[]): any => {
    ns = vector$45$$62$list(ns);
    return truthy(null$63$(ns)) ? atomic_negate(n) : atomic_subtract(n, apply($43$, ns) as any);
};

export let $47$ = (n: any, ...ns: any[]): any => {
    ns = vector$45$$62$list(ns);
    return truthy(null$63$(ns)) ? atomic_inverse(n) : atomic_divide(n, apply($42$, ns) as any);
};

export let abs = (n: any): any => truthy(negative$63$(n)) ? atomic_negate(n) : n;