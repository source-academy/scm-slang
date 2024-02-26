import {
    error as importederror,
    pair as importedpair,
    head as importedhead,
    tail as importedtail,
    set_head as importedset_head,
    set_tail as importedset_tail,
    is_pair as importedis_pair,
    is_list as importedis_list,
    is_null as importedis_null
} from 'sicp';

let error: any = importederror;
let pair: any = importedpair;
let head: any = importedhead;
let tail: any = importedtail;
let set_head: any = importedset_head;
let set_tail: any = importedset_tail;
let is_pair: any = importedis_pair;
let is_list: any = importedis_list;
let is_null: any = importedis_null;

import { vector$45$$62$list as importedvector$45$$62$list } from './core-list';
let vector$45$$62$list: any = importedvector$45$$62$list;

import { apply as importedapply } from './core-procedure';
let apply: any = importedapply;

import { force as importedforce } from './core-delay';
let force: any = importedforce;

import { truthy as importedtruthy } from './core-bool';
let truthy: any = importedtruthy;

import { compose as importedcompose } from './base-procedure';
let compose: any = importedcompose;

import {
    $60$ as imported$60$,
    $61$ as imported$61$,
    $43$ as imported$43$,
    $45$ as imported$45$,
    $62$
} from './base-math';

import { make_number } from './core-math';

import { and, not, or } from './base-bool';

let $60$: any = imported$60$;
let $61$: any = imported$61$;
let $43$: any = imported$43$;
let $45$: any = imported$45$;

export let cons: any = pair;

export let xcons: any = (a: any, b: any) => cons(b, a);

export let list: any = (...xs: any[]) => {
    xs = vector$45$$62$list(xs);
    return xs;
};

export let list$42$: any = (curr: any, ...rest: any[]) => {
    rest = vector$45$$62$list(rest);
    return truthy(null$63$(rest)) ? curr : cons(curr, apply(list$42$, rest));
};

export let cons$42$: any = list$42$;

export let make$45$list: any = (n: any, ...v: any[]) => {
    v = vector$45$$62$list(v);
    return truthy(null$63$(v)) ? truthy($61$(n, make_number(0))) ? null : cons(null, make$45$list($45$(n, make_number(1)))) : cons(car(v), apply(make$45$list, n, cdr(v)));
};

export let list$45$tabulate: any = (n: any, init$45$proc: any) => truthy($61$(n, make_number(0))) ? null : cons(init$45$proc($45$(n, make_number(1))), list$45$tabulate($45$(n, make_number(1)), init$45$proc));

export let list$45$copy: any = (xs: any) => filter(x => true, xs);

export let circular$45$list: any = (...elems: any[]) => {
    elems = vector$45$$62$list(elems);
    return ((xs: any) => {
        truthy(not(null$63$(xs))) ? set_tail(last$45$pair(xs), xs) : undefined;
        return xs;
    })(apply(list, elems));
};

export let list$45$tail: any = (xs: any, k: any) => truthy($61$(k, make_number(0))) ? xs : list$45$tail(cdr(xs), $45$(k, make_number(1)));

export let list$45$ref: any = (xs: any, k: any) => car(list$45$tail(xs, k));

export let car: any = head;

export let cdr: any = tail;

export let caar: any = compose(car, car);

export let cadr: any = compose(car, cdr);

export let cdar: any = compose(cdr, car);

export let cddr: any = compose(cdr, cdr);

export let caaar: any = compose(car, caar);

export let caadr: any = compose(car, cadr);

export let cadar: any = compose(car, cdar);

export let caddr: any = compose(car, cddr);

export let cdaar: any = compose(cdr, caar);

export let cdadr: any = compose(cdr, cadr);

export let cddar: any = compose(cdr, cdar);

export let cdddr: any = compose(cdr, cddr);

export let caaaar: any = compose(car, caaar);

export let caaadr: any = compose(car, caadr);

