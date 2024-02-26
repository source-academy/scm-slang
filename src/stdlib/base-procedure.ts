import { fold as importedfold } from './base-list';
let fold = importedfold;
import { vector$45$$62$list as importedvector$45$$62$list } from './core-list';
let vector$45$$62$list = importedvector$45$$62$list;
export let identity: any = x => x;
export let compose: any = (...fs: any[]) => {
    fs = vector$45$$62$list(fs);
    return fold((f: Function, g: Function) => (x: any) => f(g(x)), identity, fs);
};