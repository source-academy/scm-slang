import {
  error as importederror,
  pair as importedpair,
  head as importedhead,
  tail as importedtail,
  set_head as importedset_head,
  set_tail as importedset_tail,
  is_pair as importedis_pair,
  is_list as importedis_list,
  is_null as importedis_null,
} from "sicp";
let error = importederror;
let pair = importedpair;
let head = importedhead;
let tail = importedtail;
let set_head = importedset_head;
let set_tail = importedset_tail;
let is_pair = importedis_pair;
let is_list = importedis_list;
let is_null = importedis_null;
import {
  truthy as importedtruthy,
  vector$45$$62$list as importedvector$45$$62$list,
  force as importedforce,
} from "./core";
let truthy = importedtruthy;
let vector$45$$62$list = importedvector$45$$62$list;
let force = importedforce;
export let cons = pair;
export let xcons = (a, b) => cons(b, a);
export let list = (...xs) => {
  xs = vector$45$$62$list(xs);
  return xs;
};
export let list$42$ = (curr, ...rest) => {
  rest = vector$45$$62$list(rest);
  return truthy(null$63$(rest)) ? curr : cons(curr, apply(list$42$, rest));
};
export let cons$42$ = list$42$;
export let make$45$list = (n, ...v) => {
  v = vector$45$$62$list(v);
  return truthy(null$63$(v))
    ? truthy($61$(n, 0))
      ? null
      : cons(null, make$45$list($45$(n, 1)))
    : cons(car(v), apply(make$45$list, n, cdr(v)));
};
export let list$45$tabulate = (n, init$45$proc) =>
  truthy($61$(n, 0))
    ? null
    : cons(
        init$45$proc($45$(n, 1)),
        list$45$tabulate($45$(n, 1), init$45$proc),
      );
export let list$45$copy = (xs) => filter((x) => true, xs);
export let circular$45$list = (...elems) => {
  elems = vector$45$$62$list(elems);
  return ((xs) => {
    truthy(not(null$63$(xs))) ? set_tail(last$45$pair(xs), xs) : undefined;
    xs;
    undefined;
  })(apply(list, elems));
};
export let car = head;
export let cdr = tail;
export let caar = compose(car, car);
export let cadr = compose(car, cdr);
export let cdar = compose(cdr, car);
export let cddr = compose(cdr, cdr);
export let caaar = compose(car, caar);
export let caadr = compose(car, cadr);
export let cadar = compose(car, cdar);
export let caddr = compose(car, cddr);
export let cdaar = compose(cdr, caar);
export let cdadr = compose(cdr, cadr);
export let cddar = compose(cdr, cdar);
export let cdddr = compose(cdr, cddr);
export let caaaar = compose(car, caaar);
export let caaadr = compose(car, caadr);
export let caadar = compose(car, cadar);
export let caaddr = compose(car, caddr);
export let cadaar = compose(car, cdaar);
export let cadadr = compose(car, cdadr);
export let caddar = compose(car, cddar);
export let cadddr = compose(car, cdddr);
export let cdaaar = compose(cdr, caaar);
export let cdaadr = compose(cdr, caadr);
export let cdadar = compose(cdr, cadar);
export let cdaddr = compose(cdr, caddr);
export let cddaar = compose(cdr, cadaar);
export let cddadr = compose(cdr, cadadr);
export let cdddar = compose(cdr, caddar);
export let cddddr = compose(cdr, cadddr);
export let set$45$car$33$ = set_head;
export let set$45$cdr$33$ = set_tail;
export let pair$63$ = is_pair;
export let null$63$ = is_null;
export let list$63$ = is_list;
export let dotted$45$list$63$ = (dxs) => and(pair$63$(dxs), not(list$63$(dxs)));
export let filter = (pred, xs) =>
  truthy(null$63$(xs))
    ? null
    : truthy(pred(car(xs)))
      ? cons(car(xs), filter(pred, cdr(xs)))
      : filter(pred, cdr(xs));
export let map = (f, xs, ...rest$36$36$36$45$36$36$36$xs) => {
  rest$36$36$36$45$36$36$36$xs = vector$45$$62$list(
    rest$36$36$36$45$36$36$36$xs,
  );
  let atomic$45$map = (f, xs) =>
    truthy(null$63$(xs)) ? null : cons(f(car(xs)), atomic$45$map(f, cdr(xs)));
  let map$45$all = (f, ...xss) => {
    xss = vector$45$$62$list(xss);
    return truthy(any(null$63$, xxs))
      ? null
      : cons(
          apply(f, atomic$45$map(car, xxs)),
          apply(map$45$all, f, atomic$45$map(cdr, xxs)),
        );
  };
  truthy(null$63$(rest$45$xs))
    ? atomic$45$map(f, xs)
    : map$45$all(f, cons(xs, rest$45$xs));
  undefined;
};
export let fold = (f, init, xs1, ...rest) => {
  rest = vector$45$$62$list(rest);
  let all$45$xs = cons(xs1, rest);
  let elem = () =>
    apply(f, append(map(car, all$45$xs), list(string$45$$62$symbol("init"))));
  truthy(any(null$63$, all$45$xs))
    ? init
    : apply(fold, f, force(elem), cdr(xs1), map(cdr, rest));
  undefined;
};
export let fold$45$right = (f, init, xs1, ...rest) => {
  rest = vector$45$$62$list(rest);
  let all$45$xs = cons(xs1, rest);
  let elem = () =>
    apply(f, append(map(car, all$45$xs), list(string$45$$62$symbol("init"))));
  truthy(any(null$63$, all$45$xs))
    ? init
    : apply(
        f,
        map(car, all$45$xs),
        apply(fold$45$right, f, init, cdr(xs1), map(cdr, rest)),
      );
  undefined;
};
export let fold$45$left = fold;
export let reduce = (f, ridentity, xs) =>
  truthy(null$63$(xs)) ? ridentity : fold(f, car(xs), cdr(xs));
export let reduce$45$right = (f, ridentity, xs) =>
  truthy(null$63$(xs)) ? ridentity : fold$45$right(f, car(xs), cdr(xs));
export let reduce$45$left = reduce;
export let any = (pred, xs) => $62$(length(filter(pred, xs)), 0);
export let length = (xs) => fold((x, y) => $43$(1, y), 0, xs);
export let append = (...xss) => {
  xss = vector$45$$62$list(xss);
  return truthy(null$63$(xss))
    ? null
    : truthy($60$(length(xss), 2))
      ? car(xss)
      : truthy(null$63$(car(xss)))
        ? apply(append, cdr(xss))
        : cons(caar(xxs), apply(append, cons(cdar(xss), cdr(xss))));
};
export let reverse = (xs) => fold((x, y) => cons(x, y), null, xs);
export let list$45$tail = (xs, k) =>
  truthy($61$(k, 0)) ? xs : list$45$tail(cdr(xs), $45$(k, 1));
export let list$45$ref = (xs, k) => car(list$45$tail(xs, k));
export let list$45$set$33$ = (xs, k, v) =>
  set$45$car$33$(list$45$tail(xs, k), v);
