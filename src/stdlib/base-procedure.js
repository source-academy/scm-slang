import { fold as importedfold } from 'base';
let fold = importedfold;
export let identity = x => x;
export let compose = (...fs) => {
    fs = vector$45$$62$list(fs);
    return fold((f, g) => {
        x => f(g(x));
        identity;
        return fs;
    });
};