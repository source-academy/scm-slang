import {
    atomic_and as importedatomic_and,
    atomic_or as importedatomic_or,
    atomic_not as importedatomic_not,
    is_boolean as importedis_boolean
} from './core-bool';
let atomic_and = importedatomic_and;
let atomic_or = importedatomic_or;
let atomic_not = importedatomic_not;
let is_boolean = importedis_boolean;
import { vector$45$$62$list as importedvector$45$$62$list } from './core-list';
let vector$45$$62$list = importedvector$45$$62$list;
import { fold as importedfold } from './base-list';
let fold = importedfold;
export let boolean$63$ = is_boolean;
export let and = (...args) => {
    args = vector$45$$62$list(args);
    return fold(atomic_and, true, args);
};
export let or = (...args) => {
    args = vector$45$$62$list(args);
    return fold(atomic_or, false, args);
};
export let not = atomic_not;
export let boolean$61$$63$ = (p1, p2) => and(boolean$63$(p1), boolean$63$(p2), or(and(p1, p2), and(not(p1), not(p2))));