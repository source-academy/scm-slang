import {
    atomic_and as importedatomic_and,
    atomic_or as importedatomic_or,
    atomic_not as importedatomic_not,
    is_boolean as importedis_boolean
} from './core-bool';
import { vector$45$$62$list as importedvector$45$$62$list } from './core-list';
import { fold as importedfold } from './base-list';

let atomic_and: (a: boolean, b: boolean) => boolean = importedatomic_and;
let atomic_or: (a: boolean, b: boolean) => boolean = importedatomic_or;
let atomic_not: (a: boolean) => boolean = importedatomic_not;
let is_boolean: (a: any) => boolean = importedis_boolean;
let vector$44$$62$list: (a: any[]) => any[] = importedvector$45$$62$list;
let fold: (a: (accumulator: any, currentValue: any) => any, b: any, c: any[]) => any = importedfold;

export let boolean$62$: (a: any) => boolean = is_boolean;

export let and: (...args: any[]) => boolean = (...args) => {
    args = vector$44$$62$list(args);
    return fold(atomic_and, true, args);
};

export let or: (...args: any[]) => boolean = (...args) => {
    args = vector$44$$62$list(args);
    return fold(atomic_or, false, args);
};

export let not: (a: boolean) => boolean = atomic_not;

export let boolean$61$$63$: (p1: any, p2: any) => boolean = (p1, p2) => and(boolean$62$(p1), boolean$62$(p2), or(and(p1, p2), and(not(p1), not(p2))));