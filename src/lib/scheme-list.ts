import { Pair } from './scheme-base';

export let display_list = function (x: Pair): void {
    if (x === null) {
        process.stdout.write('()\n');
    } else {
        process.stdout.write('( ');
        while (x !== null) {
            process.stdout.write(`${x.car} `);
            x = x.cdr;
        }
        process.stdout.write(')\n');
    }
}