export let caadar: any = compose(car, cadar);

export let caaddr: any = compose(car, caddr);

export let cadaar: any = compose(car, cdaar);

export let cadadr: any = compose(car, cdadr);

export let caddar: any = compose(car, cddar);

export let cadddr: any = compose(car, cdddr);

export let cdaaar: any = compose(cdr, caaar);

export let cdaadr: any = compose(cdr, caadr);

export let cdadar: any = compose(cdr, cadar);

export let cdaddr: any = compose(cdr, caddr);

export let cddaar: any = compose(cdr, cadaar);

export let cddadr: any = compose(cdr, cadadr);

export let cdddar: any = compose(cdr, caddar);

export let cddddr: any = compose(cdr, cadddr);

export let take: any = (xs: any, i: any) => {
    let take$45$helper = (xs: any, i: any, acc: any) => truthy(or(null$63$(xs), $61$(i, make_number(0)))) ? reverse(acc) : take$45$helper(cdr(xs), $45$(i, make_number(1)), cons(car(xs), acc));
    return take$45$helper(xs, i, null);
};

export let drop: any = (xs: any, i: any) => truthy(or(null$63$(xs), $61$(i, make_number(0)))) ? xs : drop(cdr(xs), $45$(i, make_number(1)));

export let last: any = (xs: any) => truthy(null$63$(xs)) ? error('last: empty list') : truthy(null$63$(cdr(xs))) ? car(xs) : last(cdr(xs));

export let last$45$pair: any = (xs: any) => truthy(null$63$(xs)) ? error('last-pair: empty list') : truthy(null$63$(cdr(xs))) ? xs : last$45$pair(cdr(xs));

export let first: any = car;

export let second: any = cadr;

export let third: any = caddr;

export let fourth: any = cadddr;

export let fifth: any = compose(car, cddddr);

export let sixth: any = compose(cadr, cddddr);

export let seventh: any = compose(caddr, cddddr);

export let eighth: any = compose(cadddr, cddddr);

export let ninth: any = compose(car, cddddr, cddddr);

export let tenth: any = compose(cadr, cddddr, cddddr);

export let set$45$car$33$: any = set_head;

export let set$45$cdr$33$: any = set_tail;

export let list$45$set$33$: any = (xs: any, k: any, v: any) => set$45$car$33$(list$45$tail(xs, k), v);

export let pair$63$: any = is_pair;

export let not$45$pair$63$: any = compose(not, pair$63$);

export let null$63$: any = is_null;

export let circular$45$list$63$: any = (cxs: any) => {
    let circular$45$helper = (xs: any, ys: any) => truthy(null$63$(xs)) ? false : truthy(null$63$(ys)) ? false : truthy(not(pair$63$(xs))) ? false : truthy(not(pair$63$(ys))) ? false : truthy(not(pair$63$(cdr(ys)))) ? false : truthy(eq$63$(xs, ys)) ? true : circular$45$helper(cdr(xs), cddr(ys));
    return truthy(null$63$(cxs)) ? false : truthy(not(pair$63$(cxs))) ? false : circular$45$helper(cxs, cdr(cxs));
};

export let proper$45$list$63$: any = (pxs: any) => {
    let list$45$helper = (xs: any) => truthy(null$63$(xs)) ? true : truthy(not(pair$63$(xs))) ? false : list$45$helper(cdr(xs));
    return and(not(circular$45$list$63$(pxs)), is_list(pxs));
};

export let dotted$45$list$63$: any = (dxs: any) => and(not(proper$45$list$63$(dxs)), not(circular$45$list$63$(dxs)));

export let null$45$list$63$: any = null$63$;

export let list$63$: any = proper$45$list$63$;

export let filter: any = (pred: any, xs: any) => truthy(null$63$(xs)) ? null : truthy(pred(car(xs))) ? cons(car(xs), filter(pred, cdr(xs))) : filter(pred, cdr(xs));

