import { Pair } from './scheme-base';

export let dotted_listQ = function (list: Pair): boolean {
    if (list === null) {
        return false;
    } else if (list.cdr === null) {
        return false;
    } else if (list.cdr instanceof Pair) {
        return dotted_listQ(list.cdr);
    } else {
        return true;
    }
}

export let filter = function (predicate: (x: any) => boolean, list: Pair): Pair | null {
    if (list === null) {
        return null;
    } else if (predicate(list.car)) {
        return new Pair(list.car, filter(predicate, list.cdr));
    } else {
        return filter(predicate, list.cdr);
    }
}

export let fold = function (f: Function, init: any, ...lists: Pair[]): any {
    if (lists.length === 0) {
        return init;
    }
    if (f.length !== lists.length + 1) {
        throw new Error(`Wrong number of arguments to accumulator: expected ${lists.length + 1}, got ${f.length}`);
    }
    if (lists.some((list) => list === null)) {
        return init;
    } else {
        return fold(f, f(init, ...lists.map((list) => list.car)), ...lists.map((list) => list.cdr));
    }
}

export let fold_right = function (f: Function, init: any, ...lists: Pair[]): any {
    if (lists.length === 0) {
        return init;
    }
    if (f.length !== lists.length + 1) {
        throw new Error(`Wrong number of arguments to accumulator: expected ${lists.length + 1}, got ${f.length}`);
    }
    if (lists.some((list) => list === null)) {
        return init;
    } else {
        return f(...lists.map((list) => list.car), fold_right(f, init, ...lists.map((list) => list.cdr)));
    }
}

export let reduce = function (f: (a: any, b: any) => any, rIdentity: any, list: Pair): any {
    if (list === null) {
        return rIdentity;
    } 
    if (f.length !== 2) {
        throw new Error(`Wrong number of arguments to accumulator: expected 2 got ${f.length}`);
    } else {
        return fold(f, rIdentity, list);
    }
}

export let reduce_right = function (f: (a: any, b: any) => any, rIdentity: any, list: Pair): any {
    if (list === null) {
        return rIdentity;
    } 
    if (f.length !== 2) {
        throw new Error(`Wrong number of arguments to accumulator: expected 2, got ${f.length}`);
    } else {
        return fold_right(f, rIdentity, list);
    }
}