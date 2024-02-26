import { fold as importedfold } from './base-list';
let fold = importedfold;
import { vector$45$$62$list as importedvector$45$$62$list } from './core-list';
let vector$45$$62$list = importedvector$45$$62$list;
export let identity = x => x;
export let compose = (...fs) => {
    fs = vector$45$$62$list(fs);
    return fold((f, g) => x => f(g(x)), identity, fs);
};