import * as base from "./scheme-base";
import * as list from "./scheme-list";
import * as lazy from "./scheme-lazy";
import * as cxr from "./scheme-cxr";

export * from "./scheme-base";
export * from "./scheme-list";
export * from "./scheme-lazy";
export * from "./scheme-cxr";

// Display is defined in js-slang. This helps to format whatever scheme creates first.
export let display_helper = function (x: any): string {
    let str: string = ''
    if (base.listQ(x)) {
      str = '('
      let p = x as base.Pair
      while (p !== null) {
        str += display_helper(p.car)
        p = p.cdr
        if (p !== null) {
          str += ' '
        }
      }
      str += ')'
    } else if (list.dotted_listQ(x) && base.pairQ(x)) {
        str = '('
        let p = x as base.Pair
        while (base.pairQ(p)) {
            str = `${str}${display_helper(p.car)} `
            p = p.cdr
        }
        str = `${str}. ${display_helper(p)})`
    } else if (base.vectorQ(x)) {
      str = '#('
      let v = x as base.Vector
      for (let i = 0; i < v.vec.length; i++) {
        str += display_helper(v.vec[i])
        if (i !== v.vec.length - 1) {
          str += ' '
        }
      }
      str += ')'
    } else {
      str = x.toString()
    }
    return str
}