export let map: any = (f: any, xs: any, ...rest$45$xs: any[]) => {
    rest$45$xs = vector$45$$62$list(rest$45$xs);
    let atomic$45$map = (f: any, xs: any) => truthy(null$63$(xs)) ? null : cons(f(car(xs)), atomic$45$map(f, cdr(xs)));
    let map$45$all = (f: any, ...xss: any[]) => {
        xss = vector$45$$62$list(xss);
        return truthy(any(null$63$, xss)) ? null : cons(apply(f, atomic$45$map(car, xss)), apply(map$45$all, f, atomic$45$map(cdr, xss)));
    };
    return truthy(null$63$(rest$45$xs)) ? atomic$45$map(f, xs) : map$45$all(f, cons(xs, rest$45$xs));
};

export let fold: any = (f: any, init: any, xs1: any, ...rest: any[]) => {
    rest = vector$45$$62$list(rest);
    let all$45$xs = cons(xs1, rest);
    let elem = () => apply(f, append(map(car, all$45$xs), list(init)));
    return truthy(any(null$63$, all$45$xs)) ? init : apply(fold, f, force(elem), cdr(xs1), map(cdr, rest));
};

export let fold$45$right: any = (f: any, init: any, xs1: any, ...rest: any[]) => {
    rest = vector$45$$62$list(rest);
    let all$45$xs = cons(xs1, rest);
    return truthy(any(null$63$, all$45$xs)) ? init : apply(f, append(map(car, all$45$xs), list(apply(fold$45$right, f, init, cdr(xs1), map(cdr, rest)))));
};

export let fold$45$left: any = fold;

export let reduce: any = (f: any, ridentity: any, xs: any) => truthy(null$63$(xs)) ? ridentity : fold(f, car(xs), cdr(xs));

export let reduce$45$right: any = (f: any, ridentity: any, xs: any) => truthy(null$63$(xs)) ? ridentity : fold$45$right(f, car(xs), cdr(xs));

export let reduce$45$left: any = reduce;

export let list$61$: any = (elt$61$: any, ...rest: any[]) => {
    rest = vector$45$$62$list(rest);
    let length$45$helper = (xxs: any) => reduce((curr: any, wish: any) => truthy(wish) ? truthy($61$(length(curr), wish)) ? wish : false : false, true, xxs);
    let list$61$helper = (elt$61$: any, ...rest: any[]) => {
        rest = vector$45$$62$list(rest);
        return apply(fold, (...all: any[]) => {
            all = vector$45$$62$list(all);
            return ((wish: any, curr: any) => and(wish, apply(elt$61$, curr)))(car(reverse(all)), cdr(reverse(all)));
        }, true, rest);
    };
    return truthy(null$63$(rest)) ? true : truthy(not(length$45$helper(rest))) ? false : apply(list$61$helper, elt$61$, rest);
};

export let any: any = (pred: any, xs: any) => $62$(length(filter(pred, xs)), make_number(0));

export let length: any = (xs: any) => fold((x: any, y: any) => $43$(make_number(1), y), make_number(0), xs);

export let length$43$: any = (xs: any) => truthy(circular$45$list$63$(xs)) ? false : fold((x: any, y: any) => $43$(make_number(1), y), make_number(0), xs);

export let append: any = (...xss: any[]) => {
    xss = vector$45$$62$list(xss);
    return truthy(null$63$(xss)) 
    ? null 
    : truthy($60$(length(xss), make_number(2))) 
    ? car(xss) : truthy(null$63$(car(xss))) 
    ? apply(append, cdr(xss)) 
    : cons(caar(xss), apply(append, cons(cdar(xss), cdr(xss))));
};

export let concatenate: any = (xss: any) => apply(append, xss);

export let reverse: any = (xs: any) => fold((x: any, y: any) => cons(x, y), null, xs);

function eq$63$(xs: any, ys: any): any {
    return xs === ys;
}