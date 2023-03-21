// variable names will be changed in the final estree.
/*

convention:

U --> - (since all scheme basic procedures are in lower case)
__ --> ->
$ --> ?
_ --> !

to be changed with regex.
*/

// The global environment of Scheme.
export let plus = function (...args) {
  return args.reduce((a, b) => a + b, 0);
};

export let minus = function (...args) {
  return args.reduce((a, b) => a - b, 0);
};

export let multiply = function (...args) {
  return args.reduce((a, b) => a * b, 1);
};

export let divide = function (...args) {
  return args.reduce((a, b) => a / b, 1);
};

export let equal = function (...args) {
  let acc = true;
  for (let i = 0; i < args.length - 1; i++) {
    acc = acc && args[i] === args[i + 1];
  }
  return acc;
};

export let cos = function (x) {
  return Math.cos(x);
};

export let sin = function (x) {
  return Math.sin(x);
};

export let tan = function (x) {
  return Math.tan(x);
};

/*
export let abs = function(x: number): number {
    return Math.abs(x);
}

export let sqrt = function(x: number): number {
    return Math.sqrt(x);
}

export let modulo = function(x: number, y: number): number {
    return x % y;
}
*/

export let less = function (...args) {
  let acc = true;
  for (let i = 0; i < args.length - 1; i++) {
    acc = acc && args[i] < args[i + 1];
  }
  return acc;
};

export let less_equal = function (...args) {
  let acc = true;
  for (let i = 0; i < args.length - 1; i++) {
    acc = acc && args[i] <= args[i + 1];
  }
  return acc;
};

export let greater = function (...args) {
  let acc = true;
  for (let i = 0; i < args.length - 1; i++) {
    acc = acc && args[i] > args[i + 1];
  }
  return acc;
};

export let greater_equal = function (...args) {
  let acc = true;
  for (let i = 0; i < args.length - 1; i++) {
    acc = acc && args[i] >= args[i + 1];
  }
  return acc;
};

export let not = function (x) {
  return !x;
};

export let and = function (...args) {
  return args.reduce((a, b) => a && b, true);
};

export let or = function (...args) {
  return args.reduce((a, b) => a || b, false);
};

export let eq$ = function (x, y) {
  return Object.is(x, y);
};

export let eqv$ = function (x, y) {
  return eq$(x, y);
};

export let equal$ = function (x, y) {
  if (x === y) {
    return true;
  } else if (x instanceof Pair && y instanceof Pair) {
    return equal$(x.car, y.car) && equal$(x.cdr, y.cdr);
  } else if (x instanceof Symbol && y instanceof Symbol) {
    return x.sym === y.sym;
  } else {
    return false;
  }
};

// and more...

export class Symbol {
  constructor(sym) {
    this.sym = sym;
  }

  toString() {
    return this.sym;
  }
}

export let string__symbol = function (sym) {
  return new Symbol(sym);
};

export let symbol$ = function (s) {
  return s instanceof Symbol;
};

export class Pair {
  constructor(car, cdr) {
    this.car = car;
    this.cdr = cdr;
    if (cdr == null || (cdr instanceof Pair && cdr.isList)) {
      this.isList = true;
    } else {
      this.isList = false;
    }
  }

  toString() {
    if (this.isList) {
      let acc = "(";
      let p = this;
      while (p != null) {
        acc += `${p.car} `;
        p = p.cdr;
      }
      return `${acc.slice(0, -1)})`;
    }
    return `(${this.car} . ${this.cdr})`;
  }
}

export let cons = function (car, cdr) {
  return new Pair(car, cdr);
};

export let car = function (p) {
  return p.car;
};

export let cdr = function (p) {
  return p.cdr;
};

export let pair$ = function (p) {
  return p instanceof Pair;
};

export let list$ = function (p) {
  return p instanceof Pair && p.isList;
};

export let list = function (...args) {
  let acc = null;
  for (let i = args.length - 1; i >= 0; i--) {
    acc = new Pair(args[i], acc);
  }
  return acc;
};

export let display = function (x) {
  console.log(x);
};
