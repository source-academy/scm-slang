"use strict";
var evaluator = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  };
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/stdlib/core-math.ts
  var core_math_exports = {};
  __export(core_math_exports, {
    E: () => E,
    LN10: () => LN10,
    LN2: () => LN2,
    LOG10E: () => LOG10E,
    LOG2E: () => LOG2E,
    Match: () => Match,
    NumberType: () => NumberType,
    PI: () => PI,
    SQRT1_2: () => SQRT1_2,
    SQRT2: () => SQRT2,
    SchemeComplex: () => SchemeComplex,
    SchemeInteger: () => SchemeInteger,
    SchemeRational: () => SchemeRational,
    SchemeReal: () => SchemeReal,
    acos: () => acos,
    angle: () => angle,
    asin: () => asin,
    atan: () => atan,
    atomic_add: () => atomic_add,
    atomic_divide: () => atomic_divide,
    atomic_equals: () => atomic_equals,
    atomic_greater_than: () => atomic_greater_than,
    atomic_greater_than_or_equals: () => atomic_greater_than_or_equals,
    atomic_inverse: () => atomic_inverse,
    atomic_less_than: () => atomic_less_than,
    atomic_less_than_or_equals: () => atomic_less_than_or_equals,
    atomic_multiply: () => atomic_multiply,
    atomic_negate: () => atomic_negate,
    atomic_subtract: () => atomic_subtract,
    ceiling: () => ceiling,
    coerce_to_number: () => coerce_to_number,
    cos: () => cos,
    denominator: () => denominator,
    even$63$: () => even$63$,
    exact: () => exact,
    exp: () => exp,
    expt: () => expt,
    floor: () => floor,
    imag$45$part: () => imag$45$part,
    inexact: () => inexact,
    infinity: () => infinity,
    isComplex: () => isComplex,
    isInteger: () => isInteger,
    isRational: () => isRational,
    isReal: () => isReal,
    is_complex: () => is_complex,
    is_exact: () => is_exact,
    is_inexact: () => is_inexact,
    is_integer: () => is_integer,
    is_number: () => is_number,
    is_rational: () => is_rational,
    is_real: () => is_real,
    log: () => log,
    magnitude: () => magnitude,
    make$45$polar: () => make$45$polar,
    make$45$rectangular: () => make$45$rectangular,
    make_number: () => make_number,
    nan: () => nan,
    numerator: () => numerator,
    odd$63$: () => odd$63$,
    real$45$part: () => real$45$part,
    round: () => round,
    sin: () => sin,
    sqrt: () => sqrt,
    stringIsSchemeNumber: () => stringIsSchemeNumber,
    tan: () => tan,
    truncate: () => truncate
  });
  function isInteger(value) {
    const integerRegex = new RegExp(`^([+-]?)(\\d+)$`);
    const match = integerRegex.exec(value);
    if (match) {
      return new IntegerMatch(true, match[0]);
    }
    return new IntegerMatch(false);
  }
  function isRational(value) {
    const count = (value.match(/\//g) || []).length;
    if (count !== 1) {
      return new RationalMatch(false);
    }
    const parts = value.split("/");
    if (parts.length !== 2) {
      return new RationalMatch(false);
    }
    const [numerator3, denominator3] = parts;
    const numeratorMatch = isInteger(numerator3);
    const denominatorMatch = isInteger(denominator3);
    if (!(numeratorMatch.result && denominatorMatch.result)) {
      return new RationalMatch(false);
    }
    return new RationalMatch(true, numerator3, denominator3);
  }
  function isReal(value) {
    function checkBasicReal(value2) {
      function isSpecialNumber(value3) {
        return value3 === "+inf.0" || value3 === "-inf.0" || value3 === "+nan.0" || value3 === "-nan.0";
      }
      if (isSpecialNumber(value2)) {
        return new RealMatch(true, value2);
      }
      const count2 = (value2.match(/\./g) || []).length;
      if (count2 > 1) {
        return new RealMatch(false);
      }
      if (count2 === 0) {
        const result = isInteger(value2);
        return new RealMatch(result.result, result.value);
      }
      const [integerPart, decimalPart] = value2.split(".");
      const integerMatch = isInteger(integerPart);
      const decimalMatch = isInteger(decimalPart);
      const properInteger = integerMatch.result || integerPart === "";
      const properDecimal = decimalMatch.result || decimalPart === "";
      if (integerPart === "+" || integerPart === "-") {
        if (decimalPart === "") {
          return new RealMatch(false);
        }
        return new RealMatch(true, `${integerPart}0`, value2);
      }
      if (!(integerMatch.result && properDecimal || properInteger && decimalMatch.result)) {
        return new RealMatch(false);
      }
      if (decimalMatch.result && decimalMatch.isSigned()) {
        return new RealMatch(false);
      }
      return new RealMatch(true, integerMatch.value, decimalMatch.value);
    }
    function checkExtendedReal(value2) {
      const first_e_index = value2.indexOf("e");
      const first_E_index = value2.indexOf("E");
      if (first_e_index === -1 && first_E_index === -1) {
        return new RealMatch(false);
      }
      const exponentIndex = first_e_index === -1 ? first_E_index : first_e_index;
      const basicRealPart = value2.substring(0, exponentIndex);
      const exponentPart = value2.substring(exponentIndex + 1);
      if (basicRealPart === "" || exponentPart == "") {
        return new RealMatch(false);
      }
      const basicRealMatch = checkBasicReal(basicRealPart);
      if (!basicRealMatch.result) {
        return new RealMatch(false);
      }
      const exponentMatch = universalMatch(exponentPart, 3 /* REAL */);
      if (!exponentMatch.result) {
        return new RealMatch(false);
      }
      return new RealMatch(
        true,
        basicRealMatch.integer,
        basicRealMatch.decimal,
        exponentMatch
      );
    }
    const count = (value.match(/[eE]/g) || []).length;
    if (count === 0) {
      return checkBasicReal(value);
    }
    return checkExtendedReal(value);
  }
  function isComplex(value) {
    const count = (value.match(/i/g) || []).length;
    if (count < 1) {
      return new ComplexMatch(false);
    }
    if (value[value.length - 1] !== "i") {
      return new ComplexMatch(false);
    }
    const splitPoint = value.search(/(?<!^)[+-]/);
    if (splitPoint === -1) {
      let imaginaryPart2 = value.slice(0, -1);
      const imaginaryMatch2 = universalMatch(imaginaryPart2, 3 /* REAL */);
      if (imaginaryMatch2.result) {
        return new ComplexMatch(true, void 0, void 0, imaginaryMatch2);
      }
      return new ComplexMatch(false);
    }
    const realPart = value.slice(0, splitPoint);
    let imaginaryPart = value.slice(splitPoint + 1, -1);
    if (imaginaryPart[0] !== "+" && imaginaryPart[0] !== "-") {
      imaginaryPart = "+" + imaginaryPart;
    }
    const realMatch = universalMatch(realPart, 3 /* REAL */);
    const imaginaryMatch = universalMatch(imaginaryPart, 3 /* REAL */);
    if (!(realMatch.result && imaginaryMatch.result)) {
      return new ComplexMatch(false);
    }
    return new ComplexMatch(true, realMatch, value[splitPoint], imaginaryMatch);
  }
  function universalMatch(value, finalWillingType) {
    const integerMatch = isInteger(value);
    if (integerMatch.result && finalWillingType >= 1 /* INTEGER */) {
      return integerMatch;
    }
    const rationalMatch = isRational(value);
    if (rationalMatch.result && finalWillingType >= 2 /* RATIONAL */) {
      return rationalMatch;
    }
    const realMatch = isReal(value);
    if (realMatch.result && finalWillingType >= 3 /* REAL */) {
      return realMatch;
    }
    const complexMatch = isComplex(value);
    if (complexMatch.result && finalWillingType >= 4 /* COMPLEX */) {
      return complexMatch;
    }
    return new IntegerMatch(false);
  }
  function stringIsSchemeNumber(value) {
    const match = universalMatch(value, 4 /* COMPLEX */);
    return match.result;
  }
  function coerce_to_number(a) {
    return a.coerce();
  }
  function is_number(a) {
    return a.numberType !== void 0 && Object.values(NumberType).includes(a.numberType);
  }
  function is_integer(a) {
    return is_number(a) && a.numberType <= 1;
  }
  function is_rational(a) {
    return is_number(a) && a.numberType <= 2;
  }
  function is_real(a) {
    return is_number(a) && a.numberType <= 3;
  }
  function is_complex(a) {
    return is_number(a) && a.numberType <= 4;
  }
  function is_exact(a) {
    return is_number(a) ? a.numberType === 4 ? is_exact(a.real) && is_exact(a.imaginary) : a.numberType <= 2 : false;
  }
  function is_inexact(a) {
    return is_number(a) && !is_exact(a);
  }
  function simplify(a) {
    switch (a.numberType) {
      case 1 /* INTEGER */:
        return a;
      case 2 /* RATIONAL */:
        return a.getDenominator() === 1n ? SchemeInteger.build(a.getNumerator()) : a;
      case 3 /* REAL */:
        return a;
      case 4 /* COMPLEX */:
        return SchemeComplex.build(
          simplify(a.getReal()),
          simplify(a.getImaginary())
        );
    }
  }
  function equalify(a, b) {
    if (a.numberType > b.numberType) {
      return [a, b.promote(a.numberType)];
    } else if (a.numberType < b.numberType) {
      return [a.promote(b.numberType), b];
    }
    return [a, b];
  }
  function atomic_negate(a) {
    return a.negate();
  }
  function atomic_inverse(a) {
    return a.multiplicativeInverse();
  }
  function atomic_equals(a, b) {
    const [newA, newB] = equalify(a, b);
    return newA.equals(newB);
  }
  function atomic_less_than(a, b) {
    return !atomic_greater_than(a, b) && !atomic_equals(a, b);
  }
  function atomic_less_than_or_equals(a, b) {
    return !atomic_greater_than(a, b);
  }
  function atomic_greater_than(a, b) {
    const [newA, newB] = equalify(a, b);
    return newA.greaterThan(newB);
  }
  function atomic_greater_than_or_equals(a, b) {
    return atomic_greater_than(a, b) || atomic_equals(a, b);
  }
  function atomic_add(a, b) {
    const [newA, newB] = equalify(a, b);
    return simplify(newA.add(newB));
  }
  function atomic_multiply(a, b) {
    const [newA, newB] = equalify(a, b);
    return simplify(newA.multiply(newB));
  }
  function atomic_subtract(a, b) {
    return atomic_add(a, atomic_negate(b));
  }
  function atomic_divide(a, b) {
    return atomic_multiply(a, atomic_inverse(b));
  }
  var NumberType, Match, IntegerMatch, RationalMatch, RealMatch, ComplexMatch, make_number, SchemeInteger, SchemeRational, SchemeReal, SchemeComplex, SchemePolar, infinity, nan, PI, E, SQRT2, LN2, LN10, LOG2E, LOG10E, SQRT1_2, numerator, denominator, exact, inexact, expt, exp, log, sqrt, sin, cos, tan, asin, acos, atan, floor, ceiling, truncate, round, make$45$rectangular, make$45$polar, real$45$part, imag$45$part, magnitude, angle, odd$63$, even$63$;
  var init_core_math = __esm({
    "src/stdlib/core-math.ts"() {
      "use strict";
      NumberType = /* @__PURE__ */ ((NumberType2) => {
        NumberType2[NumberType2["INTEGER"] = 1] = "INTEGER";
        NumberType2[NumberType2["RATIONAL"] = 2] = "RATIONAL";
        NumberType2[NumberType2["REAL"] = 3] = "REAL";
        NumberType2[NumberType2["COMPLEX"] = 4] = "COMPLEX";
        return NumberType2;
      })(NumberType || {});
      Match = class {
        constructor(result) {
          this.result = result;
        }
      };
      IntegerMatch = class extends Match {
        constructor(result, value) {
          super(result);
          this.result = result;
          this.value = value;
        }
        isSigned() {
          return this.result ? this.value[0] === "+" || this.value[0] === "-" : false;
        }
        build() {
          return SchemeInteger.build(this.value);
        }
      };
      RationalMatch = class extends Match {
        constructor(result, numerator3, denominator3) {
          super(result);
          this.result = result;
          this.numerator = numerator3;
          this.denominator = denominator3;
        }
        build() {
          return SchemeRational.build(this.numerator, this.denominator);
        }
      };
      RealMatch = class extends Match {
        constructor(result, integer, decimal, exponent) {
          super(result);
          this.result = result;
          this.integer = integer;
          this.decimal = decimal;
          this.exponent = exponent;
        }
        build() {
          if (this.integer?.includes("inf")) {
            return this.integer.includes("-") ? SchemeReal.NEG_INFINITY : SchemeReal.INFINITY;
          }
          if (this.integer?.includes("nan")) {
            return SchemeReal.NAN;
          }
          let exponent = (this.exponent ? this.exponent.build() : SchemeReal.INEXACT_ZERO).coerce();
          let value = Number(
            (this.integer ? this.integer : "0") + "." + (this.decimal ? this.decimal : "0")
          );
          value *= Math.pow(10, exponent);
          return SchemeReal.build(value);
        }
      };
      ComplexMatch = class extends Match {
        constructor(result, real, sign, imaginary) {
          super(result);
          this.result = result;
          this.real = real;
          this.sign = sign;
          this.imaginary = imaginary;
        }
        build() {
          const real = this.real ? this.real.build() : SchemeInteger.EXACT_ZERO;
          const imaginary = this.imaginary.build();
          if (this.sign && this.sign === "-") {
            return SchemeComplex.build(real, imaginary.negate());
          }
          return SchemeComplex.build(real, imaginary);
        }
      };
      make_number = (value) => {
        const match = universalMatch(value, 4 /* COMPLEX */);
        if (!match.result) {
          throw new Error("Invalid number");
        }
        return match.build();
      };
      SchemeInteger = class _SchemeInteger {
        constructor(value) {
          this.numberType = 1 /* INTEGER */;
          this.value = value;
        }
        static {
          this.EXACT_ZERO = new _SchemeInteger(0n);
        }
        // Factory method for creating a new SchemeInteger instance.
        // Force prevents automatic downcasting to a lower type.
        static build(value, _force = false) {
          const val = BigInt(value);
          if (val === 0n) {
            return _SchemeInteger.EXACT_ZERO;
          }
          return new _SchemeInteger(val);
        }
        promote(nType) {
          switch (nType) {
            case 1 /* INTEGER */:
              return this;
            case 2 /* RATIONAL */:
              return SchemeRational.build(this.value, 1n, true);
            case 3 /* REAL */:
              return SchemeReal.build(this.coerce(), true);
            case 4 /* COMPLEX */:
              return SchemeComplex.build(this, _SchemeInteger.EXACT_ZERO, true);
          }
        }
        equals(other) {
          return other instanceof _SchemeInteger && this.value === other.value;
        }
        greaterThan(other) {
          return this.value > other.value;
        }
        negate() {
          if (this === _SchemeInteger.EXACT_ZERO) {
            return this;
          }
          return _SchemeInteger.build(-this.value);
        }
        multiplicativeInverse() {
          if (this === _SchemeInteger.EXACT_ZERO) {
            throw new Error("Division by zero");
          }
          return SchemeRational.build(1n, this.value, false);
        }
        add(other) {
          return _SchemeInteger.build(this.value + other.value);
        }
        multiply(other) {
          return _SchemeInteger.build(this.value * other.value);
        }
        getBigInt() {
          return this.value;
        }
        coerce() {
          if (this.value > Number.MAX_SAFE_INTEGER) {
            return Infinity;
          }
          if (this.value < Number.MIN_SAFE_INTEGER) {
            return -Infinity;
          }
          return Number(this.value);
        }
        toString() {
          return this.value.toString();
        }
      };
      SchemeRational = class _SchemeRational {
        constructor(numerator3, denominator3) {
          this.numberType = 2 /* RATIONAL */;
          this.numerator = numerator3;
          this.denominator = denominator3;
        }
        // Builds a rational number.
        // Force prevents automatic downcasting to a lower type.
        static build(numerator3, denominator3, force2 = false) {
          return _SchemeRational.simplify(
            BigInt(numerator3),
            BigInt(denominator3),
            force2
          );
        }
        static simplify(numerator3, denominator3, force2 = false) {
          const gcd2 = (a, b) => {
            if (b === 0n) {
              return a;
            }
            return gcd2(b, a.valueOf() % b.valueOf());
          };
          const divisor = gcd2(numerator3, denominator3);
          const numeratorSign = numerator3 < 0n ? -1n : 1n;
          const denominatorSign = denominator3 < 0n ? -1n : 1n;
          const sign = numeratorSign * denominatorSign;
          numerator3 = numerator3 * numeratorSign;
          denominator3 = denominator3 * denominatorSign;
          if (denominator3 === 1n && !force2) {
            return SchemeInteger.build(sign * numerator3);
          }
          return new _SchemeRational(
            sign * numerator3 / divisor,
            denominator3 / divisor
          );
        }
        getNumerator() {
          return this.numerator;
        }
        getDenominator() {
          return this.denominator;
        }
        promote(nType) {
          switch (nType) {
            case 2 /* RATIONAL */:
              return this;
            case 3 /* REAL */:
              return SchemeReal.build(this.coerce(), true);
            case 4 /* COMPLEX */:
              return SchemeComplex.build(this, SchemeInteger.EXACT_ZERO, true);
            default:
              throw new Error("Unable to demote rational");
          }
        }
        equals(other) {
          return other instanceof _SchemeRational && this.numerator === other.numerator && this.denominator === other.denominator;
        }
        greaterThan(other) {
          return this.numerator * other.denominator > other.numerator * this.denominator;
        }
        negate() {
          return _SchemeRational.build(
            -this.numerator,
            this.denominator
          );
        }
        multiplicativeInverse() {
          if (this.numerator === 0n) {
            throw new Error("Division by zero");
          }
          return _SchemeRational.build(this.denominator, this.numerator);
        }
        add(other) {
          const newNumerator = this.numerator * other.denominator + other.numerator * this.denominator;
          const newDenominator = this.denominator * other.denominator;
          return _SchemeRational.build(newNumerator, newDenominator);
        }
        multiply(other) {
          const newNumerator = this.numerator * other.numerator;
          const newDenominator = this.denominator * other.denominator;
          return _SchemeRational.build(newNumerator, newDenominator);
        }
        coerce() {
          const workingNumerator = this.numerator < 0n ? -this.numerator : this.numerator;
          let converterDenominator = this.denominator;
          const wholePart = Number(workingNumerator / converterDenominator);
          if (wholePart > Number.MAX_VALUE) {
            return this.numerator < 0n ? -Infinity : Infinity;
          }
          let remainder2 = workingNumerator % converterDenominator;
          while (remainder2 > Number.MAX_SAFE_INTEGER || converterDenominator > Number.MAX_SAFE_INTEGER) {
            remainder2 = remainder2 / 2n;
            converterDenominator = converterDenominator / 2n;
          }
          const remainderPart = Number(remainder2) / Number(converterDenominator);
          return this.numerator < 0n ? -(wholePart + remainderPart) : wholePart + remainderPart;
        }
        toString() {
          return `${this.numerator}/${this.denominator}`;
        }
      };
      SchemeReal = class _SchemeReal {
        constructor(value) {
          this.numberType = 3 /* REAL */;
          this.value = value;
        }
        static {
          this.INEXACT_ZERO = new _SchemeReal(0);
        }
        static {
          this.INEXACT_NEG_ZERO = new _SchemeReal(-0);
        }
        static {
          this.INFINITY = new _SchemeReal(Infinity);
        }
        static {
          this.NEG_INFINITY = new _SchemeReal(-Infinity);
        }
        static {
          this.NAN = new _SchemeReal(NaN);
        }
        static build(value, _force = false) {
          if (value === Infinity) {
            return _SchemeReal.INFINITY;
          } else if (value === -Infinity) {
            return _SchemeReal.NEG_INFINITY;
          } else if (isNaN(value)) {
            return _SchemeReal.NAN;
          } else if (value === 0) {
            return _SchemeReal.INEXACT_ZERO;
          } else if (value === -0) {
            return _SchemeReal.INEXACT_NEG_ZERO;
          }
          return new _SchemeReal(value);
        }
        promote(nType) {
          switch (nType) {
            case 3 /* REAL */:
              return this;
            case 4 /* COMPLEX */:
              return SchemeComplex.build(this, SchemeInteger.EXACT_ZERO, true);
            default:
              throw new Error("Unable to demote real");
          }
        }
        equals(other) {
          return other instanceof _SchemeReal && this.value === other.value;
        }
        greaterThan(other) {
          return this.value > other.value;
        }
        negate() {
          return _SchemeReal.build(-this.value);
        }
        multiplicativeInverse() {
          if (this === _SchemeReal.INEXACT_ZERO || this === _SchemeReal.INEXACT_NEG_ZERO) {
            throw new Error("Division by zero");
          }
          return _SchemeReal.build(1 / this.value);
        }
        add(other) {
          return _SchemeReal.build(this.value + other.value);
        }
        multiply(other) {
          return _SchemeReal.build(this.value * other.value);
        }
        coerce() {
          return this.value;
        }
        toString() {
          if (this === _SchemeReal.INFINITY) {
            return "+inf.0";
          }
          if (this === _SchemeReal.NEG_INFINITY) {
            return "-inf.0";
          }
          if (this === _SchemeReal.NAN) {
            return "+nan.0";
          }
          return this.value.toString();
        }
      };
      SchemeComplex = class _SchemeComplex {
        constructor(real, imaginary) {
          this.numberType = 4 /* COMPLEX */;
          this.real = real;
          this.imaginary = imaginary;
        }
        static build(real, imaginary, force2 = false) {
          return _SchemeComplex.simplify(new _SchemeComplex(real, imaginary), force2);
        }
        static simplify(complex, force2) {
          if (!force2 && atomic_equals(complex.imaginary, SchemeInteger.EXACT_ZERO)) {
            return complex.real;
          }
          return complex;
        }
        promote(nType) {
          switch (nType) {
            case 4 /* COMPLEX */:
              return this;
            default:
              throw new Error("Unable to demote complex");
          }
        }
        negate() {
          return _SchemeComplex.build(this.real.negate(), this.imaginary.negate());
        }
        equals(other) {
          return atomic_equals(this.real, other.real) && atomic_equals(this.imaginary, other.imaginary);
        }
        greaterThan(other) {
          return atomic_greater_than(this.real, other.real) && atomic_greater_than(this.imaginary, other.imaginary);
        }
        multiplicativeInverse() {
          const denominator3 = atomic_add(
            atomic_multiply(this.real, this.real),
            atomic_multiply(this.imaginary, this.imaginary)
          );
          return _SchemeComplex.build(
            atomic_multiply(denominator3.multiplicativeInverse(), this.real),
            atomic_multiply(
              denominator3.multiplicativeInverse(),
              this.imaginary.negate()
            )
          );
        }
        add(other) {
          return _SchemeComplex.build(
            atomic_add(this.real, other.real),
            atomic_add(this.imaginary, other.imaginary)
          );
        }
        multiply(other) {
          const realPart = atomic_subtract(
            atomic_multiply(this.real, other.real),
            atomic_multiply(this.imaginary, other.imaginary)
          );
          const imaginaryPart = atomic_add(
            atomic_multiply(this.real, other.imaginary),
            atomic_multiply(this.imaginary, other.real)
          );
          return _SchemeComplex.build(realPart, imaginaryPart);
        }
        getReal() {
          return this.real;
        }
        getImaginary() {
          return this.imaginary;
        }
        coerce() {
          throw new Error("Cannot coerce a complex number to a javascript number");
        }
        toPolar() {
          const real = this.real.promote(3 /* REAL */);
          const imaginary = this.imaginary.promote(3 /* REAL */);
          const magnitude3 = SchemeReal.build(
            Math.sqrt(
              real.coerce() * real.coerce() + imaginary.coerce() * imaginary.coerce()
            )
          );
          const angle3 = SchemeReal.build(
            Math.atan2(imaginary.coerce(), real.coerce())
          );
          return SchemePolar.build(magnitude3, angle3);
        }
        toString() {
          return `${this.real}+${this.imaginary}i`;
        }
      };
      SchemePolar = class _SchemePolar {
        constructor(magnitude3, angle3) {
          this.magnitude = magnitude3;
          this.angle = angle3;
        }
        static build(magnitude3, angle3) {
          return new _SchemePolar(magnitude3, angle3);
        }
        // converts the polar number back to a cartesian complex number
        toCartesian() {
          const real = SchemeReal.build(
            this.magnitude.coerce() * Math.cos(this.angle.coerce())
          );
          const imaginary = SchemeReal.build(
            this.magnitude.coerce() * Math.sin(this.angle.coerce())
          );
          return SchemeComplex.build(real, imaginary);
        }
      };
      infinity = SchemeReal.INFINITY;
      nan = SchemeReal.NAN;
      PI = SchemeReal.build(Math.PI);
      E = SchemeReal.build(Math.E);
      SQRT2 = SchemeReal.build(Math.SQRT2);
      LN2 = SchemeReal.build(Math.LN2);
      LN10 = SchemeReal.build(Math.LN10);
      LOG2E = SchemeReal.build(Math.LOG2E);
      LOG10E = SchemeReal.build(Math.LOG10E);
      SQRT1_2 = SchemeReal.build(Math.SQRT1_2);
      numerator = (n) => {
        if (!is_number(n)) {
          throw new Error("numerator: expected number");
        }
        if (!is_real(n)) {
          return is_exact(n) ? SchemeInteger.build(1) : SchemeReal.build(1);
        }
        if (!is_rational(n)) {
          const val = n.coerce();
          if (val === Infinity) {
            return SchemeReal.build(1);
          }
          if (val === -Infinity) {
            return SchemeReal.build(1);
          }
          if (isNaN(val)) {
            return SchemeReal.NAN;
          }
          if (Number.isInteger(val)) {
            return SchemeReal.build(val);
          }
          let multiplier = 1;
          while (!Number.isInteger(val * multiplier)) {
            multiplier *= 10;
          }
          let numerator3 = val * multiplier;
          let denominator3 = multiplier;
          const gcd2 = (a, b) => {
            if (b === 0) {
              return a;
            }
            return gcd2(b, a % b);
          };
          const divisor = gcd2(numerator3, denominator3);
          numerator3 = numerator3 / divisor;
          return SchemeReal.build(numerator3);
        }
        return SchemeInteger.build(
          n.promote(2 /* RATIONAL */).getNumerator()
        );
      };
      denominator = (n) => {
        if (!is_number(n)) {
          throw new Error("denominator: expected number");
        }
        if (!is_real(n)) {
          return is_exact(n) ? SchemeInteger.build(1) : SchemeReal.build(1);
        }
        if (!is_rational(n)) {
          const val = n.coerce();
          if (val === Infinity) {
            return SchemeReal.INEXACT_ZERO;
          }
          if (val === -Infinity) {
            return SchemeReal.INEXACT_ZERO;
          }
          if (isNaN(val)) {
            return SchemeReal.NAN;
          }
          if (Number.isInteger(val)) {
            return SchemeReal.build(1);
          }
          let multiplier = 1;
          while (!Number.isInteger(val * multiplier)) {
            multiplier *= 10;
          }
          let numerator3 = val * multiplier;
          let denominator3 = multiplier;
          const gcd2 = (a, b) => {
            if (b === 0) {
              return a;
            }
            return gcd2(b, a % b);
          };
          const divisor = gcd2(numerator3, denominator3);
          denominator3 = denominator3 / divisor;
          return SchemeReal.build(denominator3);
        }
        return SchemeInteger.build(
          n.promote(2 /* RATIONAL */).getDenominator()
        );
      };
      exact = (n) => {
        if (!is_number(n)) {
          throw new Error("exact: expected number");
        }
        if (is_exact(n)) {
          return n;
        }
        if (is_real(n)) {
          let multiplier = 1;
          let val = n.coerce();
          while (!Number.isInteger(val * multiplier)) {
            multiplier *= 10;
          }
          return SchemeRational.build(val * multiplier, multiplier);
        }
        return SchemeComplex.build(
          exact(n.getReal()),
          exact(n.getImaginary())
        );
      };
      inexact = (n) => {
        if (!is_number(n)) {
          throw new Error("inexact: expected number");
        }
        if (is_inexact(n)) {
          return n;
        }
        if (is_real(n)) {
          return SchemeReal.build(n.coerce());
        }
        return SchemeComplex.build(
          inexact(n.getReal()),
          inexact(n.getImaginary())
        );
      };
      expt = (n, e) => {
        if (!is_number(n) || !is_number(e)) {
          throw new Error("expt: expected numbers");
        }
        if (!is_real(n) || !is_real(e)) {
          const nPolar = n.promote(4 /* COMPLEX */).toPolar();
          const ePolar = e.promote(4 /* COMPLEX */).toPolar();
          const a = nPolar.magnitude.coerce();
          const b = nPolar.angle.coerce();
          const c = ePolar.magnitude.coerce();
          const d = ePolar.angle.coerce();
          const mag = SchemeReal.build(a ** c * Math.E ** (-b * d));
          const angle3 = SchemeReal.build(b * c * Math.log(a) + a * d);
          return SchemePolar.build(mag, angle3).toCartesian();
        }
        const base = n.coerce();
        const exponent = e.coerce();
        return SchemeReal.build(Math.pow(base, exponent));
      };
      exp = (n) => {
        if (!is_number(n)) {
          throw new Error("exp: expected number");
        }
        if (!is_real(n)) {
          throw new Error("exp: expected real number");
        }
        return SchemeReal.build(Math.exp(n.coerce()));
      };
      log = (n, base = E) => {
        if (!is_number(n) || !is_number(base)) {
          throw new Error("log: expected numbers");
        }
        if (!is_real(n) || !is_real(base)) {
          const nPolar = n.promote(4 /* COMPLEX */).toPolar();
          const basePolar = base.promote(4 /* COMPLEX */).toPolar();
          const a = nPolar.magnitude.coerce();
          const b = nPolar.angle.coerce();
          const c = basePolar.magnitude.coerce();
          const d = basePolar.angle.coerce();
          return SchemeComplex.build(
            SchemeReal.build(Math.log(a) - Math.log(c)),
            SchemeReal.build(b / d)
          );
        }
        return SchemeReal.build(Math.log(n.coerce()) / Math.log(base.coerce()));
      };
      sqrt = (n) => {
        if (!is_number(n)) {
          throw new Error("sqrt: expected number");
        }
        if (!is_real(n)) {
          const polar = n.promote(4 /* COMPLEX */).toPolar();
          const mag = polar.magnitude;
          const angle3 = polar.angle;
          const newMag = sqrt(mag);
          const newAngle = SchemeReal.build(angle3.coerce() / 2);
          return SchemePolar.build(newMag, newAngle).toCartesian();
        }
        let value = n.coerce();
        if (value < 0) {
          return SchemeComplex.build(
            SchemeReal.INEXACT_ZERO,
            SchemeReal.build(Math.sqrt(-value))
          );
        }
        return SchemeReal.build(Math.sqrt(n.coerce()));
      };
      sin = (n) => {
        if (!is_number(n)) {
          throw new Error("sin: expected number");
        }
        if (!is_real(n)) {
          const complex = n.promote(4 /* COMPLEX */);
          const real = complex.getReal();
          const imaginary = complex.getImaginary();
          const a = real.coerce();
          const b = imaginary.coerce();
          return SchemeComplex.build(
            SchemeReal.build(Math.sin(a) * (Math.exp(-b) + Math.exp(b)) / 2),
            SchemeReal.build(Math.cos(a) * (Math.exp(-b) - Math.exp(b)) / 2)
          );
        }
        return SchemeReal.build(Math.sin(n.coerce()));
      };
      cos = (n) => {
        if (!is_number(n)) {
          throw new Error("cos: expected number");
        }
        if (!is_real(n)) {
          const complex = n.promote(4 /* COMPLEX */);
          const real = complex.getReal();
          const imaginary = complex.getImaginary();
          const a = real.coerce();
          const b = imaginary.coerce();
          return SchemeComplex.build(
            SchemeReal.build(Math.cos(a) * (Math.exp(-b) + Math.exp(b)) / 2),
            SchemeReal.build(-Math.sin(a) * (Math.exp(-b) - Math.exp(b)) / 2)
          );
        }
        return SchemeReal.build(Math.cos(n.coerce()));
      };
      tan = (n) => {
        if (!is_number(n)) {
          throw new Error("tan: expected number");
        }
        if (!is_real(n)) {
          const sinValue = sin(n);
          const cosValue = cos(n);
          return atomic_divide(sinValue, cosValue);
        }
        return SchemeReal.build(Math.tan(n.coerce()));
      };
      asin = (n) => {
        if (!is_number(n)) {
          throw new Error("asin: expected number");
        }
        if (!is_real(n)) {
          const i = SchemeComplex.build(
            SchemeInteger.EXACT_ZERO,
            SchemeInteger.build(1)
          );
          return atomic_multiply(
            atomic_negate(i),
            log(
              atomic_add(
                atomic_multiply(i, n),
                sqrt(atomic_subtract(SchemeInteger.build(1), atomic_multiply(n, n)))
              )
            )
          );
        }
        return SchemeReal.build(Math.asin(n.coerce()));
      };
      acos = (n) => {
        if (!is_number(n)) {
          throw new Error("acos: expected number");
        }
        if (!is_real(n)) {
          const i = SchemeComplex.build(
            SchemeInteger.EXACT_ZERO,
            SchemeInteger.build(1)
          );
          return atomic_multiply(
            atomic_negate(i),
            log(
              atomic_add(
                n,
                sqrt(atomic_subtract(atomic_multiply(n, n), SchemeInteger.build(1)))
              )
            )
          );
        }
        return SchemeReal.build(Math.acos(n.coerce()));
      };
      atan = (n, m) => {
        if (!is_number(n)) {
          throw new Error("atan: expected number");
        }
        if (m !== void 0) {
          if (!is_real(n) || !is_real(m)) {
            throw new Error("atan: expected real numbers");
          }
          return atan(
            SchemeComplex.build(
              n,
              m
            )
          );
        }
        if (!is_real(n)) {
          const i = SchemeComplex.build(
            SchemeInteger.EXACT_ZERO,
            SchemeInteger.build(1)
          );
          return atomic_multiply(
            // multiply is associative so the order here doesn't matter
            atomic_multiply(SchemeRational.build(1, 2), i),
            log(
              atomic_divide(
                atomic_subtract(SchemeInteger.build(1), atomic_multiply(i, n)),
                atomic_add(SchemeInteger.build(1), atomic_multiply(i, n))
              )
            )
          );
        }
        return SchemeReal.build(Math.atan(n.coerce()));
      };
      floor = (n) => {
        if (!is_number(n)) {
          throw new Error("floor: expected number");
        }
        if (!is_real(n)) {
          throw new Error("floor: expected real number");
        }
        if (n.numberType === 1 /* INTEGER */) {
          return n;
        }
        if (n.numberType === 2 /* RATIONAL */) {
          const rational = n;
          const numerator3 = rational.getNumerator();
          const denominator3 = rational.getDenominator();
          return SchemeInteger.build(numerator3 / denominator3);
        }
        return SchemeReal.build(Math.floor(n.coerce()));
      };
      ceiling = (n) => {
        if (!is_number(n)) {
          throw new Error("ceiling: expected number");
        }
        if (!is_real(n)) {
          throw new Error("ceiling: expected real number");
        }
        if (n.numberType === 1 /* INTEGER */) {
          return n;
        }
        if (n.numberType === 2 /* RATIONAL */) {
          const rational = n;
          const numerator3 = rational.getNumerator();
          const denominator3 = rational.getDenominator();
          return SchemeInteger.build((numerator3 + denominator3 - 1n) / denominator3);
        }
        return SchemeReal.build(Math.ceil(n.coerce()));
      };
      truncate = (n) => {
        if (!is_number(n)) {
          throw new Error("truncate: expected number");
        }
        if (!is_real(n)) {
          throw new Error("truncate: expected real number");
        }
        if (n.numberType === 1 /* INTEGER */) {
          return n;
        }
        if (n.numberType === 2 /* RATIONAL */) {
          const rational = n;
          const numerator3 = rational.getNumerator();
          const denominator3 = rational.getDenominator();
          return SchemeInteger.build(numerator3 / denominator3);
        }
        return SchemeReal.build(Math.trunc(n.coerce()));
      };
      round = (n) => {
        if (!is_number(n)) {
          throw new Error("round: expected number");
        }
        if (!is_real(n)) {
          throw new Error("round: expected real number");
        }
        if (n.numberType === 1 /* INTEGER */) {
          return n;
        }
        if (n.numberType === 2 /* RATIONAL */) {
          const rational = n;
          const numerator3 = rational.getNumerator();
          const denominator3 = rational.getDenominator();
          return SchemeInteger.build((numerator3 + denominator3 / 2n) / denominator3);
        }
        return SchemeReal.build(Math.round(n.coerce()));
      };
      make$45$rectangular = (a, b) => {
        if (!is_number(a) || !is_number(b)) {
          throw new Error("make-rectangular: expected numbers");
        }
        if (!is_real(a) || !is_real(b)) {
          throw new Error("make-rectangular: expected real numbers");
        }
        return SchemeComplex.build(
          a,
          b
        );
      };
      make$45$polar = (a, b) => {
        if (!is_number(a) || !is_number(b)) {
          throw new Error("make-polar: expected numbers");
        }
        if (!is_real(a) || !is_real(b)) {
          throw new Error("make-polar: expected real numbers");
        }
        return SchemePolar.build(
          a.promote(3 /* REAL */),
          b.promote(3 /* REAL */)
        ).toCartesian();
      };
      real$45$part = (n) => {
        if (!is_number(n)) {
          throw new Error("real-part: expected number");
        }
        if (!is_real(n)) {
          return n.getReal();
        }
        return n;
      };
      imag$45$part = (n) => {
        if (!is_number(n)) {
          throw new Error("imag-part: expected number");
        }
        if (!is_real(n)) {
          return n.getImaginary();
        }
        return SchemeInteger.EXACT_ZERO;
      };
      magnitude = (n) => {
        if (!is_number(n)) {
          throw new Error("magnitude: expected number");
        }
        if (!is_real(n)) {
          return n.toPolar().magnitude;
        }
        if (atomic_less_than(n, SchemeInteger.EXACT_ZERO)) {
          return atomic_negate(n);
        }
        return n;
      };
      angle = (n) => {
        if (!is_number(n)) {
          throw new Error("angle: expected number");
        }
        if (!is_real(n)) {
          return n.toPolar().angle;
        }
        if (atomic_less_than(n, SchemeInteger.EXACT_ZERO)) {
          return PI;
        }
        return SchemeInteger.EXACT_ZERO;
      };
      odd$63$ = (n) => {
        if (!is_number(n)) {
          throw new Error("odd?: expected integer");
        }
        if (!is_integer(n)) {
          throw new Error("odd?: expected integer");
        }
        return n.getBigInt() % 2n === 1n;
      };
      even$63$ = (n) => {
        if (!is_number(n)) {
          throw new Error("even?: expected integer");
        }
        if (!is_integer(n)) {
          throw new Error("even?: expected integer");
        }
        return n.getBigInt() % 2n === 0n;
      };
    }
  });

  // node_modules/acorn-walk/dist/walk.js
  var require_walk = __commonJS({
    "node_modules/acorn-walk/dist/walk.js"(exports, module) {
      (function(global, factory) {
        typeof exports === "object" && typeof module !== "undefined" ? factory(exports) : typeof define === "function" && define.amd ? define(["exports"], factory) : (global = typeof globalThis !== "undefined" ? globalThis : global || self, factory((global.acorn = global.acorn || {}, global.acorn.walk = {})));
      })(exports, (function(exports2) {
        "use strict";
        function simple(node, visitors, baseVisitor, state, override) {
          if (!baseVisitor) {
            baseVisitor = base;
          }
          (function c(node2, st, override2) {
            var type = override2 || node2.type;
            baseVisitor[type](node2, st, c);
            if (visitors[type]) {
              visitors[type](node2, st);
            }
          })(node, state, override);
        }
        function ancestor(node, visitors, baseVisitor, state, override) {
          var ancestors = [];
          if (!baseVisitor) {
            baseVisitor = base;
          }
          (function c(node2, st, override2) {
            var type = override2 || node2.type;
            var isNew = node2 !== ancestors[ancestors.length - 1];
            if (isNew) {
              ancestors.push(node2);
            }
            baseVisitor[type](node2, st, c);
            if (visitors[type]) {
              visitors[type](node2, st || ancestors, ancestors);
            }
            if (isNew) {
              ancestors.pop();
            }
          })(node, state, override);
        }
        function recursive(node, state, funcs, baseVisitor, override) {
          var visitor = funcs ? make(funcs, baseVisitor || void 0) : baseVisitor;
          (function c(node2, st, override2) {
            visitor[override2 || node2.type](node2, st, c);
          })(node, state, override);
        }
        function makeTest(test) {
          if (typeof test === "string") {
            return function(type) {
              return type === test;
            };
          } else if (!test) {
            return function() {
              return true;
            };
          } else {
            return test;
          }
        }
        var Found = function Found2(node, state) {
          this.node = node;
          this.state = state;
        };
        function full(node, callback, baseVisitor, state, override) {
          if (!baseVisitor) {
            baseVisitor = base;
          }
          var last2;
          (function c(node2, st, override2) {
            var type = override2 || node2.type;
            baseVisitor[type](node2, st, c);
            if (last2 !== node2) {
              callback(node2, st, type);
              last2 = node2;
            }
          })(node, state, override);
        }
        function fullAncestor(node, callback, baseVisitor, state) {
          if (!baseVisitor) {
            baseVisitor = base;
          }
          var ancestors = [], last2;
          (function c(node2, st, override) {
            var type = override || node2.type;
            var isNew = node2 !== ancestors[ancestors.length - 1];
            if (isNew) {
              ancestors.push(node2);
            }
            baseVisitor[type](node2, st, c);
            if (last2 !== node2) {
              callback(node2, st || ancestors, ancestors, type);
              last2 = node2;
            }
            if (isNew) {
              ancestors.pop();
            }
          })(node, state);
        }
        function findNodeAt(node, start, end, test, baseVisitor, state) {
          if (!baseVisitor) {
            baseVisitor = base;
          }
          test = makeTest(test);
          try {
            (function c(node2, st, override) {
              var type = override || node2.type;
              if ((start == null || node2.start <= start) && (end == null || node2.end >= end)) {
                baseVisitor[type](node2, st, c);
              }
              if ((start == null || node2.start === start) && (end == null || node2.end === end) && test(type, node2)) {
                throw new Found(node2, st);
              }
            })(node, state);
          } catch (e) {
            if (e instanceof Found) {
              return e;
            }
            throw e;
          }
        }
        function findNodeAround(node, pos, test, baseVisitor, state) {
          test = makeTest(test);
          if (!baseVisitor) {
            baseVisitor = base;
          }
          try {
            (function c(node2, st, override) {
              var type = override || node2.type;
              if (node2.start > pos || node2.end < pos) {
                return;
              }
              baseVisitor[type](node2, st, c);
              if (test(type, node2)) {
                throw new Found(node2, st);
              }
            })(node, state);
          } catch (e) {
            if (e instanceof Found) {
              return e;
            }
            throw e;
          }
        }
        function findNodeAfter(node, pos, test, baseVisitor, state) {
          test = makeTest(test);
          if (!baseVisitor) {
            baseVisitor = base;
          }
          try {
            (function c(node2, st, override) {
              if (node2.end < pos) {
                return;
              }
              var type = override || node2.type;
              if (node2.start >= pos && test(type, node2)) {
                throw new Found(node2, st);
              }
              baseVisitor[type](node2, st, c);
            })(node, state);
          } catch (e) {
            if (e instanceof Found) {
              return e;
            }
            throw e;
          }
        }
        function findNodeBefore(node, pos, test, baseVisitor, state) {
          test = makeTest(test);
          if (!baseVisitor) {
            baseVisitor = base;
          }
          var max2;
          (function c(node2, st, override) {
            if (node2.start > pos) {
              return;
            }
            var type = override || node2.type;
            if (node2.end <= pos && (!max2 || max2.node.end < node2.end) && test(type, node2)) {
              max2 = new Found(node2, st);
            }
            baseVisitor[type](node2, st, c);
          })(node, state);
          return max2;
        }
        function make(funcs, baseVisitor) {
          var visitor = Object.create(baseVisitor || base);
          for (var type in funcs) {
            visitor[type] = funcs[type];
          }
          return visitor;
        }
        function skipThrough(node, st, c) {
          c(node, st);
        }
        function ignore(_node, _st, _c) {
        }
        var base = {};
        base.Program = base.BlockStatement = base.StaticBlock = function(node, st, c) {
          for (var i = 0, list2 = node.body; i < list2.length; i += 1) {
            var stmt = list2[i];
            c(stmt, st, "Statement");
          }
        };
        base.Statement = skipThrough;
        base.EmptyStatement = ignore;
        base.ExpressionStatement = base.ParenthesizedExpression = base.ChainExpression = function(node, st, c) {
          return c(node.expression, st, "Expression");
        };
        base.IfStatement = function(node, st, c) {
          c(node.test, st, "Expression");
          c(node.consequent, st, "Statement");
          if (node.alternate) {
            c(node.alternate, st, "Statement");
          }
        };
        base.LabeledStatement = function(node, st, c) {
          return c(node.body, st, "Statement");
        };
        base.BreakStatement = base.ContinueStatement = ignore;
        base.WithStatement = function(node, st, c) {
          c(node.object, st, "Expression");
          c(node.body, st, "Statement");
        };
        base.SwitchStatement = function(node, st, c) {
          c(node.discriminant, st, "Expression");
          for (var i = 0, list2 = node.cases; i < list2.length; i += 1) {
            var cs = list2[i];
            c(cs, st);
          }
        };
        base.SwitchCase = function(node, st, c) {
          if (node.test) {
            c(node.test, st, "Expression");
          }
          for (var i = 0, list2 = node.consequent; i < list2.length; i += 1) {
            var cons2 = list2[i];
            c(cons2, st, "Statement");
          }
        };
        base.ReturnStatement = base.YieldExpression = base.AwaitExpression = function(node, st, c) {
          if (node.argument) {
            c(node.argument, st, "Expression");
          }
        };
        base.ThrowStatement = base.SpreadElement = function(node, st, c) {
          return c(node.argument, st, "Expression");
        };
        base.TryStatement = function(node, st, c) {
          c(node.block, st, "Statement");
          if (node.handler) {
            c(node.handler, st);
          }
          if (node.finalizer) {
            c(node.finalizer, st, "Statement");
          }
        };
        base.CatchClause = function(node, st, c) {
          if (node.param) {
            c(node.param, st, "Pattern");
          }
          c(node.body, st, "Statement");
        };
        base.WhileStatement = base.DoWhileStatement = function(node, st, c) {
          c(node.test, st, "Expression");
          c(node.body, st, "Statement");
        };
        base.ForStatement = function(node, st, c) {
          if (node.init) {
            c(node.init, st, "ForInit");
          }
          if (node.test) {
            c(node.test, st, "Expression");
          }
          if (node.update) {
            c(node.update, st, "Expression");
          }
          c(node.body, st, "Statement");
        };
        base.ForInStatement = base.ForOfStatement = function(node, st, c) {
          c(node.left, st, "ForInit");
          c(node.right, st, "Expression");
          c(node.body, st, "Statement");
        };
        base.ForInit = function(node, st, c) {
          if (node.type === "VariableDeclaration") {
            c(node, st);
          } else {
            c(node, st, "Expression");
          }
        };
        base.DebuggerStatement = ignore;
        base.FunctionDeclaration = function(node, st, c) {
          return c(node, st, "Function");
        };
        base.VariableDeclaration = function(node, st, c) {
          for (var i = 0, list2 = node.declarations; i < list2.length; i += 1) {
            var decl = list2[i];
            c(decl, st);
          }
        };
        base.VariableDeclarator = function(node, st, c) {
          c(node.id, st, "Pattern");
          if (node.init) {
            c(node.init, st, "Expression");
          }
        };
        base.Function = function(node, st, c) {
          if (node.id) {
            c(node.id, st, "Pattern");
          }
          for (var i = 0, list2 = node.params; i < list2.length; i += 1) {
            var param = list2[i];
            c(param, st, "Pattern");
          }
          c(node.body, st, node.expression ? "Expression" : "Statement");
        };
        base.Pattern = function(node, st, c) {
          if (node.type === "Identifier") {
            c(node, st, "VariablePattern");
          } else if (node.type === "MemberExpression") {
            c(node, st, "MemberPattern");
          } else {
            c(node, st);
          }
        };
        base.VariablePattern = ignore;
        base.MemberPattern = skipThrough;
        base.RestElement = function(node, st, c) {
          return c(node.argument, st, "Pattern");
        };
        base.ArrayPattern = function(node, st, c) {
          for (var i = 0, list2 = node.elements; i < list2.length; i += 1) {
            var elt = list2[i];
            if (elt) {
              c(elt, st, "Pattern");
            }
          }
        };
        base.ObjectPattern = function(node, st, c) {
          for (var i = 0, list2 = node.properties; i < list2.length; i += 1) {
            var prop = list2[i];
            if (prop.type === "Property") {
              if (prop.computed) {
                c(prop.key, st, "Expression");
              }
              c(prop.value, st, "Pattern");
            } else if (prop.type === "RestElement") {
              c(prop.argument, st, "Pattern");
            }
          }
        };
        base.Expression = skipThrough;
        base.ThisExpression = base.Super = base.MetaProperty = ignore;
        base.ArrayExpression = function(node, st, c) {
          for (var i = 0, list2 = node.elements; i < list2.length; i += 1) {
            var elt = list2[i];
            if (elt) {
              c(elt, st, "Expression");
            }
          }
        };
        base.ObjectExpression = function(node, st, c) {
          for (var i = 0, list2 = node.properties; i < list2.length; i += 1) {
            var prop = list2[i];
            c(prop, st);
          }
        };
        base.FunctionExpression = base.ArrowFunctionExpression = base.FunctionDeclaration;
        base.SequenceExpression = function(node, st, c) {
          for (var i = 0, list2 = node.expressions; i < list2.length; i += 1) {
            var expr = list2[i];
            c(expr, st, "Expression");
          }
        };
        base.TemplateLiteral = function(node, st, c) {
          for (var i = 0, list2 = node.quasis; i < list2.length; i += 1) {
            var quasi = list2[i];
            c(quasi, st);
          }
          for (var i$1 = 0, list$1 = node.expressions; i$1 < list$1.length; i$1 += 1) {
            var expr = list$1[i$1];
            c(expr, st, "Expression");
          }
        };
        base.TemplateElement = ignore;
        base.UnaryExpression = base.UpdateExpression = function(node, st, c) {
          c(node.argument, st, "Expression");
        };
        base.BinaryExpression = base.LogicalExpression = function(node, st, c) {
          c(node.left, st, "Expression");
          c(node.right, st, "Expression");
        };
        base.AssignmentExpression = base.AssignmentPattern = function(node, st, c) {
          c(node.left, st, "Pattern");
          c(node.right, st, "Expression");
        };
        base.ConditionalExpression = function(node, st, c) {
          c(node.test, st, "Expression");
          c(node.consequent, st, "Expression");
          c(node.alternate, st, "Expression");
        };
        base.NewExpression = base.CallExpression = function(node, st, c) {
          c(node.callee, st, "Expression");
          if (node.arguments) {
            for (var i = 0, list2 = node.arguments; i < list2.length; i += 1) {
              var arg = list2[i];
              c(arg, st, "Expression");
            }
          }
        };
        base.MemberExpression = function(node, st, c) {
          c(node.object, st, "Expression");
          if (node.computed) {
            c(node.property, st, "Expression");
          }
        };
        base.ExportNamedDeclaration = base.ExportDefaultDeclaration = function(node, st, c) {
          if (node.declaration) {
            c(node.declaration, st, node.type === "ExportNamedDeclaration" || node.declaration.id ? "Statement" : "Expression");
          }
          if (node.source) {
            c(node.source, st, "Expression");
          }
        };
        base.ExportAllDeclaration = function(node, st, c) {
          if (node.exported) {
            c(node.exported, st);
          }
          c(node.source, st, "Expression");
        };
        base.ImportDeclaration = function(node, st, c) {
          for (var i = 0, list2 = node.specifiers; i < list2.length; i += 1) {
            var spec = list2[i];
            c(spec, st);
          }
          c(node.source, st, "Expression");
        };
        base.ImportExpression = function(node, st, c) {
          c(node.source, st, "Expression");
        };
        base.ImportSpecifier = base.ImportDefaultSpecifier = base.ImportNamespaceSpecifier = base.Identifier = base.PrivateIdentifier = base.Literal = ignore;
        base.TaggedTemplateExpression = function(node, st, c) {
          c(node.tag, st, "Expression");
          c(node.quasi, st, "Expression");
        };
        base.ClassDeclaration = base.ClassExpression = function(node, st, c) {
          return c(node, st, "Class");
        };
        base.Class = function(node, st, c) {
          if (node.id) {
            c(node.id, st, "Pattern");
          }
          if (node.superClass) {
            c(node.superClass, st, "Expression");
          }
          c(node.body, st);
        };
        base.ClassBody = function(node, st, c) {
          for (var i = 0, list2 = node.body; i < list2.length; i += 1) {
            var elt = list2[i];
            c(elt, st);
          }
        };
        base.MethodDefinition = base.PropertyDefinition = base.Property = function(node, st, c) {
          if (node.computed) {
            c(node.key, st, "Expression");
          }
          if (node.value) {
            c(node.value, st, "Expression");
          }
        };
        exports2.ancestor = ancestor;
        exports2.base = base;
        exports2.findNodeAfter = findNodeAfter;
        exports2.findNodeAround = findNodeAround;
        exports2.findNodeAt = findNodeAt;
        exports2.findNodeBefore = findNodeBefore;
        exports2.full = full;
        exports2.fullAncestor = fullAncestor;
        exports2.make = make;
        exports2.recursive = recursive;
        exports2.simple = simple;
      }));
    }
  });

  // src/stdlib/base.ts
  var base_exports = {};
  __export(base_exports, {
    $36$make$45$splice: () => $36$make$45$splice,
    $36$resolve$45$splice: () => $36$resolve$45$splice,
    $42$: () => $42$,
    $43$: () => $43$,
    $45$: () => $45$,
    $47$: () => $47$,
    $60$: () => $60$,
    $60$$61$: () => $60$$61$,
    $61$: () => $61$,
    $62$: () => $62$,
    $62$$61$: () => $62$$61$,
    E: () => E2,
    LN10: () => LN102,
    LN2: () => LN22,
    LOG10E: () => LOG10E2,
    LOG2E: () => LOG2E2,
    PI: () => PI2,
    SQRT1$47$2: () => SQRT1$47$2,
    SQRT2: () => SQRT22,
    _Symbol: () => _Symbol,
    abs: () => abs,
    acos: () => acos2,
    and: () => and,
    angle: () => angle2,
    any: () => any,
    append: () => append,
    apply: () => apply,
    asin: () => asin2,
    atan: () => atan2,
    boolean$61$$63$: () => boolean$61$$63$,
    boolean$63$: () => boolean$63$,
    caaaar: () => caaaar,
    caaadr: () => caaadr,
    caaar: () => caaar,
    caadar: () => caadar,
    caaddr: () => caaddr,
    caadr: () => caadr,
    caar: () => caar,
    cadaar: () => cadaar,
    cadadr: () => cadadr,
    cadar: () => cadar,
    caddar: () => caddar,
    cadddr: () => cadddr,
    caddr: () => caddr,
    cadr: () => cadr,
    car: () => car,
    cdaaar: () => cdaaar,
    cdaadr: () => cdaadr,
    cdaar: () => cdaar,
    cdadar: () => cdadar,
    cdaddr: () => cdaddr,
    cdadr: () => cdadr,
    cdar: () => cdar,
    cddaar: () => cddaar,
    cddadr: () => cddadr,
    cddar: () => cddar,
    cdddar: () => cdddar,
    cddddr: () => cddddr,
    cdddr: () => cdddr,
    cddr: () => cddr,
    cdr: () => cdr,
    ceiling: () => ceiling2,
    circular$45$list: () => circular$45$list,
    circular$45$list$63$: () => circular$45$list$63$,
    complex$63$: () => complex$63$,
    compose: () => compose,
    concatenate: () => concatenate,
    cons: () => cons,
    cons$42$: () => cons$42$,
    cos: () => cos2,
    denominator: () => denominator2,
    dotted$45$list$63$: () => dotted$45$list$63$,
    drop: () => drop,
    drop$45$right: () => drop$45$right,
    eighth: () => eighth,
    eq$63$: () => eq$63$,
    equal$63$: () => equal$63$,
    eqv$63$: () => eqv$63$,
    error: () => error,
    even$63$: () => even$63$2,
    exact: () => exact2,
    exact$63$: () => exact$63$,
    exp: () => exp2,
    expt: () => expt2,
    fifth: () => fifth,
    filter: () => filter,
    first: () => first,
    floor: () => floor2,
    fold: () => fold,
    fold$45$left: () => fold$45$left,
    fold$45$right: () => fold$45$right,
    force: () => force,
    fourth: () => fourth,
    gcd: () => gcd,
    imag$45$part: () => imag$45$part2,
    inexact: () => inexact2,
    inexact$63$: () => inexact$63$,
    infinity$63$: () => infinity$63$,
    integer$63$: () => integer$63$,
    last: () => last,
    last$45$pair: () => last$45$pair,
    lcm: () => lcm,
    length: () => length,
    length$43$: () => length$43$,
    list: () => list,
    list$42$: () => list$42$,
    list$45$$62$string: () => list$45$$62$string,
    list$45$$62$vector: () => list$45$$62$vector,
    list$45$copy: () => list$45$copy,
    list$45$ref: () => list$45$ref,
    list$45$set$33$: () => list$45$set$33$,
    list$45$tabulate: () => list$45$tabulate,
    list$45$tail: () => list$45$tail,
    list$61$: () => list$61$,
    list$63$: () => list$63$,
    log: () => log2,
    magnitude: () => magnitude2,
    make$45$list: () => make$45$list,
    make$45$polar: () => make$45$polar2,
    make$45$promise: () => make$45$promise,
    make$45$rectangular: () => make$45$rectangular2,
    make$45$string: () => make$45$string,
    make$45$vector: () => make$45$vector,
    make_number: () => make_number2,
    map: () => map,
    max: () => max,
    min: () => min,
    modulo: () => modulo,
    nan$63$: () => nan$63$,
    negative$63$: () => negative$63$,
    ninth: () => ninth,
    not: () => not,
    not$45$pair$63$: () => not$45$pair$63$,
    null$45$list$63$: () => null$45$list$63$,
    null$63$: () => null$63$,
    number$45$$62$string: () => number$45$$62$string,
    number$63$: () => number$63$,
    numerator: () => numerator2,
    odd$63$: () => odd$63$2,
    or: () => or,
    pair$63$: () => pair$63$,
    positive$63$: () => positive$63$,
    procedure$63$: () => procedure$63$,
    promise$45$forced$63$: () => promise$45$forced$63$,
    promise$63$: () => promise$63$,
    proper$45$list$63$: () => proper$45$list$63$,
    quotient: () => quotient,
    rational$63$: () => rational$63$,
    real$45$part: () => real$45$part2,
    real$63$: () => real$63$,
    reduce: () => reduce,
    reduce$45$left: () => reduce$45$left,
    reduce$45$right: () => reduce$45$right,
    remainder: () => remainder,
    reverse: () => reverse,
    round: () => round2,
    second: () => second,
    set$45$car$33$: () => set$45$car$33$,
    set$45$cdr$33$: () => set$45$cdr$33$,
    seventh: () => seventh,
    sin: () => sin2,
    sixth: () => sixth,
    sqrt: () => sqrt2,
    square: () => square,
    string: () => string,
    string$45$$62$list: () => string$45$$62$list,
    string$45$$62$number: () => string$45$$62$number,
    string$45$$62$symbol: () => string$45$$62$symbol,
    string$45$append: () => string$45$append,
    string$45$copy: () => string$45$copy,
    string$45$for$45$each: () => string$45$for$45$each,
    string$45$length: () => string$45$length,
    string$45$map: () => string$45$map,
    string$45$ref: () => string$45$ref,
    string$60$$61$$63$: () => string$60$$61$$63$,
    string$60$$63$: () => string$60$$63$,
    string$61$$63$: () => string$61$$63$,
    string$62$$61$$63$: () => string$62$$61$$63$,
    string$62$$63$: () => string$62$$63$,
    string$63$: () => string$63$,
    substring: () => substring,
    symbol$61$$63$: () => symbol$61$$63$,
    symbol$63$: () => symbol$63$,
    take: () => take,
    take$45$right: () => take$45$right,
    tan: () => tan2,
    tenth: () => tenth,
    third: () => third,
    truncate: () => truncate2,
    truthy: () => truthy2,
    vector: () => vector,
    vector$45$$62$list: () => vector$45$$62$list2,
    vector$45$empty$63$: () => vector$45$empty$63$,
    vector$45$fill$33$: () => vector$45$fill$33$,
    vector$45$length: () => vector$45$length,
    vector$45$ref: () => vector$45$ref,
    vector$45$set$33$: () => vector$45$set$33$,
    vector$63$: () => vector$63$,
    xcons: () => xcons,
    zero$63$: () => zero$63$
  });

  // src/stdlib/core-bool.ts
  function truthy(x) {
    return !(x === false);
  }
  function atomic_or(a, b) {
    return truthy(a) || truthy(b);
  }
  function atomic_and(a, b) {
    return truthy(a) && truthy(b);
  }
  function atomic_not(a) {
    return !truthy(a);
  }
  function is_boolean(x) {
    return x === true || x === false;
  }

  // src/stdlib/core-list.ts
  function pair(car2, cdr2) {
    const val = [car2, cdr2];
    val.pair = true;
    return val;
  }
  function vector$45$$62$list(v) {
    if (v.length === 0) {
      return null;
    }
    return pair(v[0], vector$45$$62$list(v.slice(1)));
  }

  // src/stdlib/core.ts
  init_core_math();

  // src/stdlib/source-scheme-library.ts
  init_core_math();
  function $args(func) {
    return (func + "").replace(/[/][/].*$/gm, "").replace(/\s+/g, "").replace(/[/][*][^/*]*[*][/]/g, "").split(")", 1)[0].replace(/^[^(]*[(]/, "").replace(/=[^,]+/g, "").split(",").filter(Boolean);
  }
  function schemeToString(x) {
    let str = "";
    if (x === void 0) {
      str = "undefined";
    } else if (promise$63$(x)) {
      str = `#<promise <${promise$45$forced$63$(x) ? "evaluated" : "non-evaluated"}>>`;
    } else if (circular$45$list$63$(x)) {
      str = "(";
      let p = x;
      do {
        str += schemeToString(car(p));
        p = cdr(p);
        if (p !== null) {
          str += " ";
        }
      } while (p !== x);
      str.trimEnd();
      str += "...";
    } else if (proper$45$list$63$(x)) {
      str = "(";
      let p = x;
      while (p !== null) {
        str += schemeToString(car(p));
        p = cdr(p);
        if (p !== null) {
          str += " ";
        }
      }
      str += ")";
    } else if (dotted$45$list$63$(x) && pair$63$(x)) {
      str = "(";
      let p = x;
      while (pair$63$(p)) {
        str = `${str}${schemeToString(car(p))} `;
        p = cdr(p);
      }
      str = `${str}. ${schemeToString(p)})`;
    } else if (vector$63$(x)) {
      str = "#(";
      let v = x;
      for (let i = 0; i < v.length; i++) {
        str += schemeToString(v[i]);
        if (i !== v.length - 1) {
          str += " ";
        }
      }
      str += ")";
    } else if (procedure$63$(x)) {
      str = `#<procedure (${$args(x).reduce((a, b) => `${a} ${b.replace("...", ". ")}`, "").trimStart()})>`;
    } else if (boolean$63$(x)) {
      str = x ? "#t" : "#f";
    } else {
      str = x.toString();
    }
    return str;
  }

  // src/stdlib/base.ts
  var error = (value, ...strs) => {
    const output = (strs[0] === void 0 ? "" : strs[0] + "") + schemeToString(value);
    throw new Error(output);
  };
  var make$45$promise = (thunk) => {
    return list(cons(false, thunk), new _Symbol("promise"));
  };
  var promise$63$ = (p) => {
    return pair$63$(p) && pair$63$(cdr(p)) && symbol$61$$63$(cadr(p), new _Symbol("promise"));
  };
  var force = (p) => {
    if (!promise$63$(p)) {
      error("force: expected promise");
    }
    const promise_pair = car(p);
    if (car(promise_pair)) {
      return cdr(promise_pair);
    }
    const result = cdr(promise_pair)();
    set$45$car$33$(promise_pair, true);
    set$45$cdr$33$(promise_pair, result);
    return result;
  };
  var promise$45$forced$63$ = (p) => {
    if (!promise$63$(p)) {
      return false;
    }
    return caar(p);
  };
  var identity = (x) => x;
  var compose = (...fs) => {
    return fs.reduce((f, g) => (x) => f(g(x)), identity);
  };
  var apply = (fun, ...args) => {
    const lastList = args.pop();
    if (!list$63$(lastList)) {
      error("apply: last argument must be a list");
    }
    const lastArray = [];
    let current = lastList;
    while (current !== null) {
      lastArray.push(car(current));
      current = cdr(current);
    }
    const allArgs = args.concat(lastArray);
    return fun(...allArgs);
  };
  var procedure$63$ = (p) => typeof p === "function";
  var boolean$63$ = is_boolean;
  var truthy2 = truthy;
  var atomic_or2 = atomic_or;
  var atomic_and2 = atomic_and;
  var not = atomic_not;
  var and = (...args) => args.reduce(atomic_and2, true);
  var or = (...args) => args.reduce(atomic_or2, false);
  var boolean$61$$63$ = (p1, p2) => and(boolean$63$(p1), boolean$63$(p2), or(and(p1, p2), not(or(p1, p2))));
  var make_number2 = make_number;
  var number$63$ = is_number;
  var integer$63$ = is_integer;
  var rational$63$ = is_rational;
  var real$63$ = is_real;
  var complex$63$ = is_complex;
  var exact$63$ = is_exact;
  var inexact$63$ = is_inexact;
  var atomic_negate2 = atomic_negate;
  var atomic_inverse2 = atomic_inverse;
  var atomic_less_than2 = atomic_less_than;
  var atomic_less_than_or_equals2 = atomic_less_than_or_equals;
  var atomic_greater_than2 = atomic_greater_than;
  var atomic_greater_than_or_equals2 = atomic_greater_than_or_equals;
  var atomic_equals2 = atomic_equals;
  var atomic_add2 = atomic_add;
  var atomic_subtract2 = atomic_subtract;
  var atomic_multiply2 = atomic_multiply;
  var atomic_divide2 = atomic_divide;
  var $61$ = (first2, second2, ...rest) => {
    if (rest.length === 0) {
      return atomic_equals2(first2, second2);
    }
    return atomic_equals2(first2, second2) && $61$(second2, ...rest);
  };
  var $60$ = (first2, second2, ...rest) => {
    if (rest.length === 0) {
      return atomic_less_than2(first2, second2);
    }
    return atomic_less_than2(first2, second2) && $60$(second2, ...rest);
  };
  var $60$$61$ = (first2, second2, ...rest) => {
    if (rest.length === 0) {
      return atomic_less_than_or_equals2(first2, second2);
    }
    return atomic_less_than_or_equals2(first2, second2) && $60$$61$(second2, ...rest);
  };
  var $62$ = (first2, second2, ...rest) => {
    if (rest.length === 0) {
      return atomic_greater_than2(first2, second2);
    }
    return atomic_greater_than2(first2, second2) && $62$(second2, ...rest);
  };
  var $62$$61$ = (first2, second2, ...rest) => {
    if (rest.length === 0) {
      return atomic_greater_than_or_equals2(first2, second2);
    }
    return atomic_greater_than_or_equals2(first2, second2) && $62$$61$(second2, ...rest);
  };
  var zero$63$ = (n) => $61$(n, make_number2(0));
  var infinity$63$ = (n) => $61$(n, SchemeReal.INFINITY) || $61$(n, SchemeReal.NEG_INFINITY);
  var nan$63$ = (n) => n === SchemeReal.NAN;
  var positive$63$ = (n) => $62$(n, make_number2(0));
  var negative$63$ = (n) => $60$(n, make_number2(0));
  var max = (first2, ...args) => args.reduce(
    (max2, current, index, array) => atomic_greater_than2(current, max2) ? current : max2,
    first2
  );
  var min = (first2, ...args) => args.reduce(
    (min2, current, index, array) => atomic_less_than2(current, min2) ? current : min2,
    first2
  );
  var $43$ = (...args) => args.reduce(atomic_add2, make_number2(0));
  var $45$ = (first2, ...args) => args.length === 0 ? atomic_negate2(first2) : atomic_subtract2(first2, $43$(...args));
  var $42$ = (...args) => args.reduce(atomic_multiply2, make_number2(1));
  var $47$ = (first2, ...args) => args.length === 0 ? atomic_inverse2(first2) : atomic_divide2(first2, $42$(...args));
  var abs = (n) => negative$63$(n) ? atomic_negate2(n) : n;
  var quotient = (a, b) => {
    if (!integer$63$(a) || !integer$63$(b)) {
      error("quotient: expected integers");
    }
    if (atomic_equals2(b, make_number2(0))) {
      error("quotient: division by zero");
    }
    let remainder2 = modulo(a, b);
    let quotient2 = atomic_divide2(
      atomic_subtract2(a, remainder2),
      b
    );
    if (atomic_equals2(remainder2, make_number2(0))) {
      return quotient2;
    }
    if (atomic_less_than2(a, make_number2(0)) && atomic_less_than2(b, make_number2(0))) {
      return quotient2;
    }
    if (atomic_greater_than2(a, make_number2(0)) && atomic_greater_than2(b, make_number2(0))) {
      return quotient2;
    }
    if (atomic_less_than2(a, make_number2(0))) {
      quotient2 = atomic_add2(quotient2, make_number2(1));
    }
    if (atomic_less_than2(b, make_number2(0))) {
      quotient2 = atomic_add2(quotient2, make_number2(1));
    }
    return quotient2;
  };
  var remainder = (a, b) => {
    if (!integer$63$(a) || !integer$63$(b)) {
      error("remainder: expected integers");
    }
    if (atomic_equals2(b, make_number2(0))) {
      error("remainder: division by zero");
    }
    let q = quotient(a, b);
    let remainder2 = atomic_subtract2(
      a,
      atomic_multiply2(q, b)
    );
    return remainder2;
  };
  var modulo = (a, b) => {
    if (!integer$63$(a) || !integer$63$(b)) {
      error("modulo: expected integers");
    }
    if (atomic_equals2(b, make_number2(0))) {
      error("modulo: division by zero");
    }
    let working = a;
    while (atomic_greater_than_or_equals2(abs(working), abs(b))) {
      if (atomic_less_than2(working, make_number2(0))) {
        if (atomic_less_than2(b, make_number2(0))) {
          working = atomic_subtract2(working, b);
        } else {
          working = atomic_add2(working, b);
        }
      } else {
        if (atomic_less_than2(b, make_number2(0))) {
          working = atomic_add2(working, b);
        } else {
          working = atomic_subtract2(working, b);
        }
      }
    }
    if (atomic_less_than2(working, make_number2(0))) {
      if (atomic_less_than2(b, make_number2(0))) {
        return working;
      } else {
        return atomic_add2(working, b);
      }
    } else {
      if (atomic_less_than2(b, make_number2(0))) {
        return atomic_add2(working, b);
      } else {
        return working;
      }
    }
  };
  function atomic_gcd(a, b) {
    if (atomic_equals2(b, make_number2(0))) {
      return abs(a);
    }
    return abs(atomic_gcd(b, remainder(a, b)));
  }
  var gcd = (...vals) => {
    if (vals.length === 0) {
      return SchemeInteger.EXACT_ZERO;
    }
    if (vals.length === 1) {
      return vals[0];
    }
    return vals.reduce(atomic_gcd);
  };
  function atomic_lcm(a, b) {
    return abs(atomic_multiply2(quotient(a, gcd(a, b)), b));
  }
  var lcm = (...vals) => {
    if (vals.length === 0) {
      return SchemeInteger.build(1);
    }
    if (vals.length === 1) {
      return vals[0];
    }
    return vals.reduce(atomic_lcm);
  };
  var odd$63$2 = odd$63$;
  var even$63$2 = even$63$;
  var numerator2 = numerator;
  var denominator2 = denominator;
  var exact2 = exact;
  var inexact2 = inexact;
  var square = (n) => $42$(n, n);
  var expt2 = expt;
  var exp2 = exp;
  var log2 = log;
  var sqrt2 = sqrt;
  var sin2 = sin;
  var cos2 = cos;
  var tan2 = tan;
  var asin2 = asin;
  var acos2 = acos;
  var atan2 = atan;
  var floor2 = floor;
  var ceiling2 = ceiling;
  var truncate2 = truncate;
  var round2 = round;
  var make$45$rectangular2 = make$45$rectangular;
  var make$45$polar2 = make$45$polar;
  var real$45$part2 = real$45$part;
  var imag$45$part2 = imag$45$part;
  var magnitude2 = magnitude;
  var angle2 = angle;
  var PI2 = PI;
  var E2 = E;
  var SQRT22 = SQRT2;
  var SQRT1$47$2 = SQRT1_2;
  var LN22 = LN2;
  var LN102 = LN10;
  var LOG2E2 = LOG2E;
  var LOG10E2 = LOG10E;
  var cons = pair;
  var xcons = (x, y) => pair(y, x);
  var array_test = (p) => {
    if (Array.isArray === void 0) {
      return p instanceof Array;
    }
    return Array.isArray(p);
  };
  var pair$63$ = (p) => array_test(p) && p.length === 2 && p.pair === true;
  var not$45$pair$63$ = compose(not, pair$63$);
  var set$45$car$33$ = (p, v) => {
    if (pair$63$(p)) {
      p[0] = v;
      return;
    }
    error("set-car!: expected pair");
  };
  var set$45$cdr$33$ = (p, v) => {
    if (pair$63$(p)) {
      p[1] = v;
      return;
    }
    error("set-cdr!: expected pair");
  };
  var car = (p) => {
    if (pair$63$(p)) {
      return p[0];
    }
    error("car: expected pair");
  };
  var cdr = (p) => {
    if (pair$63$(p)) {
      return p[1];
    }
    error("cdr: expected pair");
  };
  var caar = compose(car, car);
  var cadr = compose(car, cdr);
  var cdar = compose(cdr, car);
  var cddr = compose(cdr, cdr);
  var caaar = compose(car, caar);
  var caadr = compose(car, cadr);
  var cadar = compose(car, cdar);
  var caddr = compose(car, cddr);
  var cdaar = compose(cdr, caar);
  var cdadr = compose(cdr, cadr);
  var cddar = compose(cdr, cdar);
  var cdddr = compose(cdr, cddr);
  var caaaar = compose(car, caaar);
  var caaadr = compose(car, caadr);
  var caadar = compose(car, cadar);
  var caaddr = compose(car, caddr);
  var cadaar = compose(car, cdaar);
  var cadadr = compose(car, cdadr);
  var caddar = compose(car, cddar);
  var cadddr = compose(car, cdddr);
  var cdaaar = compose(cdr, caaar);
  var cdaadr = compose(cdr, caadr);
  var cdadar = compose(cdr, cadar);
  var cdaddr = compose(cdr, caddr);
  var cddaar = compose(cdr, cadaar);
  var cddadr = compose(cdr, cadadr);
  var cdddar = compose(cdr, caddar);
  var cddddr = compose(cdr, cadddr);
  var list = (...args) => {
    if (args.length === 0) {
      return null;
    }
    return cons(args[0], list(...args.slice(1)));
  };
  var null$63$ = (xs) => xs === null;
  var list$42$ = (curr, ...rest) => rest.length === 0 ? curr : cons(curr, list$42$(...rest));
  var cons$42$ = list$42$;
  var make$45$list = (n, v = make_number2(0)) => $61$(n, make_number2(0)) ? null : cons(v, make$45$list(atomic_subtract2(n, make_number2(1)), v));
  var list$45$tabulate = (n, f) => $61$(n, make_number2(0)) ? null : cons(f(n), list$45$tabulate(atomic_subtract2(n, make_number2(1)), f));
  var list$45$tail = (xs, k) => $61$(k, make_number2(0)) ? xs : list$45$tail(cdr(xs), $45$(k, make_number2(1)));
  var list$45$ref = (xs, k) => car(list$45$tail(xs, k));
  var last = (xs) => null$63$(xs) ? error("last: empty list") : null$63$(cdr(xs)) ? car(xs) : last(cdr(xs));
  var last$45$pair = (xs) => null$63$(xs) ? error("last-pair: empty list") : null$63$(cdr(xs)) ? xs : last$45$pair(cdr(xs));
  var circular$45$list = (...args) => {
    const normal_list = list(...args);
    if (null$63$(normal_list)) {
      return normal_list;
    }
    set$45$cdr$33$(last$45$pair(normal_list), normal_list);
    return normal_list;
  };
  var first = car;
  var second = cadr;
  var third = caddr;
  var fourth = cadddr;
  var fifth = compose(car, cddddr);
  var sixth = compose(cadr, cddddr);
  var seventh = compose(caddr, cddddr);
  var eighth = compose(cadddr, cddddr);
  var ninth = compose(car, cddddr, cddddr);
  var tenth = compose(cadr, cddddr, cddddr);
  var list$45$set$33$ = (xs, k, v) => set$45$car$33$(list$45$tail(xs, k), v);
  var circular$45$list$63$ = (cxs) => {
    function c_list_helper(xs, ys) {
      if (null$63$(xs) || null$63$(ys)) {
        return false;
      }
      if (not$45$pair$63$(xs) || not$45$pair$63$(ys)) {
        return false;
      }
      if (not$45$pair$63$(cdr(ys))) {
        return false;
      }
      if (xs === ys) {
        return true;
      }
      return c_list_helper(cdr(xs), cddr(ys));
    }
    if (null$63$(cxs) || not$45$pair$63$(cxs)) {
      return false;
    }
    return c_list_helper(cxs, cdr(cxs));
  };
  var proper$45$list$63$ = (pxs) => {
    function is_list(xs) {
      if (null$63$(xs)) {
        return true;
      }
      if (not$45$pair$63$(xs)) {
        return false;
      }
      return is_list(cdr(xs));
    }
    return !circular$45$list$63$(pxs) && is_list(pxs);
  };
  var dotted$45$list$63$ = (dxs) => !proper$45$list$63$(dxs) && !circular$45$list$63$(dxs);
  var null$45$list$63$ = null$63$;
  var list$63$ = proper$45$list$63$;
  var filter = (pred, xs) => null$63$(xs) ? null : pred(car(xs)) ? cons(car(xs), filter(pred, cdr(xs))) : filter(pred, cdr(xs));
  var any = (pred, xs) => null$63$(xs) ? false : pred(car(xs)) ? true : any(pred, cdr(xs));
  var map = (f, xs, ...rest) => {
    const all_lists = [xs, ...rest];
    return any(null$63$, vector$45$$62$list(all_lists)) ? null : cons(f(...all_lists.map(car)), map(f, ...all_lists.map(cdr)));
  };
  var fold = (f, acc, xs, ...rest) => {
    const all_lists = [xs, ...rest];
    return any(null$63$, vector$45$$62$list(all_lists)) ? acc : fold(f, f(acc, ...all_lists.map(car)), ...all_lists.map(cdr));
  };
  var fold$45$left = fold;
  var fold$45$right = (f, acc, xs, ...rest) => {
    const all_lists = [xs, ...rest];
    return any(null$63$, vector$45$$62$list(all_lists)) ? acc : f(...all_lists.map(car), fold$45$right(f, acc, ...all_lists.map(cdr)));
  };
  var reduce = (f, ridentity, xs) => null$63$(xs) ? ridentity : fold(f, car(xs), cdr(xs));
  var reduce$45$left = reduce;
  var reduce$45$right = (f, ridentity, xs) => null$63$(xs) ? ridentity : fold$45$right(f, car(xs), cdr(xs));
  var list$61$ = (elt, ...rest) => {
    if (rest.length === 0 || rest.length === 1) {
      return true;
    }
    const first2 = rest[0];
    const next = rest[1];
    const next_rest = rest.slice(1);
    return elt(first2, next) && list$61$(elt, ...next_rest);
  };
  var list$45$copy = (xs) => fold$45$right(cons, null, xs);
  var length = (xs) => fold$45$left(
    (acc, _) => atomic_add2(acc, make_number2(1)),
    make_number2(0),
    xs
  );
  var length$43$ = (xs) => circular$45$list$63$(xs) ? error("length: infinite list") : length(xs);
  var append = (...xss) => {
    if (xss.length === 0) {
      return null;
    }
    const first2 = xss[0];
    const rest = xss.slice(1);
    if (null$63$(first2)) {
      return append(...rest);
    }
    return cons(car(first2), append(cdr(first2), ...rest));
  };
  var concatenate = (xss) => apply(append, xss);
  var reverse = (xs) => fold$45$left(xcons, null, xs);
  var take = (xs, i) => {
    if ($61$(i, make_number2(0))) {
      return null;
    } else {
      return cons(car(xs), take(cdr(xs), atomic_subtract2(i, make_number2(1))));
    }
  };
  var take$45$right = (xs, i) => {
    const reversed_list = reverse(xs);
    return reverse(take(reversed_list, i));
  };
  var drop = (xs, i) => {
    if ($61$(i, make_number2(0))) {
      return xs;
    } else {
      return drop(cdr(xs), atomic_subtract2(i, make_number2(1)));
    }
  };
  var drop$45$right = (xs, i) => {
    const reversed_list = reverse(xs);
    return reverse(drop(reversed_list, i));
  };
  var SpliceMarker = class {
    constructor(value) {
      this.value = value;
    }
  };
  var $36$make$45$splice = (xs) => new SpliceMarker(xs);
  var $36$resolve$45$splice = (xs) => {
    if (null$63$(xs)) {
      return null;
    }
    const first2 = car(xs);
    const rest = cdr(xs);
    if (first2 instanceof SpliceMarker) {
      if (!list$63$(first2.value)) {
        error("splice: expected list");
      }
      return append(first2.value, $36$resolve$45$splice(rest));
    } else {
      return cons(first2, $36$resolve$45$splice(rest));
    }
  };
  var make$45$vector = (size, fill) => {
    const vector2 = new Array(size);
    if (fill !== void 0) {
      vector2.fill(fill);
    }
    return vector2;
  };
  var vector = (...args) => args;
  var vector$63$ = (v) => Array.isArray(v);
  var vector$45$empty$63$ = (v) => vector$63$(v) && v.length === 0;
  var vector$45$ref = (v, i) => {
    const index = coerce_to_number(i);
    if (index < 0 || index >= v.length) {
      error("vector-ref: index out of bounds");
    }
    return v[index];
  };
  var vector$45$length = (v) => make_number2(v.length);
  var vector$45$set$33$ = (v, i, x) => {
    const index = coerce_to_number(i);
    if (index < 0 || index >= v.length) {
      error("vector-set!: index out of bounds");
    }
    v[index] = x;
  };
  var vector$45$$62$list2 = vector$45$$62$list;
  var list$45$$62$vector = (l) => {
    const arr = [];
    let current = l;
    while (current !== null) {
      arr.push(car(current));
      current = cdr(current);
    }
    return arr;
  };
  var vector$45$fill$33$ = (v, fill, start, end) => {
    const s = start === void 0 ? 0 : coerce_to_number(start);
    const e = end === void 0 ? v.length : coerce_to_number(end);
    v.fill(fill, s, e);
  };
  var _Symbol = class __Symbol {
    constructor(sym) {
      this.sym = sym;
    }
    toString() {
      return this.sym;
    }
    equals(other) {
      return other instanceof __Symbol && this.sym === other.sym;
    }
  };
  var symbol$63$ = function(s) {
    return s instanceof _Symbol;
  };
  var symbol$61$$63$ = function(s1, s2) {
    return s1 instanceof _Symbol && s2 instanceof _Symbol && s1.equals(s2);
  };
  var string$45$$62$symbol = (s) => new _Symbol(s);
  var eq$63$ = function(x, y) {
    if (symbol$63$(x) && symbol$63$(y)) {
      return x.sym === y.sym;
    } else if (number$63$(x) && number$63$(y)) {
      return $61$(x, y);
    } else {
      return x === y;
    }
  };
  var eqv$63$ = eq$63$;
  var equal$63$ = function(x, y) {
    if (x === y) {
      return true;
    } else if (number$63$(x) && number$63$(y)) {
      return $61$(x, y);
    } else if (pair$63$(x) && pair$63$(y)) {
      return equal$63$(car(x), car(y)) && equal$63$(cdr(x), cdr(y));
    } else if (symbol$63$(x) && symbol$63$(y)) {
      return x.sym === y.sym;
    } else if (vector$63$(x) && vector$63$(y)) {
      if (vector$45$length(x) !== vector$45$length(y)) {
        return false;
      }
      for (let i = 0; i < vector$45$length(x); i++) {
        if (!equal$63$(x[i], y[i])) {
          return false;
        }
      }
      return true;
    } else {
      return false;
    }
  };
  var string$63$ = (s) => typeof s === "string";
  var make$45$string = (n, ch = " ") => {
    if (ch.length !== 1) {
      error("make-string: expected single character");
    }
    let result = "";
    for (let i = 0; i < coerce_to_number(n); i++) {
      result += ch;
    }
    return result;
  };
  var string = (...args) => args.join("");
  var string$45$length = (s) => make_number2(String(s.length));
  var string$45$ref = (s, i) => {
    const index = coerce_to_number(i);
    if (index < 0 || index >= s.length) {
      error("string-ref: index out of bounds");
    }
    return s[index];
  };
  var string$61$$63$ = (s1, s2) => s1 === s2;
  var string$60$$63$ = (s1, s2) => s1 < s2;
  var string$62$$63$ = (s1, s2) => s1 > s2;
  var string$60$$61$$63$ = (s1, s2) => s1 <= s2;
  var string$62$$61$$63$ = (s1, s2) => s1 >= s2;
  var substring = (s, start, end) => {
    const s_start = coerce_to_number(start);
    const s_end = end === void 0 ? s.length : coerce_to_number(end);
    if (s_start < 0 || s_end > s.length || s_start > s_end) {
      error("substring: index out of bounds");
    }
    return s.substring(s_start, s_end);
  };
  var string$45$append = string;
  var string$45$copy = (s) => s;
  var string$45$map = (f, s) => {
    let result = "";
    for (let i = 0; i < s.length; i++) {
      result += f(s[i]);
    }
    return result;
  };
  var string$45$for$45$each = (f, s) => {
    for (let i = 0; i < s.length; i++) {
      f(s[i]);
    }
  };
  var string$45$$62$number = (s) => {
    try {
      return make_number2(s);
    } catch (e) {
      error("string->number: invalid number");
    }
  };
  var number$45$$62$string = (n) => n.toString();
  var string$45$$62$list = (s) => {
    let result = null;
    for (let i = s.length - 1; i >= 0; i--) {
      result = cons(s[i], result);
    }
    return result;
  };
  var list$45$$62$string = (l) => {
    let result = "";
    let current = l;
    while (current !== null) {
      result += String(car(current));
      current = cdr(current);
    }
    return result;
  };

  // node_modules/js-base64/base64.mjs
  var _hasBuffer = typeof Buffer === "function";
  var _TD = typeof TextDecoder === "function" ? new TextDecoder() : void 0;
  var _TE = typeof TextEncoder === "function" ? new TextEncoder() : void 0;
  var b64ch = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
  var b64chs = Array.prototype.slice.call(b64ch);
  var b64tab = ((a) => {
    let tab = {};
    a.forEach((c, i) => tab[c] = i);
    return tab;
  })(b64chs);
  var b64re = /^(?:[A-Za-z\d+\/]{4})*?(?:[A-Za-z\d+\/]{2}(?:==)?|[A-Za-z\d+\/]{3}=?)?$/;
  var _fromCC = String.fromCharCode.bind(String);
  var _U8Afrom = typeof Uint8Array.from === "function" ? Uint8Array.from.bind(Uint8Array) : (it) => new Uint8Array(Array.prototype.slice.call(it, 0));
  var _mkUriSafe = (src) => src.replace(/=/g, "").replace(/[+\/]/g, (m0) => m0 == "+" ? "-" : "_");
  var _tidyB64 = (s) => s.replace(/[^A-Za-z0-9\+\/]/g, "");
  var btoaPolyfill = (bin) => {
    let u32, c0, c1, c2, asc = "";
    const pad = bin.length % 3;
    for (let i = 0; i < bin.length; ) {
      if ((c0 = bin.charCodeAt(i++)) > 255 || (c1 = bin.charCodeAt(i++)) > 255 || (c2 = bin.charCodeAt(i++)) > 255)
        throw new TypeError("invalid character found");
      u32 = c0 << 16 | c1 << 8 | c2;
      asc += b64chs[u32 >> 18 & 63] + b64chs[u32 >> 12 & 63] + b64chs[u32 >> 6 & 63] + b64chs[u32 & 63];
    }
    return pad ? asc.slice(0, pad - 3) + "===".substring(pad) : asc;
  };
  var _btoa = typeof btoa === "function" ? (bin) => btoa(bin) : _hasBuffer ? (bin) => Buffer.from(bin, "binary").toString("base64") : btoaPolyfill;
  var _fromUint8Array = _hasBuffer ? (u8a) => Buffer.from(u8a).toString("base64") : (u8a) => {
    const maxargs = 4096;
    let strs = [];
    for (let i = 0, l = u8a.length; i < l; i += maxargs) {
      strs.push(_fromCC.apply(null, u8a.subarray(i, i + maxargs)));
    }
    return _btoa(strs.join(""));
  };
  var cb_utob = (c) => {
    if (c.length < 2) {
      var cc = c.charCodeAt(0);
      return cc < 128 ? c : cc < 2048 ? _fromCC(192 | cc >>> 6) + _fromCC(128 | cc & 63) : _fromCC(224 | cc >>> 12 & 15) + _fromCC(128 | cc >>> 6 & 63) + _fromCC(128 | cc & 63);
    } else {
      var cc = 65536 + (c.charCodeAt(0) - 55296) * 1024 + (c.charCodeAt(1) - 56320);
      return _fromCC(240 | cc >>> 18 & 7) + _fromCC(128 | cc >>> 12 & 63) + _fromCC(128 | cc >>> 6 & 63) + _fromCC(128 | cc & 63);
    }
  };
  var re_utob = /[\uD800-\uDBFF][\uDC00-\uDFFFF]|[^\x00-\x7F]/g;
  var utob = (u) => u.replace(re_utob, cb_utob);
  var _encode = _hasBuffer ? (s) => Buffer.from(s, "utf8").toString("base64") : _TE ? (s) => _fromUint8Array(_TE.encode(s)) : (s) => _btoa(utob(s));
  var encode = (src, urlsafe = false) => urlsafe ? _mkUriSafe(_encode(src)) : _encode(src);
  var re_btou = /[\xC0-\xDF][\x80-\xBF]|[\xE0-\xEF][\x80-\xBF]{2}|[\xF0-\xF7][\x80-\xBF]{3}/g;
  var cb_btou = (cccc) => {
    switch (cccc.length) {
      case 4:
        var cp = (7 & cccc.charCodeAt(0)) << 18 | (63 & cccc.charCodeAt(1)) << 12 | (63 & cccc.charCodeAt(2)) << 6 | 63 & cccc.charCodeAt(3), offset = cp - 65536;
        return _fromCC((offset >>> 10) + 55296) + _fromCC((offset & 1023) + 56320);
      case 3:
        return _fromCC((15 & cccc.charCodeAt(0)) << 12 | (63 & cccc.charCodeAt(1)) << 6 | 63 & cccc.charCodeAt(2));
      default:
        return _fromCC((31 & cccc.charCodeAt(0)) << 6 | 63 & cccc.charCodeAt(1));
    }
  };
  var btou = (b) => b.replace(re_btou, cb_btou);
  var atobPolyfill = (asc) => {
    asc = asc.replace(/\s+/g, "");
    if (!b64re.test(asc))
      throw new TypeError("malformed base64.");
    asc += "==".slice(2 - (asc.length & 3));
    let u24, r1, r2;
    let binArray = [];
    for (let i = 0; i < asc.length; ) {
      u24 = b64tab[asc.charAt(i++)] << 18 | b64tab[asc.charAt(i++)] << 12 | (r1 = b64tab[asc.charAt(i++)]) << 6 | (r2 = b64tab[asc.charAt(i++)]);
      if (r1 === 64) {
        binArray.push(_fromCC(u24 >> 16 & 255));
      } else if (r2 === 64) {
        binArray.push(_fromCC(u24 >> 16 & 255, u24 >> 8 & 255));
      } else {
        binArray.push(_fromCC(u24 >> 16 & 255, u24 >> 8 & 255, u24 & 255));
      }
    }
    return binArray.join("");
  };
  var _atob = typeof atob === "function" ? (asc) => atob(_tidyB64(asc)) : _hasBuffer ? (asc) => Buffer.from(asc, "base64").toString("binary") : atobPolyfill;
  var _toUint8Array = _hasBuffer ? (a) => _U8Afrom(Buffer.from(a, "base64")) : (a) => _U8Afrom(_atob(a).split("").map((c) => c.charCodeAt(0)));
  var _decode = _hasBuffer ? (a) => Buffer.from(a, "base64").toString("utf8") : _TD ? (a) => _TD.decode(_toUint8Array(a)) : (a) => btou(_atob(a));
  var _unURI = (a) => _tidyB64(a.replace(/[-_]/g, (m0) => m0 == "-" ? "+" : "/"));
  var decode = (src) => _decode(_unURI(src));

  // src/utils/encoder-visitor.ts
  var walk = require_walk();
  function estreeEncode(ast) {
    walk.full(ast, (node) => {
      if (node.encoded === true) {
        return;
      }
      if (node.type === "Identifier") {
        node.name = encode2(node.name);
        node.encoded = true;
      }
    });
    walk.full(ast, (node) => {
      node.encoded = void 0;
    });
    return ast;
  }

  // src/transpiler/lexer/lexer-error.ts
  var LexerError = class extends SyntaxError {
    constructor(message, line, col) {
      super(message);
      this.loc = {
        line,
        column: col
      };
    }
    toString() {
      return this.message;
    }
  };
  var UnexpectedCharacterError = class extends LexerError {
    constructor(line, col, char) {
      super(`Unexpected character '${char}' (${line}:${col})`, line, col);
      this.char = char;
      this.name = "UnexpectedCharacterError";
    }
  };
  var UnexpectedEOFError = class extends LexerError {
    constructor(line, col) {
      super(`Unexpected EOF (${line}:${col})`, line, col);
      this.name = "UnexpectedEOFError";
    }
  };

  // src/transpiler/lexer/scheme-lexer.ts
  init_core_math();

  // src/transpiler/types/location.ts
  var Location = class _Location {
    constructor(start, end) {
      this.start = start;
      this.end = end;
    }
    merge(other) {
      return new _Location(this.start, other.end);
    }
  };
  var Position = class {
    constructor(line, column) {
      this.line = line;
      this.column = column;
    }
  };

  // src/transpiler/parser/parser-error.ts
  function extractLine(source, pos) {
    let lines = source.split("\n");
    return lines[pos.line - 1];
  }
  function showPoint(pos) {
    return "^".padStart(pos.column, " ");
  }
  var ParserError = class extends SyntaxError {
    constructor(message, pos) {
      super(`Syntax error at (${pos.line}:${pos.column})
${message}`);
      this.loc = pos;
    }
    toString() {
      return this.message;
    }
  };
  var UnexpectedEOFError2 = class extends ParserError {
    constructor(source, pos) {
      super(extractLine(source, pos) + "\nUnexpected EOF", pos);
      this.name = "UnexpectedEOFError";
    }
  };
  var UnexpectedFormError = class extends ParserError {
    constructor(source, pos, form) {
      super(
        extractLine(source, pos) + "\n" + showPoint(pos) + `
Unexpected '${form}'`,
        pos
      );
      this.form = form;
      this.name = "UnexpectedTokenError";
    }
  };
  var ExpectedFormError = class extends ParserError {
    constructor(source, pos, form, expected) {
      super(
        extractLine(source, pos) + "\n" + showPoint(pos) + `
Expected '${expected}' but got '${form}'`,
        pos
      );
      this.form = form;
      this.expected = expected;
      this.name = "ExpectedTokenError";
    }
  };
  var DisallowedTokenError = class extends ParserError {
    constructor(source, pos, token, chapter) {
      super(
        extractLine(source, pos) + "\n" + showPoint(pos) + `
Syntax '${token}' not allowed at Scheme \xA7${chapter}`,
        pos
      );
      this.token = token;
      this.name = "DisallowedTokenError";
    }
  };
  var UnsupportedTokenError = class extends ParserError {
    constructor(source, pos, token) {
      super(
        extractLine(source, pos) + "\n" + showPoint(pos) + `
Syntax '${token}' not supported yet`,
        pos
      );
      this.token = token;
      this.name = "UnsupportedTokenError";
    }
  };

  // src/transpiler/types/tokens/group.ts
  var Group = class _Group {
    constructor(elements) {
      this.elements = elements;
      this.location = new Location(this.firstPos(), this.lastPos());
    }
    /**
     * A constructor function for a group that enforces group invariants.
     */
    static build(elements) {
      function matchingParentheses(lParen, rParen) {
        return lParen.type === 0 /* LEFT_PAREN */ && rParen.type === 1 /* RIGHT_PAREN */ || lParen.type === 2 /* LEFT_BRACKET */ && rParen.type === 3 /* RIGHT_BRACKET */;
      }
      function isDataType(token) {
        return token.type === 6 /* IDENTIFIER */ || token.type === 7 /* NUMBER */ || token.type === 9 /* STRING */ || token.type === 8 /* BOOLEAN */;
      }
      function isShortAffector(token) {
        return token.type === 16 /* APOSTROPHE */ || token.type === 17 /* BACKTICK */ || token.type === 31 /* HASH_VECTOR */ || token.type === 18 /* COMMA */ || token.type === 19 /* COMMA_AT */;
      }
      if (elements.length === 0) {
        throw new Error("Illegal empty group. This should never happen.");
      }
      if (elements.length === 1) {
        const onlyElement = elements[0];
        if (isGroup(onlyElement)) {
          return onlyElement;
        }
        if (!isDataType(onlyElement)) {
          throw new ExpectedFormError("", onlyElement.pos, onlyElement, "<data>");
        }
        return new _Group(elements);
      }
      if (elements.length === 2) {
        const firstElement2 = elements[0];
        if (isToken(firstElement2) && isShortAffector(firstElement2)) {
          return new _Group(elements);
        }
      }
      const firstElement = elements[0];
      const lastElement = elements[elements.length - 1];
      if (isToken(firstElement) && isToken(lastElement) && matchingParentheses(firstElement, lastElement)) {
        return new _Group(elements);
      }
      const wrongGroup = new _Group(elements);
      throw new ExpectedFormError(
        "",
        wrongGroup.location.start,
        wrongGroup,
        "matching parentheses"
      );
    }
    // Get the first element of the group.
    first() {
      return this.elements[0];
    }
    // Get the first token of the group.
    firstToken() {
      const firstElement = this.first();
      if (isToken(firstElement)) {
        return firstElement;
      } else {
        return firstElement.firstToken();
      }
    }
    // Get the starting position of the first element of the group.
    firstPos() {
      return this.firstToken().pos;
    }
    // Get the last element of the group.
    last() {
      return this.elements[this.elements.length - 1];
    }
    lastToken() {
      const lastElement = this.last();
      if (isToken(lastElement)) {
        return lastElement;
      } else {
        return lastElement.lastToken();
      }
    }
    // Get the ending position of the last element of the group.
    lastPos() {
      return this.lastToken().pos;
    }
    /**
     * Check if the current group is parenthesized.
     */
    isParenthesized() {
      const firstElement = this.first();
      return isToken(firstElement) && (firstElement.type === 0 /* LEFT_PAREN */ || firstElement.type === 2 /* LEFT_BRACKET */);
    }
    /**
     * Using the invariants, we can determine if a group actually
     * represents a singular identifier.
     */
    isSingleIdentifier() {
      return !this.isParenthesized() && this.length() === 1;
    }
    /**
     * Get the internal elements of the group.
     * If the group is bounded by parentheses, the parentheses are excluded.
     * @returns All elements of the group excluding parentheses.
     */
    unwrap() {
      if (this.isParenthesized()) {
        return this.elements.slice(1, this.elements.length - 1);
      }
      return this.elements;
    }
    /**
     * Get the number of elements in the group.
     * Ignores parentheses.
     * @returns The number of elements in the group.
     */
    length() {
      return this.unwrap().length;
    }
    /**
     * @returns A string representation of the group
     */
    toString() {
      return this.elements.map((e) => e.toString()).join(" ");
    }
  };

  // src/transpiler/types/tokens/index.ts
  function isToken(datum) {
    return datum instanceof Token;
  }
  function isGroup(datum) {
    return datum instanceof Group;
  }

  // src/transpiler/types/tokens/token.ts
  var Token = class _Token {
    constructor(type, lexeme, literal, start, end, line, col) {
      this.type = type;
      this.lexeme = lexeme;
      this.literal = literal;
      this.start = start;
      this.end = end;
      this.pos = new Position(line, col);
      this.endPos = new Position(line, col + lexeme.length - 1);
    }
    /**
     * Converts a token to another representation of itself.
     * Especially useful for quotation tokens.
     * @returns A converted token.
     */
    convertToken() {
      switch (this.type) {
        case 16 /* APOSTROPHE */:
          return new _Token(
            20 /* QUOTE */,
            this.lexeme,
            this.literal,
            this.start,
            this.end,
            this.pos.line,
            this.pos.column
          );
        case 17 /* BACKTICK */:
          return new _Token(
            21 /* QUASIQUOTE */,
            this.lexeme,
            this.literal,
            this.start,
            this.end,
            this.pos.line,
            this.pos.column
          );
        case 31 /* HASH_VECTOR */:
          return new _Token(
            32 /* VECTOR */,
            this.lexeme,
            this.literal,
            this.start,
            this.end,
            this.pos.line,
            this.pos.column
          );
        case 18 /* COMMA */:
          return new _Token(
            22 /* UNQUOTE */,
            this.lexeme,
            this.literal,
            this.start,
            this.end,
            this.pos.line,
            this.pos.column
          );
        case 19 /* COMMA_AT */:
          return new _Token(
            23 /* UNQUOTE_SPLICING */,
            this.lexeme,
            this.literal,
            this.start,
            this.end,
            this.pos.line,
            this.pos.column
          );
        default:
          return this;
      }
    }
    /**
     * For debugging.
     * @returns A string representation of the token.
     */
    toString() {
      return `${this.lexeme}`;
    }
  };

  // src/transpiler/lexer/scheme-lexer.ts
  var keywords = /* @__PURE__ */ new Map([
    [".", 4 /* DOT */],
    ["if", 10 /* IF */],
    ["let", 11 /* LET */],
    ["cond", 12 /* COND */],
    ["else", 13 /* ELSE */],
    ["set!", 24 /* SET */],
    ["begin", 25 /* BEGIN */],
    ["delay", 26 /* DELAY */],
    ["quote", 20 /* QUOTE */],
    ["export", 28 /* EXPORT */],
    ["import", 27 /* IMPORT */],
    ["define", 14 /* DEFINE */],
    ["lambda", 15 /* LAMBDA */],
    ["define-syntax", 29 /* DEFINE_SYNTAX */],
    ["syntax-rules", 30 /* SYNTAX_RULES */]
  ]);
  var SchemeLexer = class {
    constructor(source) {
      this.start = 0;
      this.current = 0;
      this.line = 1;
      this.col = 0;
      this.source = source;
      this.tokens = [];
    }
    isAtEnd() {
      return this.current >= this.source.length;
    }
    advance() {
      this.col++;
      return this.source.charAt(this.current++);
    }
    jump() {
      this.start = this.current;
      this.col++;
      this.current++;
    }
    addToken(type, literal = null) {
      const text = this.source.substring(this.start, this.current);
      this.tokens.push(
        new Token(
          type,
          text,
          literal,
          this.start,
          this.current,
          this.line,
          this.col
        )
      );
    }
    scanTokens() {
      while (!this.isAtEnd()) {
        this.start = this.current;
        this.scanToken();
      }
      this.tokens.push(
        new Token(
          33 /* EOF */,
          "",
          null,
          this.start,
          this.current,
          this.line,
          this.col
        )
      );
      return this.tokens;
    }
    scanToken() {
      const c = this.advance();
      switch (c) {
        case "(":
          this.addToken(0 /* LEFT_PAREN */);
          break;
        case ")":
          this.addToken(1 /* RIGHT_PAREN */);
          break;
        case "[":
          this.addToken(2 /* LEFT_BRACKET */);
          break;
        case "]":
          this.addToken(3 /* RIGHT_BRACKET */);
          break;
        case "'":
          this.addToken(16 /* APOSTROPHE */);
          break;
        case "`":
          this.addToken(17 /* BACKTICK */);
          break;
        case ",":
          if (this.match("@")) {
            this.addToken(19 /* COMMA_AT */);
            break;
          }
          this.addToken(18 /* COMMA */);
          break;
        case "#":
          if (this.match("t") || this.match("f")) {
            this.booleanToken();
          } else if (this.match("|")) {
            this.comment();
          } else if (this.match(";")) {
            this.addToken(5 /* HASH_SEMICOLON */);
          } else if (this.peek() === "(" || this.peek() === "[") {
            this.addToken(31 /* HASH_VECTOR */);
          } else {
            throw new UnexpectedCharacterError(this.line, this.col, c);
          }
          break;
        case ";":
          while (this.peek() != "\n" && !this.isAtEnd()) this.advance();
          break;
        // double character tokens not currently needed
        case " ":
        case "\r":
        case "	":
          break;
        case "\n":
          this.line++;
          this.col = 0;
          break;
        case '"':
          this.stringToken();
          break;
        case "|":
          this.identifierTokenLoose();
          break;
        default:
          if (this.isDigit(c) || c === "-" || c === "+" || c === "." || c === "i" || // inf
          c === "n") {
            this.identifierNumberToken();
          } else if (this.isValidIdentifier(c)) {
            this.identifierToken();
          } else {
            throw new UnexpectedCharacterError(this.line, this.col, c);
          }
          break;
      }
    }
    comment() {
      while (!(this.peek() == "|" && this.peekNext() == "#") && !this.isAtEnd()) {
        if (this.peek() === "\n") {
          this.line++;
          this.col = 0;
        }
        this.advance();
      }
      if (this.isAtEnd()) {
        throw new UnexpectedEOFError(this.line, this.col);
      }
      this.jump();
      this.jump();
    }
    identifierToken() {
      while (this.isValidIdentifier(this.peek())) this.advance();
      this.addToken(this.checkKeyword());
    }
    identifierTokenLoose() {
      this.advance();
      while (this.peek() != "|" && !this.isAtEnd()) {
        if (this.peek() === "\n") {
          this.line++;
          this.col = 0;
        }
        this.advance();
      }
      if (this.isAtEnd()) {
        throw new UnexpectedEOFError(this.line, this.col);
      }
      this.advance();
      this.addToken(this.checkKeyword());
    }
    identifierNumberToken() {
      while (this.isValidIdentifier(this.peek())) {
        this.advance();
      }
      const lexeme = this.source.substring(this.start, this.current);
      if (stringIsSchemeNumber(lexeme)) {
        this.addToken(7 /* NUMBER */, lexeme);
        return;
      }
      this.addToken(this.checkKeyword());
    }
    checkKeyword() {
      var text = this.source.substring(this.start, this.current);
      if (keywords.has(text)) {
        return keywords.get(text);
      }
      return 6 /* IDENTIFIER */;
    }
    stringToken() {
      while (this.peek() != '"' && !this.isAtEnd()) {
        if (this.peek() === "\n") {
          this.line++;
          this.col = 0;
        }
        this.advance();
      }
      if (this.isAtEnd()) {
        throw new UnexpectedEOFError(this.line, this.col);
      }
      this.advance();
      const value = this.source.substring(this.start + 1, this.current - 1);
      this.addToken(9 /* STRING */, value);
    }
    booleanToken() {
      this.addToken(8 /* BOOLEAN */, this.peekPrev() === "t" ? true : false);
    }
    match(expected) {
      if (this.isAtEnd()) return false;
      if (this.source.charAt(this.current) != expected) return false;
      this.current++;
      return true;
    }
    peek() {
      if (this.isAtEnd()) return "\0";
      return this.source.charAt(this.current);
    }
    peekNext() {
      if (this.current + 1 >= this.source.length) return "\0";
      return this.source.charAt(this.current + 1);
    }
    peekPrev() {
      if (this.current - 1 < 0) return "\0";
      return this.source.charAt(this.current - 1);
    }
    isDigit(c) {
      return c >= "0" && c <= "9";
    }
    isSpecialSyntax(c) {
      return c === "(" || c === ")" || c === "[" || c === "]" || c === ";" || c === "|";
    }
    isValidIdentifier(c) {
      return !this.isWhitespace(c) && !this.isSpecialSyntax(c);
    }
    isWhitespace(c) {
      return c === " " || c === "\0" || c === "\n" || c === "\r" || c === "	";
    }
  };

  // src/transpiler/types/nodes/scheme-node-types.ts
  var Atomic;
  ((Atomic2) => {
    class Sequence {
      constructor(location, expressions) {
        this.location = location;
        this.expressions = expressions;
      }
      accept(visitor) {
        return visitor.visitSequence(this);
      }
      equals(other) {
        if (other instanceof Sequence) {
          if (this.expressions.length !== other.expressions.length) {
            return false;
          }
          for (let i = 0; i < this.expressions.length; i++) {
            if (!this.expressions[i].equals(other.expressions[i])) {
              return false;
            }
          }
          return true;
        }
        return false;
      }
    }
    Atomic2.Sequence = Sequence;
    class NumericLiteral {
      constructor(location, value) {
        this.location = location;
        this.value = value;
      }
      accept(visitor) {
        return visitor.visitNumericLiteral(this);
      }
      equals(other) {
        if (other instanceof NumericLiteral) {
          return this.value === other.value;
        }
        return false;
      }
    }
    Atomic2.NumericLiteral = NumericLiteral;
    class BooleanLiteral {
      constructor(location, value) {
        this.location = location;
        this.value = value;
      }
      accept(visitor) {
        return visitor.visitBooleanLiteral(this);
      }
      equals(other) {
        if (other instanceof BooleanLiteral) {
          return this.value === other.value;
        }
        return false;
      }
    }
    Atomic2.BooleanLiteral = BooleanLiteral;
    class StringLiteral {
      constructor(location, value) {
        this.location = location;
        this.value = value;
      }
      accept(visitor) {
        return visitor.visitStringLiteral(this);
      }
      equals(other) {
        if (other instanceof StringLiteral) {
          return this.value === other.value;
        }
        return false;
      }
    }
    Atomic2.StringLiteral = StringLiteral;
    class Lambda {
      constructor(location, body, params, rest = void 0) {
        this.location = location;
        this.params = params;
        this.rest = rest;
        this.body = body;
      }
      accept(visitor) {
        return visitor.visitLambda(this);
      }
      equals(other) {
        if (other instanceof Lambda) {
          if (this.params.length !== other.params.length) {
            return false;
          }
          for (let i = 0; i < this.params.length; i++) {
            if (!this.params[i].equals(other.params[i])) {
              return false;
            }
          }
          if (this.rest && other.rest) {
            if (!this.rest.equals(other.rest)) {
              return false;
            }
          } else if (this.rest || other.rest) {
            return false;
          }
          return this.body.equals(other.body);
        }
        return false;
      }
    }
    Atomic2.Lambda = Lambda;
    class Identifier {
      constructor(location, name) {
        this.location = location;
        this.name = name;
      }
      accept(visitor) {
        return visitor.visitIdentifier(this);
      }
      equals(other) {
        if (other instanceof Identifier) {
          return this.name === other.name;
        }
        return false;
      }
    }
    Atomic2.Identifier = Identifier;
    class Definition {
      constructor(location, name, value) {
        this.location = location;
        this.name = name;
        this.value = value;
      }
      accept(visitor) {
        return visitor.visitDefinition(this);
      }
      equals(other) {
        if (other instanceof Definition) {
          return this.name.equals(other.name) && this.value.equals(other.value);
        }
        return false;
      }
    }
    Atomic2.Definition = Definition;
    class Application {
      constructor(location, operator, operands) {
        this.location = location;
        this.operator = operator;
        this.operands = operands;
      }
      accept(visitor) {
        return visitor.visitApplication(this);
      }
      equals(other) {
        if (other instanceof Application) {
          if (!this.operator.equals(other.operator)) {
            return false;
          }
          if (this.operands.length !== other.operands.length) {
            return false;
          }
          for (let i = 0; i < this.operands.length; i++) {
            if (!this.operands[i].equals(other.operands[i])) {
              return false;
            }
          }
          return true;
        }
        return false;
      }
    }
    Atomic2.Application = Application;
    class Conditional {
      constructor(location, test, consequent, alternate) {
        this.location = location;
        this.test = test;
        this.consequent = consequent;
        this.alternate = alternate;
      }
      accept(visitor) {
        return visitor.visitConditional(this);
      }
      equals(other) {
        if (other instanceof Conditional) {
          return this.test.equals(other.test) && this.consequent.equals(other.consequent) && this.alternate.equals(other.alternate);
        }
        return false;
      }
    }
    Atomic2.Conditional = Conditional;
    class Pair {
      constructor(location, car2, cdr2) {
        this.location = location;
        this.car = car2;
        this.cdr = cdr2;
      }
      accept(visitor) {
        return visitor.visitPair(this);
      }
      equals(other) {
        if (other instanceof Pair) {
          return this.car.equals(other.car) && this.cdr.equals(other.cdr);
        }
        return false;
      }
    }
    Atomic2.Pair = Pair;
    class Nil {
      constructor(location) {
        this.location = location;
      }
      accept(visitor) {
        return visitor.visitNil(this);
      }
      equals(other) {
        return other instanceof Nil;
      }
    }
    Atomic2.Nil = Nil;
    class Symbol2 {
      constructor(location, value) {
        this.location = location;
        this.value = value;
      }
      accept(visitor) {
        return visitor.visitSymbol(this);
      }
      equals(other) {
        if (other instanceof Symbol2) {
          return this.value === other.value;
        }
        return false;
      }
    }
    Atomic2.Symbol = Symbol2;
    class SpliceMarker2 {
      constructor(location, value) {
        this.location = location;
        this.value = value;
      }
      accept(visitor) {
        return visitor.visitSpliceMarker(this);
      }
      equals(other) {
        if (other instanceof SpliceMarker2) {
          return this.value.equals(other.value);
        }
        return false;
      }
    }
    Atomic2.SpliceMarker = SpliceMarker2;
    class Reassignment {
      constructor(location, name, value) {
        this.location = location;
        this.name = name;
        this.value = value;
      }
      accept(visitor) {
        return visitor.visitReassignment(this);
      }
      equals(other) {
        if (other instanceof Reassignment) {
          return this.name.equals(other.name) && this.value.equals(other.value);
        }
        return false;
      }
    }
    Atomic2.Reassignment = Reassignment;
    class Import {
      constructor(location, source, identifiers) {
        this.location = location;
        this.source = source;
        this.identifiers = identifiers;
      }
      accept(visitor) {
        return visitor.visitImport(this);
      }
      equals(other) {
        if (other instanceof Import) {
          if (!this.source.equals(other.source)) {
            return false;
          }
          if (this.identifiers.length !== other.identifiers.length) {
            return false;
          }
          for (let i = 0; i < this.identifiers.length; i++) {
            if (!this.identifiers[i].equals(other.identifiers[i])) {
              return false;
            }
          }
          return true;
        }
        return false;
      }
    }
    Atomic2.Import = Import;
    class Export {
      constructor(location, definition) {
        this.location = location;
        this.definition = definition;
      }
      accept(visitor) {
        return visitor.visitExport(this);
      }
      equals(other) {
        if (other instanceof Export) {
          return this.definition.equals(other.definition);
        }
        return false;
      }
    }
    Atomic2.Export = Export;
    class Vector {
      constructor(location, elements) {
        this.location = location;
        this.elements = elements;
      }
      accept(visitor) {
        return visitor.visitVector(this);
      }
      equals(other) {
        if (other instanceof Vector) {
          if (this.elements.length !== other.elements.length) {
            return false;
          }
          for (let i = 0; i < this.elements.length; i++) {
            if (!this.elements[i].equals(other.elements[i])) {
              return false;
            }
          }
          return true;
        }
        return false;
      }
    }
    Atomic2.Vector = Vector;
    class DefineSyntax {
      constructor(location, name, transformer) {
        this.location = location;
        this.name = name;
        this.transformer = transformer;
      }
      accept(visitor) {
        return visitor.visitDefineSyntax(this);
      }
      equals(other) {
        if (other instanceof DefineSyntax) {
          return this.name.equals(other.name) && this.transformer.equals(other.transformer);
        }
        return false;
      }
    }
    Atomic2.DefineSyntax = DefineSyntax;
    class SyntaxRules {
      constructor(location, literals, rules) {
        this.location = location;
        this.literals = literals;
        this.rules = rules;
      }
      accept(visitor) {
        return visitor.visitSyntaxRules(this);
      }
      equals(other) {
        if (other instanceof SyntaxRules) {
          if (this.literals.length !== other.literals.length) {
            return false;
          }
          for (let i = 0; i < this.literals.length; i++) {
            if (!this.literals[i].equals(other.literals[i])) {
              return false;
            }
          }
          if (this.rules.length !== other.rules.length) {
            return false;
          }
          for (let i = 0; i < this.rules.length; i++) {
            if (!this.rules[i][0].equals(other.rules[i][0]) || !this.rules[i][1].equals(other.rules[i][1])) {
              return false;
            }
          }
          return true;
        }
        return false;
      }
    }
    Atomic2.SyntaxRules = SyntaxRules;
  })(Atomic || (Atomic = {}));
  var Extended;
  ((Extended2) => {
    class FunctionDefinition {
      constructor(location, name, body, params, rest = void 0) {
        this.location = location;
        this.name = name;
        this.body = body;
        this.params = params;
        this.rest = rest;
      }
      accept(visitor) {
        return visitor.visitFunctionDefinition(this);
      }
      equals(other) {
        if (other instanceof FunctionDefinition) {
          if (this.params.length !== other.params.length) {
            return false;
          }
          for (let i = 0; i < this.params.length; i++) {
            if (!this.params[i].equals(other.params[i])) {
              return false;
            }
          }
          if (this.rest && other.rest) {
            if (!this.rest.equals(other.rest)) {
              return false;
            }
          } else if (this.rest || other.rest) {
            return false;
          }
          return this.body.equals(other.body);
        }
        return false;
      }
    }
    Extended2.FunctionDefinition = FunctionDefinition;
    class Let {
      constructor(location, identifiers, values, body) {
        this.location = location;
        this.identifiers = identifiers;
        this.values = values;
        this.body = body;
      }
      accept(visitor) {
        return visitor.visitLet(this);
      }
      equals(other) {
        if (other instanceof Let) {
          if (this.identifiers.length !== other.identifiers.length) {
            return false;
          }
          for (let i = 0; i < this.identifiers.length; i++) {
            if (!this.identifiers[i].equals(other.identifiers[i])) {
              return false;
            }
          }
          if (this.values.length !== other.values.length) {
            return false;
          }
          for (let i = 0; i < this.values.length; i++) {
            if (!this.values[i].equals(other.values[i])) {
              return false;
            }
          }
          return this.body.equals(other.body);
        }
        return false;
      }
    }
    Extended2.Let = Let;
    class Cond {
      constructor(location, predicates, consequents, catchall) {
        this.location = location;
        this.predicates = predicates;
        this.consequents = consequents;
        this.catchall = catchall;
      }
      accept(visitor) {
        return visitor.visitCond(this);
      }
      equals(other) {
        if (other instanceof Cond) {
          if (this.predicates.length !== other.predicates.length) {
            return false;
          }
          for (let i = 0; i < this.predicates.length; i++) {
            if (!this.predicates[i].equals(other.predicates[i])) {
              return false;
            }
          }
          if (this.consequents.length !== other.consequents.length) {
            return false;
          }
          for (let i = 0; i < this.consequents.length; i++) {
            if (!this.consequents[i].equals(other.consequents[i])) {
              return false;
            }
          }
          if (this.catchall && other.catchall) {
            return this.catchall.equals(other.catchall);
          } else if (this.catchall || other.catchall) {
            return false;
          }
          return true;
        }
        return false;
      }
    }
    Extended2.Cond = Cond;
    class List {
      constructor(location, elements, terminator = void 0) {
        this.location = location;
        this.elements = elements;
        this.terminator = terminator;
      }
      accept(visitor) {
        return visitor.visitList(this);
      }
      equals(other) {
        if (other instanceof List) {
          if (this.elements.length !== other.elements.length) {
            return false;
          }
          for (let i = 0; i < this.elements.length; i++) {
            if (!this.elements[i].equals(other.elements[i])) {
              return false;
            }
          }
          if (this.terminator && other.terminator) {
            return this.terminator.equals(other.terminator);
          } else if (this.terminator || other.terminator) {
            return false;
          }
          return true;
        }
        return false;
      }
    }
    Extended2.List = List;
    class Begin {
      constructor(location, expressions) {
        this.location = location;
        this.expressions = expressions;
      }
      accept(visitor) {
        return visitor.visitBegin(this);
      }
      equals(other) {
        if (other instanceof Begin) {
          if (this.expressions.length !== other.expressions.length) {
            return false;
          }
          for (let i = 0; i < this.expressions.length; i++) {
            if (!this.expressions[i].equals(other.expressions[i])) {
              return false;
            }
          }
          return true;
        }
        return false;
      }
    }
    Extended2.Begin = Begin;
    class Delay {
      constructor(location, expression) {
        this.location = location;
        this.expression = expression;
      }
      accept(visitor) {
        return visitor.visitDelay(this);
      }
      equals(other) {
        if (other instanceof Delay) {
          return this.expression.equals(other.expression);
        }
        return false;
      }
    }
    Extended2.Delay = Delay;
  })(Extended || (Extended = {}));

  // src/transpiler/types/constants.ts
  var BASIC_CHAPTER = 1;
  var QUOTING_CHAPTER = 2;
  var VECTOR_CHAPTER = 3;
  var MUTABLE_CHAPTER = 3;
  var MACRO_CHAPTER = 5;

  // src/transpiler/parser/scheme-parser.ts
  var SchemeParser = class {
    constructor(source, tokens, chapter = Infinity) {
      this.current = 0;
      this.quoteMode = 0 /* NONE */;
      this.source = source;
      this.tokens = tokens;
      this.chapter = chapter;
    }
    advance() {
      if (!this.isAtEnd()) this.current++;
      return this.previous();
    }
    isAtEnd() {
      return this.current >= this.tokens.length;
    }
    previous() {
      return this.tokens[this.current - 1];
    }
    peek() {
      return this.tokens[this.current];
    }
    validateChapter(c, chapter) {
      if (this.chapter < chapter) {
        throw new DisallowedTokenError(
          this.source,
          c.pos,
          c,
          this.chapter
        );
      }
    }
    /**
     * Returns the location of a token.
     * @param token A token.
     * @returns The location of the token.
     */
    toLocation(token) {
      return new Location(token.pos, token.endPos);
    }
    /**
     * Helper function used to destructure a list into its elements and terminator.
     * An optional verifier is used if there are restrictions on the elements of the list.
     */
    destructureList(list2, verifier = (_x) => {
    }) {
      if (list2.length === 0) {
        return [[], void 0];
      }
      if (list2.length === 1) {
        verifier(list2[0]);
        return [[this.parseExpression(list2[0])], void 0];
      }
      const potentialDot = list2.at(-2);
      if (isToken(potentialDot) && potentialDot.type === 4 /* DOT */) {
        const cdrElement = list2.at(-1);
        const listElements2 = list2.slice(0, -2);
        verifier(cdrElement);
        listElements2.forEach(verifier);
        return [
          listElements2.map(this.parseExpression.bind(this)),
          this.parseExpression(cdrElement)
        ];
      }
      const listElements = list2;
      listElements.forEach(verifier);
      return [listElements.map(this.parseExpression.bind(this)), void 0];
    }
    /**
     * Returns a group of associated tokens.
     * Tokens are grouped by level of parentheses.
     *
     * @param openparen The opening parenthesis, if one exists.
     * @returns A group of tokens or groups of tokens.
     */
    grouping(openparen) {
      const elements = [];
      let inList = false;
      if (openparen) {
        inList = true;
        elements.push(openparen);
      }
      do {
        let c = this.advance();
        switch (c.type) {
          case 0 /* LEFT_PAREN */:
          case 2 /* LEFT_BRACKET */:
            const innerGroup = this.grouping(c);
            elements.push(innerGroup);
            break;
          case 1 /* RIGHT_PAREN */:
          case 3 /* RIGHT_BRACKET */:
            if (!inList) {
              throw new UnexpectedFormError(this.source, c.pos, c);
            }
            elements.push(c);
            inList = false;
            break;
          case 16 /* APOSTROPHE */:
          // Quoting syntax (short form)
          case 17 /* BACKTICK */:
          case 18 /* COMMA */:
          case 19 /* COMMA_AT */:
          case 31 /* HASH_VECTOR */:
            let nextGrouping;
            do {
              nextGrouping = this.grouping();
            } while (!nextGrouping);
            elements.push(this.affect(c, nextGrouping));
            break;
          case 20 /* QUOTE */:
          // Quoting syntax
          case 21 /* QUASIQUOTE */:
          case 22 /* UNQUOTE */:
          case 23 /* UNQUOTE_SPLICING */:
          case 6 /* IDENTIFIER */:
          // Atomics
          case 7 /* NUMBER */:
          case 8 /* BOOLEAN */:
          case 9 /* STRING */:
          case 4 /* DOT */:
          case 14 /* DEFINE */:
          // Chapter 1
          case 10 /* IF */:
          case 13 /* ELSE */:
          case 12 /* COND */:
          case 15 /* LAMBDA */:
          case 11 /* LET */:
          case 24 /* SET */:
          // Chapter 3
          case 25 /* BEGIN */:
          case 26 /* DELAY */:
          case 27 /* IMPORT */:
          case 28 /* EXPORT */:
          case 29 /* DEFINE_SYNTAX */:
          case 30 /* SYNTAX_RULES */:
            elements.push(c);
            break;
          case 5 /* HASH_SEMICOLON */:
            while (!this.grouping()) {
            }
            break;
          case 33 /* EOF */:
            throw new UnexpectedEOFError2(this.source, c.pos);
          default:
            throw new UnexpectedFormError(this.source, c.pos, c);
        }
      } while (inList);
      if (elements.length === 0) {
        return;
      }
      try {
        return Group.build(elements);
      } catch (e) {
        if (e instanceof ExpectedFormError) {
          throw new ExpectedFormError(
            this.source,
            e.loc,
            e.form,
            e.expected
          );
        }
        throw e;
      }
    }
    /**
     * Groups an affector token with its target.
     */
    affect(affector, target) {
      return Group.build([affector, target]);
    }
    /**
     * Parse an expression.
     * @param expr A token or a group of tokens.
     * @returns
     */
    parseExpression(expr) {
      if (isToken(expr)) {
        return this.parseToken(expr);
      }
      if (expr.isSingleIdentifier()) {
        return this.parseToken(expr.unwrap()[0]);
      }
      return this.parseGroup(expr);
    }
    parseToken(token) {
      switch (token.type) {
        case 6 /* IDENTIFIER */:
          return this.quoteMode === 0 /* NONE */ ? new Atomic.Identifier(this.toLocation(token), token.lexeme) : new Atomic.Symbol(this.toLocation(token), token.lexeme);
        // all of these are self evaluating, and so can be left alone regardless of quote mode
        case 7 /* NUMBER */:
          return new Atomic.NumericLiteral(
            this.toLocation(token),
            token.literal
          );
        case 8 /* BOOLEAN */:
          return new Atomic.BooleanLiteral(
            this.toLocation(token),
            token.literal
          );
        case 9 /* STRING */:
          return new Atomic.StringLiteral(
            this.toLocation(token),
            token.literal
          );
        default:
          if (this.quoteMode !== 0 /* NONE */ || this.chapter >= MACRO_CHAPTER) {
            return new Atomic.Symbol(this.toLocation(token), token.lexeme);
          }
          throw new UnexpectedFormError(
            this.source,
            token.pos,
            token
          );
      }
    }
    parseGroup(group) {
      if (!group.isParenthesized()) {
        return this.parseAffectorGroup(group);
      }
      switch (this.quoteMode) {
        case 0 /* NONE */:
          return this.parseNormalGroup(group);
        case 1 /* QUOTE */:
        case 2 /* QUASIQUOTE */:
          return this.parseQuotedGroup(group);
      }
    }
    /**
     * Parse a group of tokens affected by an affector.
     * Important case as affector changes quotation mode.
     *
     * @param group A group of tokens, verified to be an affector and a target.
     * @returns An expression.
     */
    parseAffectorGroup(group) {
      const [affector, target] = group.unwrap();
      switch (affector.type) {
        case 16 /* APOSTROPHE */:
        case 20 /* QUOTE */:
          this.validateChapter(affector, QUOTING_CHAPTER);
          if (this.quoteMode !== 0 /* NONE */) {
            const innerGroup = this.parseExpression(target);
            const newSymbol = new Atomic.Symbol(
              this.toLocation(affector),
              "quote"
            );
            const newLocation2 = newSymbol.location.merge(innerGroup.location);
            return new Extended.List(newLocation2, [newSymbol, innerGroup]);
          }
          this.quoteMode = 1 /* QUOTE */;
          const quotedExpression = this.parseExpression(target);
          this.quoteMode = 0 /* NONE */;
          return quotedExpression;
        case 17 /* BACKTICK */:
        case 21 /* QUASIQUOTE */:
          this.validateChapter(affector, QUOTING_CHAPTER);
          if (this.quoteMode !== 0 /* NONE */) {
            const innerGroup = this.parseExpression(target);
            const newSymbol = new Atomic.Symbol(
              this.toLocation(affector),
              "quasiquote"
            );
            const newLocation2 = newSymbol.location.merge(innerGroup.location);
            return new Extended.List(newLocation2, [newSymbol, innerGroup]);
          }
          this.quoteMode = 2 /* QUASIQUOTE */;
          const quasiquotedExpression = this.parseExpression(target);
          this.quoteMode = 0 /* NONE */;
          return quasiquotedExpression;
        case 18 /* COMMA */:
        case 22 /* UNQUOTE */:
          this.validateChapter(affector, QUOTING_CHAPTER);
          let preUnquoteMode = this.quoteMode;
          if (preUnquoteMode === 0 /* NONE */) {
            throw new UnsupportedTokenError(
              this.source,
              affector.pos,
              affector
            );
          }
          if (preUnquoteMode === 1 /* QUOTE */) {
            const innerGroup = this.parseExpression(target);
            const newSymbol = new Atomic.Symbol(
              this.toLocation(affector),
              "unquote"
            );
            const newLocation2 = newSymbol.location.merge(innerGroup.location);
            return new Extended.List(newLocation2, [newSymbol, innerGroup]);
          }
          this.quoteMode = 0 /* NONE */;
          const unquotedExpression = this.parseExpression(target);
          this.quoteMode = preUnquoteMode;
          return unquotedExpression;
        case 19 /* COMMA_AT */:
        case 23 /* UNQUOTE_SPLICING */:
          this.validateChapter(affector, QUOTING_CHAPTER);
          let preUnquoteSplicingMode = this.quoteMode;
          if (preUnquoteSplicingMode === 0 /* NONE */) {
            throw new UnexpectedFormError(
              this.source,
              affector.pos,
              affector
            );
          }
          if (preUnquoteSplicingMode === 1 /* QUOTE */) {
            const innerGroup = this.parseExpression(target);
            const newSymbol = new Atomic.Symbol(
              this.toLocation(affector),
              "unquote-splicing"
            );
            const newLocation2 = newSymbol.location.merge(innerGroup.location);
            return new Extended.List(newLocation2, [newSymbol, innerGroup]);
          }
          this.quoteMode = 0 /* NONE */;
          const unquoteSplicedExpression = this.parseExpression(target);
          this.quoteMode = preUnquoteSplicingMode;
          const newLocation = this.toLocation(affector).merge(
            unquoteSplicedExpression.location
          );
          return new Atomic.SpliceMarker(newLocation, unquoteSplicedExpression);
        case 31 /* HASH_VECTOR */:
          this.validateChapter(affector, VECTOR_CHAPTER);
          let preVectorQuoteMode = this.quoteMode;
          this.quoteMode = 1 /* QUOTE */;
          const vector2 = this.parseVector(group);
          this.quoteMode = preVectorQuoteMode;
          return vector2;
        default:
          throw new UnexpectedFormError(
            this.source,
            affector.pos,
            affector
          );
      }
    }
    parseNormalGroup(group) {
      if (group.length() === 0) {
        if (this.chapter >= MACRO_CHAPTER) {
          return new Atomic.Nil(group.location);
        }
        throw new ExpectedFormError(
          this.source,
          group.location.start,
          group,
          "non-empty group"
        );
      }
      const firstElement = group.unwrap()[0];
      if (isToken(firstElement)) {
        switch (firstElement.type) {
          // Scheme chapter 1
          case 15 /* LAMBDA */:
            this.validateChapter(firstElement, BASIC_CHAPTER);
            return this.parseLambda(group);
          case 14 /* DEFINE */:
            this.validateChapter(firstElement, BASIC_CHAPTER);
            return this.parseDefinition(group);
          case 10 /* IF */:
            this.validateChapter(firstElement, BASIC_CHAPTER);
            return this.parseConditional(group);
          case 11 /* LET */:
            this.validateChapter(firstElement, BASIC_CHAPTER);
            return this.parseLet(group);
          case 12 /* COND */:
            this.validateChapter(firstElement, BASIC_CHAPTER);
            return this.parseExtendedCond(group);
          // Scheme chapter 2
          case 20 /* QUOTE */:
          case 16 /* APOSTROPHE */:
          case 21 /* QUASIQUOTE */:
          case 17 /* BACKTICK */:
          case 22 /* UNQUOTE */:
          case 18 /* COMMA */:
          case 23 /* UNQUOTE_SPLICING */:
          case 19 /* COMMA_AT */:
            this.validateChapter(firstElement, QUOTING_CHAPTER);
            return this.parseAffectorGroup(group);
          // Scheme chapter 3
          case 25 /* BEGIN */:
            this.validateChapter(firstElement, MUTABLE_CHAPTER);
            return this.parseBegin(group);
          case 26 /* DELAY */:
            this.validateChapter(firstElement, MUTABLE_CHAPTER);
            return this.parseDelay(group);
          case 24 /* SET */:
            this.validateChapter(firstElement, MUTABLE_CHAPTER);
            return this.parseSet(group);
          // Scheme full (macros)
          case 29 /* DEFINE_SYNTAX */:
            this.validateChapter(firstElement, MACRO_CHAPTER);
            return this.parseDefineSyntax(group);
          case 30 /* SYNTAX_RULES */:
            throw new UnexpectedFormError(
              this.source,
              firstElement.pos,
              firstElement
            );
          // Scm-slang misc
          case 27 /* IMPORT */:
            this.validateChapter(firstElement, BASIC_CHAPTER);
            return this.parseImport(group);
          case 28 /* EXPORT */:
            this.validateChapter(firstElement, BASIC_CHAPTER);
            return this.parseExport(group);
          case 32 /* VECTOR */:
            this.validateChapter(firstElement, VECTOR_CHAPTER);
            return this.parseAffectorGroup(group);
          default:
            return this.parseApplication(group);
        }
      }
      return this.parseApplication(group);
    }
    /**
     * We are parsing a list/dotted list.
     */
    parseQuotedGroup(group) {
      if (group.length() === 0) {
        return new Atomic.Nil(group.location);
      }
      if (group.length() === 1) {
        const elem = [this.parseExpression(group.unwrap()[0])];
        return new Extended.List(group.location, elem);
      }
      const groupElements = group.unwrap();
      const [listElements, cdrElement] = this.destructureList(groupElements);
      return new Extended.List(group.location, listElements, cdrElement);
    }
    // _____________________CHAPTER 1_____________________
    /**
     * Parse a lambda expression.
     * @param group
     * @returns
     */
    parseLambda(group) {
      if (group.length() < 3) {
        throw new ExpectedFormError(
          this.source,
          group.location.start,
          group,
          "(lambda (<identifier>* . <rest-identifier>?) <body>+) | (lambda <rest-identifer> <body>+)"
        );
      }
      const elements = group.unwrap();
      const formals = elements[1];
      const body = elements.slice(2);
      let convertedFormals = [];
      let convertedRest = void 0;
      if (isToken(formals)) {
        if (formals.type !== 6 /* IDENTIFIER */) {
          throw new ExpectedFormError(
            this.source,
            formals.pos,
            formals,
            "<rest-identifier>"
          );
        }
        convertedRest = new Atomic.Identifier(
          this.toLocation(formals),
          formals.lexeme
        );
      } else {
        const formalsElements = formals.unwrap();
        [convertedFormals, convertedRest] = this.destructureList(
          formalsElements,
          // pass in a verifier that checks if the elements are identifiers
          (formal) => {
            if (!isToken(formal)) {
              throw new ExpectedFormError(
                this.source,
                formal.pos,
                formal,
                "<identifier>"
              );
            }
            if (formal.type !== 6 /* IDENTIFIER */) {
              throw new ExpectedFormError(
                this.source,
                formal.pos,
                formal,
                "<identifier>"
              );
            }
          }
        );
      }
      const convertedBody = body.map(
        this.parseExpression.bind(this)
      );
      if (convertedBody.length < 1) {
        throw new ExpectedFormError(
          this.source,
          group.location.start,
          group,
          "(lambda ... <body>+)"
        );
      }
      if (convertedBody.length === 1) {
        return new Atomic.Lambda(
          group.location,
          convertedBody[0],
          convertedFormals,
          convertedRest
        );
      }
      const newLocation = convertedBody.at(0).location.merge(convertedBody.at(-1).location);
      const bodySequence = new Atomic.Sequence(newLocation, convertedBody);
      return new Atomic.Lambda(
        group.location,
        bodySequence,
        convertedFormals,
        convertedRest
      );
    }
    /**
     * Parse a define expression.
     * @param group
     * @returns
     */
    parseDefinition(group) {
      if (group.length() < 3) {
        throw new ExpectedFormError(
          this.source,
          group.location.start,
          group,
          "(define <identifier> <expr>) | (define (<identifier> <formals>) <body>+)"
        );
      }
      const elements = group.unwrap();
      const identifier = elements[1];
      const expr = elements.slice(2);
      let convertedIdentifier;
      let convertedFormals = [];
      let convertedRest = void 0;
      let isFunctionDefinition = false;
      if (isGroup(identifier)) {
        isFunctionDefinition = true;
        const identifierElements = identifier.unwrap();
        const functionName = identifierElements[0];
        const formals = identifierElements.splice(1);
        if (!isToken(functionName)) {
          throw new ExpectedFormError(
            this.source,
            functionName.location.start,
            functionName,
            "<identifier>"
          );
        }
        if (functionName.type !== 6 /* IDENTIFIER */) {
          throw new ExpectedFormError(
            this.source,
            functionName.pos,
            functionName,
            "<identifier>"
          );
        }
        convertedIdentifier = new Atomic.Identifier(
          this.toLocation(functionName),
          functionName.lexeme
        );
        [convertedFormals, convertedRest] = this.destructureList(
          formals,
          (formal) => {
            if (!isToken(formal)) {
              throw new ExpectedFormError(
                this.source,
                formal.pos,
                formal,
                "<identifier>"
              );
            }
            if (formal.type !== 6 /* IDENTIFIER */) {
              throw new ExpectedFormError(
                this.source,
                formal.pos,
                formal,
                "<identifier>"
              );
            }
          }
        );
      } else if (identifier.type !== 6 /* IDENTIFIER */) {
        throw new ExpectedFormError(
          this.source,
          identifier.pos,
          identifier,
          "<identifier>"
        );
      } else {
        convertedIdentifier = new Atomic.Identifier(
          this.toLocation(identifier),
          identifier.lexeme
        );
        isFunctionDefinition = false;
      }
      if (expr.length < 1) {
        throw new ExpectedFormError(
          this.source,
          group.location.start,
          group,
          "(define ... <body>+)"
        );
      }
      if (isFunctionDefinition) {
        const convertedBody = expr.map(
          this.parseExpression.bind(this)
        );
        if (convertedBody.length === 1) {
          return new Extended.FunctionDefinition(
            group.location,
            convertedIdentifier,
            convertedBody[0],
            convertedFormals,
            convertedRest
          );
        }
        const newLocation = convertedBody.at(0).location.merge(convertedBody.at(-1).location);
        const bodySequence = new Atomic.Sequence(newLocation, convertedBody);
        return new Extended.FunctionDefinition(
          group.location,
          convertedIdentifier,
          bodySequence,
          convertedFormals,
          convertedRest
        );
      }
      if (expr.length > 1) {
        throw new ExpectedFormError(
          this.source,
          group.location.start,
          group,
          "(define <identifier> <expr>)"
        );
      }
      const convertedExpr = this.parseExpression(expr[0]);
      return new Atomic.Definition(
        group.location,
        convertedIdentifier,
        convertedExpr
      );
    }
    /**
     * Parse a conditional expression.
     * @param group
     * @returns
     */
    parseConditional(group) {
      if (group.length() < 3 || group.length() > 4) {
        throw new ExpectedFormError(
          this.source,
          group.location.start,
          group,
          "(if <pred> <cons> <alt>?)"
        );
      }
      const elements = group.unwrap();
      const test = elements[1];
      const consequent = elements[2];
      const alternate = group.length() > 3 ? elements[3] : void 0;
      const convertedTest = this.parseExpression(test);
      const convertedConsequent = this.parseExpression(consequent);
      const convertedAlternate = alternate ? this.parseExpression(alternate) : new Atomic.Identifier(group.location, "undefined");
      return new Atomic.Conditional(
        group.location,
        convertedTest,
        convertedConsequent,
        convertedAlternate
      );
    }
    /**
     * Parse an application expression.
     */
    parseApplication(group) {
      if (group.length() < 1) {
        throw new ExpectedFormError(
          this.source,
          group.location.start,
          group,
          "(<func> <args>*)"
        );
      }
      const elements = group.unwrap();
      const operator = elements[0];
      const operands = elements.splice(1);
      const convertedOperator = this.parseExpression(operator);
      const convertedOperands = [];
      for (const operand of operands) {
        convertedOperands.push(this.parseExpression(operand));
      }
      return new Atomic.Application(
        group.location,
        convertedOperator,
        convertedOperands
      );
    }
    /**
     * Parse a let expression.
     * @param group
     * @returns
     */
    parseLet(group) {
      if (this.chapter >= MACRO_CHAPTER) {
        const groupItems = group.unwrap().slice(1);
        groupItems.forEach((item) => {
          this.parseExpression(item);
        });
        return new Extended.Let(
          group.location,
          [],
          [],
          new Atomic.Identifier(group.location, "undefined")
        );
      }
      if (group.length() < 3) {
        throw new ExpectedFormError(
          this.source,
          group.location.start,
          group,
          "(let ((<identifier> <value>)*) <body>+)"
        );
      }
      const elements = group.unwrap();
      const bindings = elements[1];
      const body = elements.slice(2);
      if (!isGroup(bindings)) {
        throw new ExpectedFormError(
          this.source,
          bindings.pos,
          bindings,
          "((<identifier> <value>)*)"
        );
      }
      const convertedIdentifiers = [];
      const convertedValues = [];
      const bindingElements = bindings.unwrap();
      for (const bindingElement of bindingElements) {
        if (!isGroup(bindingElement)) {
          throw new ExpectedFormError(
            this.source,
            bindingElement.pos,
            bindingElement,
            "(<identifier> <value>)"
          );
        }
        if (bindingElement.length() !== 2) {
          throw new ExpectedFormError(
            this.source,
            bindingElement.location.start,
            bindingElement,
            "(<identifier> <value>)"
          );
        }
        const [identifier, value] = bindingElement.unwrap();
        if (!isToken(identifier)) {
          throw new ExpectedFormError(
            this.source,
            identifier.location.start,
            identifier,
            "<identifier>"
          );
        }
        if (identifier.type !== 6 /* IDENTIFIER */) {
          throw new ExpectedFormError(
            this.source,
            identifier.pos,
            identifier,
            "<identifier>"
          );
        }
        convertedIdentifiers.push(
          new Atomic.Identifier(this.toLocation(identifier), identifier.lexeme)
        );
        convertedValues.push(this.parseExpression(value));
      }
      const convertedBody = body.map(
        this.parseExpression.bind(this)
      );
      if (convertedBody.length < 1) {
        throw new ExpectedFormError(
          this.source,
          group.location.start,
          group,
          "(let ... <body>+)"
        );
      }
      if (convertedBody.length === 1) {
        return new Extended.Let(
          group.location,
          convertedIdentifiers,
          convertedValues,
          convertedBody[0]
        );
      }
      const newLocation = convertedBody.at(0).location.merge(convertedBody.at(-1).location);
      const bodySequence = new Atomic.Sequence(newLocation, convertedBody);
      return new Extended.Let(
        group.location,
        convertedIdentifiers,
        convertedValues,
        bodySequence
      );
    }
    /**
     * Parse an extended cond expression.
     * @param group
     * @returns
     */
    parseExtendedCond(group) {
      if (this.chapter >= MACRO_CHAPTER) {
        const groupItems = group.unwrap().slice(1);
        groupItems.forEach((item) => {
          this.parseExpression(item);
        });
        return new Extended.Cond(
          group.location,
          [],
          [],
          new Atomic.Identifier(group.location, "undefined")
        );
      }
      if (group.length() < 2) {
        throw new ExpectedFormError(
          this.source,
          group.location.start,
          group,
          "(cond (<pred> <body>*)* (else <val>)?)"
        );
      }
      const elements = group.unwrap();
      const clauses = elements.splice(1);
      const lastClause = clauses.pop();
      const convertedClauses = [];
      const convertedConsequents = [];
      for (const clause of clauses) {
        if (!isGroup(clause)) {
          throw new ExpectedFormError(
            this.source,
            clause.pos,
            clause,
            "(<pred> <body>*)"
          );
        }
        if (clause.length() < 1) {
          throw new ExpectedFormError(
            this.source,
            clause.firstToken().pos,
            clause.firstToken(),
            "(<pred> <body>*)"
          );
        }
        const [test2, ...consequent2] = clause.unwrap();
        if (isToken(test2) && test2.type === 13 /* ELSE */) {
          throw new ExpectedFormError(
            this.source,
            test2.pos,
            test2,
            "<predicate>"
          );
        }
        const convertedTest = this.parseExpression(test2);
        const consequentExpressions2 = consequent2.map(
          this.parseExpression.bind(this)
        );
        const consequentLocation2 = consequent2.length < 1 ? convertedTest.location : consequentExpressions2.at(0).location.merge(consequentExpressions2.at(-1).location);
        const convertedConsequent = consequent2.length < 1 ? convertedTest : consequent2.length < 2 ? consequentExpressions2[0] : new Atomic.Sequence(consequentLocation2, consequentExpressions2);
        convertedClauses.push(convertedTest);
        convertedConsequents.push(convertedConsequent);
      }
      if (!isGroup(lastClause)) {
        throw new ExpectedFormError(
          this.source,
          lastClause.pos,
          lastClause,
          "(<pred> <body>+) | (else <val>)"
        );
      }
      if (lastClause.length() < 2) {
        throw new ExpectedFormError(
          this.source,
          lastClause.firstToken().pos,
          lastClause.firstToken(),
          "(<pred> <body>+) | (else <val>)"
        );
      }
      const [test, ...consequent] = lastClause.unwrap();
      let isElse = false;
      if (isToken(test) && test.type === 13 /* ELSE */) {
        isElse = true;
        if (consequent.length !== 1) {
          throw new ExpectedFormError(
            this.source,
            lastClause.location.start,
            lastClause,
            "(else <val>)"
          );
        }
      }
      if (consequent.length < 1) {
        throw new ExpectedFormError(
          this.source,
          lastClause.location.start,
          lastClause,
          "(<pred> <body>+)"
        );
      }
      const consequentExpressions = consequent.map(
        this.parseExpression.bind(this)
      );
      const consequentLocation = consequentExpressions.at(0).location.merge(consequentExpressions.at(-1).location);
      const lastConsequent = consequent.length === 1 ? consequentExpressions[0] : new Atomic.Sequence(consequentLocation, consequentExpressions);
      if (isElse) {
        return new Extended.Cond(
          group.location,
          convertedClauses,
          convertedConsequents,
          lastConsequent
        );
      }
      const lastTest = this.parseExpression(test);
      convertedClauses.push(lastTest);
      convertedConsequents.push(lastConsequent);
      return new Extended.Cond(
        group.location,
        convertedClauses,
        convertedConsequents
      );
    }
    // _____________________CHAPTER 3_____________________
    /**
     * Parse a reassignment expression.
     * @param group
     * @returns
     */
    parseSet(group) {
      if (group.length() !== 3) {
        throw new ExpectedFormError(
          this.source,
          group.location.start,
          group,
          "(set! <identifier> <expr>)"
        );
      }
      const elements = group.unwrap();
      const identifier = elements[1];
      const expr = elements[2];
      if (isGroup(identifier)) {
        throw new ExpectedFormError(
          this.source,
          identifier.location.start,
          identifier,
          "<identifier>"
        );
      }
      if (identifier.type !== 6 /* IDENTIFIER */) {
        throw new ExpectedFormError(
          this.source,
          identifier.pos,
          identifier,
          "<identifier>"
        );
      }
      const convertedIdentifier = new Atomic.Identifier(
        this.toLocation(identifier),
        identifier.lexeme
      );
      const convertedExpr = this.parseExpression(expr);
      return new Atomic.Reassignment(
        group.location,
        convertedIdentifier,
        convertedExpr
      );
    }
    /**
     * Parse a begin expression.
     * @param group
     * @returns
     */
    parseBegin(group) {
      if (group.length() < 2) {
        throw new ExpectedFormError(
          this.source,
          group.location.start,
          group,
          "(begin <body>+)"
        );
      }
      const sequence = group.unwrap();
      const sequenceElements = sequence.slice(1);
      const convertedExpressions = [];
      for (const sequenceElement of sequenceElements) {
        convertedExpressions.push(this.parseExpression(sequenceElement));
      }
      return new Extended.Begin(group.location, convertedExpressions);
    }
    /**
     * Parse a delay expression.
     * @param group
     * @returns
     */
    parseDelay(group) {
      if (this.chapter >= MACRO_CHAPTER) {
        const groupItems = group.unwrap().slice(1);
        groupItems.forEach((item) => {
          this.parseExpression(item);
        });
        return new Extended.Delay(
          group.location,
          new Atomic.Identifier(group.location, "undefined")
        );
      }
      if (group.length() !== 2) {
        throw new ExpectedFormError(
          this.source,
          group.location.start,
          group,
          "(delay <expr>)"
        );
      }
      const elements = group.unwrap();
      const expr = elements[1];
      const convertedExpr = this.parseExpression(expr);
      return new Extended.Delay(group.location, convertedExpr);
    }
    // _____________________CHAPTER 3_____________________
    /**
     * Parse a define-syntax expression.
     * @param group
     * @returns nothing, this is for verification only.
     */
    parseDefineSyntax(group) {
      if (group.length() !== 3) {
        throw new ExpectedFormError(
          this.source,
          group.location.start,
          group,
          "(define-syntax <identifier> <transformer>)"
        );
      }
      const elements = group.unwrap();
      const identifier = elements[1];
      const transformer = elements[2];
      this.quoteMode = 1 /* QUOTE */;
      const convertedIdentifier = this.parseExpression(
        identifier
      );
      this.quoteMode = 0 /* NONE */;
      if (!(convertedIdentifier instanceof Atomic.Symbol)) {
        throw new ExpectedFormError(
          this.source,
          convertedIdentifier.location.start,
          identifier,
          "<identifier>"
        );
      }
      if (!isGroup(transformer)) {
        throw new ExpectedFormError(
          this.source,
          transformer.pos,
          transformer,
          "<transformer>"
        );
      }
      if (transformer.length() < 2) {
        throw new ExpectedFormError(
          this.source,
          transformer.firstToken().pos,
          transformer,
          "(syntax-rules ...)"
        );
      }
      const transformerToken = transformer.unwrap()[0];
      if (!isToken(transformer.unwrap()[0])) {
        throw new ExpectedFormError(
          this.source,
          transformer.firstToken().pos,
          transformerToken,
          "syntax-rules"
        );
      }
      if (transformerToken.type !== 30 /* SYNTAX_RULES */) {
        throw new ExpectedFormError(
          this.source,
          transformerToken.pos,
          transformerToken,
          "syntax-rules"
        );
      }
      const convertedTransformer = this.parseSyntaxRules(
        transformer
      );
      return new Atomic.DefineSyntax(
        group.location,
        convertedIdentifier,
        convertedTransformer
      );
    }
    /**
     * Helper function to verify the validity of a pattern.
     * @param pattern
     * @returns validity of the pattern
     */
    isValidPattern(pattern) {
      if (pattern instanceof Extended.List) {
        const isProper = pattern.terminator === void 0;
        if (isProper) {
          const ellipsisCount = pattern.elements.filter(
            (item) => item instanceof Atomic.Symbol && item.value === "..."
          ).length;
          if (ellipsisCount > 1) {
            return false;
          }
          const ellipsisIndex = pattern.elements.findIndex(
            (item) => item instanceof Atomic.Symbol && item.value === "..."
          );
          if (ellipsisIndex != -1) {
            if (ellipsisIndex === 0) {
              return false;
            }
          }
          for (const element of pattern.elements) {
            if (!this.isValidPattern(element)) {
              return false;
            }
          }
          return true;
        } else {
          const ellipsisCount = pattern.elements.filter(
            (item) => item instanceof Atomic.Symbol && item.value === "..."
          ).length;
          if (ellipsisCount > 1) {
            return false;
          }
          const ellipsisIndex = pattern.elements.findIndex(
            (item) => item instanceof Atomic.Symbol && item.value === "..."
          );
          if (ellipsisIndex != -1) {
            if (ellipsisIndex === 0) {
              return false;
            }
            if (ellipsisIndex === pattern.elements.length - 1) {
              return false;
            }
          }
          for (const element of pattern.elements) {
            if (!this.isValidPattern(element)) {
              return false;
            }
          }
          return this.isValidPattern(pattern.terminator);
        }
      } else if (pattern instanceof Atomic.Symbol || pattern instanceof Atomic.BooleanLiteral || pattern instanceof Atomic.NumericLiteral || pattern instanceof Atomic.StringLiteral || pattern instanceof Atomic.Nil) {
        return true;
      } else {
        return false;
      }
    }
    /**
     * Helper function to verify the validity of a template.
     * @param template
     * @returns validity of the template
     */
    isValidTemplate(template) {
      if (template instanceof Extended.List) {
        const isProper = template.terminator === void 0;
        if (isProper) {
          if (template.elements.length === 0) {
            return false;
          }
          if (template.elements.length === 2 && template.elements[0] instanceof Atomic.Symbol && template.elements[0].value === "...") {
            return this.isValidTemplate(template.elements[1]);
          }
          let ellipsisWorksOnLastElement = false;
          for (let i = 0; i < template.elements.length; i++) {
            const element = template.elements[i];
            if (element instanceof Atomic.Symbol && element.value === "...") {
              if (ellipsisWorksOnLastElement) {
                ellipsisWorksOnLastElement = false;
                continue;
              }
              return false;
            } else {
              if (!this.isValidTemplate(element)) {
                return false;
              }
              ellipsisWorksOnLastElement = true;
            }
          }
          return true;
        } else {
          if (template.elements.length === 0) {
            return false;
          }
          let ellipsisWorksOnLastElement = false;
          for (let i = 0; i < template.elements.length; i++) {
            const element = template.elements[i];
            if (element instanceof Atomic.Symbol && element.value === "...") {
              if (ellipsisWorksOnLastElement) {
                ellipsisWorksOnLastElement = false;
                continue;
              }
              return false;
            } else {
              if (!this.isValidTemplate(element)) {
                return false;
              }
              ellipsisWorksOnLastElement = true;
            }
          }
          return this.isValidTemplate(template.terminator);
        }
      } else if (template instanceof Atomic.Symbol || template instanceof Atomic.BooleanLiteral || template instanceof Atomic.NumericLiteral || template instanceof Atomic.StringLiteral || template instanceof Atomic.Nil) {
        return true;
      } else {
        return false;
      }
    }
    /**
     * Parse a syntax-rules expression.
     * @param group
     * @returns nothing, this is for verification only.
     */
    parseSyntaxRules(group) {
      if (group.length() < 3) {
        throw new ExpectedFormError(
          this.source,
          group.location.start,
          group,
          "(syntax-rules (<literal>*) <syntax-rule>+)"
        );
      }
      const elements = group.unwrap();
      const literals = elements[1];
      const rules = elements.slice(2);
      const finalLiterals = [];
      if (!isGroup(literals)) {
        throw new ExpectedFormError(
          this.source,
          literals.pos,
          literals,
          "(<literal>*)"
        );
      }
      this.quoteMode = 1 /* QUOTE */;
      for (const literal of literals.unwrap()) {
        if (!isToken(literal)) {
          throw new ExpectedFormError(
            this.source,
            literal.location.start,
            literal,
            "<literal>"
          );
        }
        const convertedLiteral = this.parseExpression(literal);
        if (!(convertedLiteral instanceof Atomic.Symbol)) {
          throw new ExpectedFormError(
            this.source,
            literal.pos,
            literal,
            "<literal>"
          );
        }
        finalLiterals.push(convertedLiteral);
      }
      const finalRules = [];
      for (const rule of rules) {
        if (!isGroup(rule)) {
          throw new ExpectedFormError(
            this.source,
            rule.pos,
            rule,
            "(<pattern> <template>)"
          );
        }
        if (rule.length() !== 2) {
          throw new ExpectedFormError(
            this.source,
            rule.location.start,
            rule,
            "(<pattern> <template>)"
          );
        }
        const [pattern, template] = rule.unwrap();
        const convertedPattern = this.parseExpression(pattern);
        const convertedTemplate = this.parseExpression(template);
        if (!this.isValidPattern(convertedPattern)) {
          throw new ExpectedFormError(
            this.source,
            convertedPattern.location.start,
            pattern,
            "<symbol> | <literal> | (<pattern>+) | (<pattern>+ ... <pattern>*) | (<pattern>+ ... <pattern>+ . <pattern>)"
          );
        }
        if (!this.isValidTemplate(convertedTemplate)) {
          throw new ExpectedFormError(
            this.source,
            convertedTemplate.location.start,
            template,
            "<symbol> | <literal> | (<element>+) | (<element>+ . <template>) | (... <template>)"
          );
        }
        finalRules.push([convertedPattern, convertedTemplate]);
      }
      this.quoteMode = 0 /* NONE */;
      return new Atomic.SyntaxRules(group.location, finalLiterals, finalRules);
    }
    // ___________________MISCELLANEOUS___________________
    /**
     * Parse an import expression.
     * @param group
     * @returns
     */
    parseImport(group) {
      if (group.length() !== 3) {
        throw new ExpectedFormError(
          this.source,
          group.firstToken().pos,
          group.firstToken(),
          '(import "<source>" (<identifier>*))'
        );
      }
      const elements = group.unwrap();
      const source = elements[1];
      const identifiers = elements[2];
      if (!isToken(source)) {
        throw new ExpectedFormError(
          this.source,
          source.location.start,
          source,
          '"<source>"'
        );
      }
      if (source.type !== 9 /* STRING */) {
        throw new ExpectedFormError(
          this.source,
          source.pos,
          source,
          '"<source>"'
        );
      }
      if (!isGroup(identifiers)) {
        throw new ExpectedFormError(
          this.source,
          identifiers.pos,
          identifiers,
          "(<identifier>*)"
        );
      }
      const identifierElements = identifiers.unwrap();
      const convertedIdentifiers = [];
      for (const identifierElement of identifierElements) {
        if (!isToken(identifierElement)) {
          throw new ExpectedFormError(
            this.source,
            identifierElement.location.start,
            identifierElement,
            "<identifier>"
          );
        }
        if (identifierElement.type !== 6 /* IDENTIFIER */) {
          throw new ExpectedFormError(
            this.source,
            identifierElement.pos,
            identifierElement,
            "<identifier>"
          );
        }
        convertedIdentifiers.push(
          new Atomic.Identifier(
            this.toLocation(identifierElement),
            identifierElement.lexeme
          )
        );
      }
      const convertedSource = new Atomic.StringLiteral(
        this.toLocation(source),
        source.literal
      );
      return new Atomic.Import(
        group.location,
        convertedSource,
        convertedIdentifiers
      );
    }
    /**
     * Parse an export expression.
     * @param group
     * @returns
     */
    parseExport(group) {
      if (group.length() !== 2) {
        throw new ExpectedFormError(
          this.source,
          group.firstToken().pos,
          group.firstToken(),
          "(export (<definition>))"
        );
      }
      const elements = group.unwrap();
      const definition = elements[1];
      if (!isGroup(definition)) {
        throw new ExpectedFormError(
          this.source,
          definition.pos,
          definition,
          "(<definition>)"
        );
      }
      const convertedDefinition = this.parseExpression(definition);
      if (!(convertedDefinition instanceof Atomic.Definition || convertedDefinition instanceof Extended.FunctionDefinition)) {
        throw new ExpectedFormError(
          this.source,
          definition.location.start,
          definition,
          "(<definition>)"
        );
      }
      return new Atomic.Export(group.location, convertedDefinition);
    }
    /**
     * Parses a vector expression
     */
    parseVector(group) {
      const elements = group.unwrap()[1];
      const convertedElements = elements.unwrap().map(this.parseExpression.bind(this));
      return new Atomic.Vector(group.location, convertedElements);
    }
    // ___________________________________________________
    /** Parses a sequence of tokens into an AST.
     *
     * @param group A group of tokens.
     * @returns An AST.
     */
    parse(reparseAsSexpr = false) {
      if (reparseAsSexpr) {
        this.quoteMode = 1 /* QUOTE */;
        this.current = 0;
      }
      const topElements = [];
      while (!this.isAtEnd()) {
        if (this.peek().type === 33 /* EOF */) {
          break;
        }
        const currentElement = this.grouping();
        if (!currentElement) {
          continue;
        }
        const convertedElement = this.parseExpression(currentElement);
        topElements.push(convertedElement);
      }
      if (this.chapter >= MACRO_CHAPTER && !reparseAsSexpr) {
        const importElements = topElements.filter(
          (e) => e instanceof Atomic.Import
        );
        const sexprElements = this.parse(true);
        const restElements = sexprElements.filter(
          (e) => !(e instanceof Extended.List && e.elements && e.elements[0] instanceof Atomic.Symbol && e.elements[0].value === "import")
        );
        return [...importElements, ...restElements];
      }
      return topElements;
    }
  };

  // src/utils/estree-nodes.ts
  function makeProgram(body = []) {
    const loc = body.length > 0 ? {
      start: body[0].loc.start,
      end: body[body.length - 1].loc.end
    } : {
      start: { line: 1, column: 0 },
      end: { line: 1, column: 0 }
    };
    return {
      type: "Program",
      body,
      sourceType: "module",
      loc
    };
  }
  function makeDeclaration(kind, id, init, loc) {
    return {
      type: "VariableDeclaration",
      kind,
      declarations: [
        {
          type: "VariableDeclarator",
          id,
          init
        }
      ],
      loc: loc ? loc : id.loc
    };
  }
  function makeIdentifier(name, loc) {
    return {
      type: "Identifier",
      name,
      loc
    };
  }
  function makeLiteral(value, loc) {
    return {
      type: "Literal",
      value,
      raw: `"${value}"`,
      loc
    };
  }
  function makeArrowFunctionExpression(params, body, loc) {
    return {
      type: "ArrowFunctionExpression",
      params,
      body,
      async: false,
      expression: body.type !== "BlockStatement",
      loc: loc ? loc : body.loc
    };
  }
  function makeBlockStatement(body, loc) {
    return {
      type: "BlockStatement",
      body,
      loc: loc ? loc : {
        start: body[0].loc.start,
        end: body[body.length - 1].loc.end
      }
    };
  }
  function makeCallExpression(callee, args, loc) {
    return {
      type: "CallExpression",
      optional: false,
      callee,
      arguments: args,
      loc: loc ? loc : {
        start: callee.loc.start,
        end: args[args.length - 1].loc.end
      }
    };
  }
  function makeConditionalExpression(test, consequent, alternate, loc) {
    return {
      type: "ConditionalExpression",
      test,
      consequent,
      alternate,
      loc: loc ? loc : {
        start: test.loc.start,
        end: alternate.loc.end
      }
    };
  }
  function makeAssignmentExpression(left, right, loc) {
    return {
      type: "AssignmentExpression",
      operator: "=",
      left,
      right,
      loc: loc ? loc : {
        start: left.loc.start,
        end: right.loc.end
      }
    };
  }
  function makeExpressionStatement(expression, loc) {
    return {
      type: "ExpressionStatement",
      expression,
      loc: loc ? loc : expression.loc
    };
  }
  function makeReturnStatement(argument, loc) {
    return {
      type: "ReturnStatement",
      argument,
      loc: loc ? loc : argument.loc
    };
  }
  function makeRestElement(argument, loc) {
    return {
      type: "RestElement",
      argument,
      loc: loc ? loc : argument.loc
    };
  }
  function makeArrayExpression(elements, loc) {
    return {
      type: "ArrayExpression",
      elements,
      loc: loc ? loc : {
        start: elements[0].loc.start,
        end: elements[elements.length - 1].loc.end
      }
    };
  }
  function makeImportSpecifier(imported, local, loc) {
    return {
      type: "ImportSpecifier",
      imported,
      local,
      loc: loc ? loc : imported.loc
    };
  }
  function makeImportDeclaration(specifiers, source, loc) {
    return {
      type: "ImportDeclaration",
      specifiers,
      source,
      loc: loc ? loc : {
        start: specifiers[0].loc.start,
        end: source.loc.end
      }
    };
  }
  function makeExportNamedDeclaration(declaration, loc) {
    return {
      type: "ExportNamedDeclaration",
      specifiers: [],
      source: null,
      declaration,
      loc: loc ? loc : declaration.loc
    };
  }

  // src/transpiler/visitors/transpiler.ts
  function isExpression(node) {
    return !node.type.includes("Statement") && !node.type.includes("Declaration");
  }
  function wrapInRest(param) {
    return makeRestElement(param);
  }
  function wrapInStatement(expression) {
    return makeExpressionStatement(expression);
  }
  function wrapInReturn(expression) {
    return makeReturnStatement(expression);
  }
  var Transpiler = class _Transpiler {
    static create() {
      return new _Transpiler();
    }
    transpile(program) {
      const expressions = program.flatMap((e) => e.accept(this));
      const statements = expressions.map(
        (e) => isExpression(e) ? wrapInStatement(e) : e
      );
      return makeProgram(statements);
    }
    // Atomic AST
    // iife
    visitSequence(node) {
      const expressions = node.expressions.flatMap((e) => e.accept(this));
      const statements = expressions.map(
        (e) => isExpression(e) ? wrapInStatement(e) : e
      );
      const lastExpression = statements.at(-1);
      if (lastExpression.type !== "ExpressionStatement") {
        statements.push(
          // always remember that undefined is an identifier
          wrapInStatement(
            makeIdentifier("undefined", node.location)
          )
        );
      } else {
        statements[statements.length - 1] = wrapInReturn(
          lastExpression.expression
        );
      }
      const body = makeBlockStatement(statements);
      const iife = makeCallExpression(
        makeArrowFunctionExpression([], body, node.location),
        [],
        node.location
      );
      iife.isSequence = true;
      return [iife];
    }
    // literals
    visitNumericLiteral(node) {
      const makeNumber = makeIdentifier(
        "make_number",
        node.location
      );
      const number = makeLiteral(node.value, node.location);
      return [
        makeCallExpression(makeNumber, [number], node.location)
      ];
    }
    visitBooleanLiteral(node) {
      return [makeLiteral(node.value, node.location)];
    }
    visitStringLiteral(node) {
      return [makeLiteral(node.value, node.location)];
    }
    visitLambda(node) {
      const parameters = node.params.flatMap((p) => p.accept(this));
      const [fnBody] = node.body.accept(this);
      let finalBody = fnBody.isSequence ? (
        // then we know that body is a sequence, stored as a call expression to an
        // inner callee with an interior arrow function expression that takes no arguments
        // let's steal that arrow function expression's body and use it as ours
        fnBody.callee.body
      ) : fnBody;
      if (!node.rest) {
        return [
          makeArrowFunctionExpression(
            parameters,
            finalBody,
            node.location
          )
        ];
      }
      const [restParameter] = node.rest.accept(this);
      const restElement = wrapInRest(restParameter);
      parameters.push(restElement);
      const vectorToList = makeIdentifier(
        "vector->list",
        node.location
      );
      const restParameterConversion = makeCallExpression(
        vectorToList,
        [restParameter],
        node.location
      );
      const restParameterAssignment = makeAssignmentExpression(
        restParameter,
        restParameterConversion,
        node.location
      );
      if (finalBody.type === "BlockStatement") {
        finalBody.body.unshift(wrapInStatement(restParameterAssignment));
        return [
          makeArrowFunctionExpression(
            parameters,
            finalBody,
            node.location
          )
        ];
      }
      finalBody = makeBlockStatement([
        wrapInStatement(restParameterAssignment),
        wrapInReturn(finalBody)
      ]);
      return [
        makeArrowFunctionExpression(
          parameters,
          finalBody,
          node.location
        )
      ];
    }
    // identifiers
    visitIdentifier(node) {
      return [makeIdentifier(node.name, node.location)];
    }
    // make a verifier that prevents this from being part of an
    // expression context
    // turns into statement
    visitDefinition(node) {
      const [value] = node.value.accept(this);
      const [id] = node.name.accept(this);
      return [makeDeclaration("let", id, value, node.location)];
    }
    // expressions
    visitApplication(node) {
      const [operator] = node.operator.accept(this);
      const operands = node.operands.flatMap((o) => o.accept(this));
      return [
        makeCallExpression(operator, operands, node.location)
      ];
    }
    visitConditional(node) {
      const [test] = node.test.accept(this);
      const truthy3 = makeIdentifier("truthy", node.location);
      const schemeTest = makeCallExpression(
        truthy3,
        [test],
        node.location
      );
      const [consequent] = node.consequent.accept(this);
      const [alternate] = node.alternate.accept(this);
      return [
        makeConditionalExpression(
          schemeTest,
          consequent,
          alternate,
          node.location
        )
      ];
    }
    // pair represented using cons call
    visitPair(node) {
      const [car2] = node.car.accept(this);
      const [cdr2] = node.cdr.accept(this);
      const cons2 = makeIdentifier("cons", node.location);
      return [makeCallExpression(cons2, [car2, cdr2], node.location)];
    }
    visitNil(node) {
      return [makeLiteral(null, node.location)];
    }
    // generate symbols with string->symbol call
    visitSymbol(node) {
      const str = makeLiteral(node.value, node.location);
      const stringToSymbol = makeIdentifier(
        "string->symbol",
        node.location
      );
      return [
        makeCallExpression(stringToSymbol, [str], node.location)
      ];
    }
    // we are assured that this marker will always exist within a list context.
    // leave a splice marker in the list that will be removed by a runtime
    // call to eval-splice on a list
    visitSpliceMarker(node) {
      const [expr] = node.value.accept(this);
      const makeSplice = makeIdentifier(
        "make-splice",
        node.location
      );
      return [makeCallExpression(makeSplice, expr, node.location)];
    }
    // turns into expression that returns assigned value
    // maybe in the future we can make a setall! macro
    visitReassignment(node) {
      const [left] = node.name.accept(this);
      const [right] = node.value.accept(this);
      return [makeAssignmentExpression(left, right, node.location)];
    }
    // make a verifier that keeps these top level
    // and separate from nodes
    visitImport(node) {
      const newIdentifiers = node.identifiers.flatMap((i) => i.accept(this));
      const mappedIdentifierNames = newIdentifiers.map((i) => {
        const copy = Object.assign({}, i);
        copy.name = "imported" + copy.name;
        return copy;
      });
      const makeSpecifiers = (importeds, locals) => importeds.map(
        (imported, i) => (
          // safe to cast as we are assured all source locations are present
          makeImportSpecifier(
            imported,
            locals[i],
            imported.loc
          )
        )
      );
      const specifiers = makeSpecifiers(newIdentifiers, mappedIdentifierNames);
      const [source] = node.source.accept(this);
      const importDeclaration = makeImportDeclaration(
        specifiers,
        source,
        node.location
      );
      const makeRedefinitions = (importeds, locals) => importeds.flatMap(
        (imported, i) => makeDeclaration(
          "let",
          imported,
          locals[i],
          // we are assured that all source locations are present
          imported.loc
        )
      );
      const redefinitions = makeRedefinitions(
        newIdentifiers,
        mappedIdentifierNames
      );
      return [importDeclaration, ...redefinitions];
    }
    visitExport(node) {
      const [newDefinition] = node.definition.accept(this);
      return [
        makeExportNamedDeclaration(newDefinition, node.location)
      ];
    }
    // turn into an array
    visitVector(node) {
      const newElements = node.elements.flatMap((e) => e.accept(this));
      return [makeArrayExpression(newElements, node.location)];
    }
    // Extended AST
    // this is in the extended AST, but useful enough to keep.
    visitList(node) {
      const newElements = node.elements.flatMap((e) => e.accept(this));
      const [newTerminator] = node.terminator ? node.terminator.accept(this) : [void 0];
      if (newTerminator) {
        const dottedList = makeIdentifier("list*", node.location);
        return [
          makeCallExpression(
            dottedList,
            [...newElements, newTerminator],
            node.location
          )
        ];
      }
      const list2 = makeIdentifier("list", node.location);
      return [makeCallExpression(list2, newElements, node.location)];
    }
    // if any of these are called, its an error. the simplifier
    // should be called first.
    visitFunctionDefinition(node) {
      throw new Error("The AST should be simplified!");
    }
    visitLet(node) {
      throw new Error("The AST should be simplified!");
    }
    visitCond(node) {
      throw new Error("The AST should be simplified!");
    }
    visitBegin(node) {
      throw new Error("The AST should be simplified!");
    }
    visitDelay(node) {
      throw new Error("The AST should be simplified!");
    }
    visitDefineSyntax(node) {
      throw new Error("This should not be called!");
    }
    visitSyntaxRules(node) {
      throw new Error("This should not be called!");
    }
  };

  // src/transpiler/visitors/simplifier.ts
  function flattenBegin(ex) {
    if (!(ex instanceof Extended.Begin)) {
      return [ex];
    }
    const beginExpressions = ex.expressions;
    return beginExpressions.flatMap(flattenBegin);
  }
  var Simplifier = class _Simplifier {
    // Factory method for creating a new Simplifier instance.
    static create() {
      return new _Simplifier();
    }
    simplify(node) {
      const flattenedExpressions = node.flatMap(flattenBegin);
      return flattenedExpressions.map((expression) => expression.accept(this));
    }
    // Atomic AST
    visitSequence(node) {
      const location = node.location;
      const flattenedExpressions = node.expressions.flatMap(flattenBegin);
      const newExpressions = flattenedExpressions.map(
        (expression) => expression.accept(this)
      );
      return new Atomic.Sequence(location, newExpressions);
    }
    visitNumericLiteral(node) {
      return node;
    }
    visitBooleanLiteral(node) {
      return node;
    }
    visitStringLiteral(node) {
      return node;
    }
    visitLambda(node) {
      const location = node.location;
      const params = node.params;
      const rest = node.rest;
      const newBody = node.body.accept(this);
      return new Atomic.Lambda(location, newBody, params, rest);
    }
    visitIdentifier(node) {
      return node;
    }
    visitDefinition(node) {
      const location = node.location;
      const name = node.name;
      const newValue = node.value.accept(this);
      return new Atomic.Definition(location, name, newValue);
    }
    visitApplication(node) {
      const location = node.location;
      const newOperator = node.operator.accept(this);
      const newOperands = node.operands.map((operand) => operand.accept(this));
      return new Atomic.Application(location, newOperator, newOperands);
    }
    visitConditional(node) {
      const location = node.location;
      const newTest = node.test.accept(this);
      const newConsequent = node.consequent.accept(this);
      const newAlternate = node.alternate.accept(this);
      return new Atomic.Conditional(
        location,
        newTest,
        newConsequent,
        newAlternate
      );
    }
    visitPair(node) {
      const location = node.location;
      const newCar = node.car.accept(this);
      const newCdr = node.cdr.accept(this);
      return new Atomic.Pair(location, newCar, newCdr);
    }
    visitNil(node) {
      return node;
    }
    visitSymbol(node) {
      return node;
    }
    visitSpliceMarker(node) {
      const location = node.location;
      const newValue = node.value.accept(this);
      return new Atomic.SpliceMarker(location, newValue);
    }
    visitReassignment(node) {
      const location = node.location;
      const name = node.name;
      const newValue = node.value.accept(this);
      return new Atomic.Reassignment(location, name, newValue);
    }
    // Already in simplest form.
    visitImport(node) {
      return node;
    }
    visitExport(node) {
      const location = node.location;
      const newDefinition = node.definition.accept(this);
      return new Atomic.Export(location, newDefinition);
    }
    visitVector(node) {
      const location = node.location;
      const newElements = node.elements.map((element) => element.accept(this));
      return new Atomic.Vector(location, newElements);
    }
    // Extended AST
    visitFunctionDefinition(node) {
      const location = node.location;
      const name = node.name;
      const params = node.params;
      const rest = node.rest;
      const newBody = node.body.accept(this);
      const newLambda = new Atomic.Lambda(location, newBody, params, rest);
      return new Atomic.Definition(location, name, newLambda);
    }
    visitLet(node) {
      const location = node.location;
      const identifiers = node.identifiers;
      const newValues = node.values.map((value) => value.accept(this));
      const newBody = node.body.accept(this);
      const newLambda = new Atomic.Lambda(location, newBody, identifiers);
      return new Atomic.Application(location, newLambda, newValues);
    }
    visitCond(node) {
      const location = node.location;
      const newPredicates = node.predicates.map(
        (predicate) => predicate.accept(this)
      );
      const newConsequents = node.consequents.map(
        (consequent) => consequent.accept(this)
      );
      const newCatchall = node.catchall ? node.catchall.accept(this) : node.catchall;
      if (newPredicates.length == 0) {
        return new Atomic.Conditional(
          location,
          new Atomic.BooleanLiteral(location, false),
          new Atomic.Nil(location),
          node.catchall ? newCatchall : new Atomic.Nil(location)
        );
      }
      newPredicates.reverse();
      newConsequents.reverse();
      const lastLocation = newPredicates[0].location;
      let newConditional = newCatchall ? newCatchall : new Atomic.Nil(lastLocation);
      for (let i = 0; i < newPredicates.length; i++) {
        const predicate = newPredicates[i];
        const consequent = newConsequents[i];
        const predLocation = predicate.location;
        const consLocation = consequent.location;
        const newLocation = new Location(predLocation.start, consLocation.end);
        newConditional = new Atomic.Conditional(
          newLocation,
          predicate,
          consequent,
          newConditional
        );
      }
      return newConditional;
    }
    // we will keep list as it is useful in its current state.
    visitList(node) {
      const location = node.location;
      const newElements = node.elements.map((element) => element.accept(this));
      const newTerminator = node.terminator ? node.terminator.accept(this) : void 0;
      return new Extended.List(location, newElements, newTerminator);
    }
    // these begins are not located at the top level, or in sequences,
    // so they have been left alone
    // they are used as ways to sequence expressions locally instead
    visitBegin(node) {
      const location = node.location;
      const flattenedExpressions = node.expressions.flatMap(flattenBegin);
      const newExpressions = flattenedExpressions.map(
        (expression) => expression.accept(this)
      );
      return new Atomic.Sequence(location, newExpressions);
    }
    // we transform delay into a call expression of "make-promise"
    visitDelay(node) {
      const location = node.location;
      const newBody = node.expression.accept(this);
      const delayedLambda = new Atomic.Lambda(location, newBody, []);
      const makePromise = new Atomic.Identifier(location, "make-promise");
      return new Atomic.Application(location, makePromise, [delayedLambda]);
    }
    // these nodes are already in their simplest form
    visitDefineSyntax(node) {
      return node;
    }
    visitSyntaxRules(node) {
      return node;
    }
  };

  // src/transpiler/visitors/redefiner.ts
  var Redefiner = class _Redefiner {
    // Factory method for creating a new Redefiner instance.
    static create() {
      return new _Redefiner();
    }
    redefineScope(scope) {
      const names = /* @__PURE__ */ new Set();
      const newScope = scope.map((expression) => {
        if (expression instanceof Atomic.Definition) {
          const exprName = expression.name.name;
          if (names.has(exprName)) {
            return new Atomic.Reassignment(
              expression.location,
              expression.name,
              expression.value
            );
          }
          names.add(exprName);
        }
        return expression;
      });
      return newScope;
    }
    redefine(nodes) {
      const newNodes = nodes.map((node) => node.accept(this));
      return this.redefineScope(newNodes);
    }
    // Atomic AST
    visitSequence(node) {
      const location = node.location;
      const newExpressions = node.expressions.map(
        (expression) => expression.accept(this)
      );
      return new Atomic.Sequence(location, this.redefineScope(newExpressions));
    }
    visitNumericLiteral(node) {
      return node;
    }
    visitBooleanLiteral(node) {
      return node;
    }
    visitStringLiteral(node) {
      return node;
    }
    visitLambda(node) {
      const location = node.location;
      const params = node.params;
      const rest = node.rest;
      const newBody = node.body.accept(this);
      return new Atomic.Lambda(location, newBody, params, rest);
    }
    visitIdentifier(node) {
      return node;
    }
    visitDefinition(node) {
      const location = node.location;
      const name = node.name;
      const newValue = node.value.accept(this);
      return new Atomic.Definition(location, name, newValue);
    }
    visitApplication(node) {
      const location = node.location;
      const newOperator = node.operator.accept(this);
      const newOperands = node.operands.map((operand) => operand.accept(this));
      return new Atomic.Application(location, newOperator, newOperands);
    }
    visitConditional(node) {
      const location = node.location;
      const newTest = node.test.accept(this);
      const newConsequent = node.consequent.accept(this);
      const newAlternate = node.alternate.accept(this);
      return new Atomic.Conditional(
        location,
        newTest,
        newConsequent,
        newAlternate
      );
    }
    visitPair(node) {
      const location = node.location;
      const newCar = node.car.accept(this);
      const newCdr = node.cdr.accept(this);
      return new Atomic.Pair(location, newCar, newCdr);
    }
    visitNil(node) {
      return node;
    }
    visitSymbol(node) {
      return node;
    }
    visitSpliceMarker(node) {
      const location = node.location;
      const newValue = node.value.accept(this);
      return new Atomic.SpliceMarker(location, newValue);
    }
    visitReassignment(node) {
      const location = node.location;
      const name = node.name;
      const newValue = node.value.accept(this);
      return new Atomic.Reassignment(location, name, newValue);
    }
    // Already in simplest form.
    visitImport(node) {
      return node;
    }
    visitExport(node) {
      const location = node.location;
      const newDefinition = node.definition.accept(this);
      return new Atomic.Export(location, newDefinition);
    }
    visitVector(node) {
      const location = node.location;
      const newElements = node.elements.map((element) => element.accept(this));
      return new Atomic.Vector(location, newElements);
    }
    // Extended AST
    visitFunctionDefinition(node) {
      const location = node.location;
      const name = node.name;
      const params = node.params;
      const rest = node.rest;
      const newBody = node.body.accept(this);
      return new Extended.FunctionDefinition(
        location,
        name,
        newBody,
        params,
        rest
      );
    }
    visitLet(node) {
      const location = node.location;
      const identifiers = node.identifiers;
      const newValues = node.values.map((value) => value.accept(this));
      const newBody = node.body.accept(this);
      return new Extended.Let(location, identifiers, newValues, newBody);
    }
    visitCond(node) {
      const location = node.location;
      const newPredicates = node.predicates.map(
        (predicate) => predicate.accept(this)
      );
      const newConsequents = node.consequents.map(
        (consequent) => consequent.accept(this)
      );
      const newCatchall = node.catchall ? node.catchall.accept(this) : node.catchall;
      return new Extended.Cond(
        location,
        newPredicates,
        newConsequents,
        newCatchall
      );
    }
    visitList(node) {
      const location = node.location;
      const newElements = node.elements.map((element) => element.accept(this));
      const newTerminator = node.terminator ? node.terminator.accept(this) : void 0;
      return new Extended.List(location, newElements, newTerminator);
    }
    visitBegin(node) {
      const location = node.location;
      const newExpressions = node.expressions.map(
        (expression) => expression.accept(this)
      );
      return new Extended.Begin(location, this.redefineScope(newExpressions));
    }
    visitDelay(node) {
      const location = node.location;
      const newBody = node.expression.accept(this);
      return new Extended.Delay(location, newBody);
    }
    // there are no redefinitions in the following nodes.
    visitDefineSyntax(node) {
      return node;
    }
    visitSyntaxRules(node) {
      return node;
    }
  };

  // src/transpiler/index.ts
  function wrapInEval(body) {
    const evalObj = new Atomic.Identifier(body.location, "eval");
    return new Atomic.Application(body.location, evalObj, [body]);
  }
  function wrapInBegin(expressions) {
    const dummyloc = expressions[0].location.merge(
      expressions[expressions.length - 1].location
    );
    const begin = new Atomic.Symbol(dummyloc, "begin");
    return new Extended.List(dummyloc, [begin, ...expressions]);
  }
  function schemeParse(source, chapter = Infinity, encode3) {
    const lexer = new SchemeLexer(source);
    const tokens = lexer.scanTokens();
    const parser = new SchemeParser(source, tokens, chapter);
    let finalAST;
    const firstAST = parser.parse();
    const simplifier = Simplifier.create();
    const redefiner = Redefiner.create();
    const transpiler = Transpiler.create();
    if (chapter < MACRO_CHAPTER) {
      const simplifiedAST = simplifier.simplify(firstAST);
      const redefinedAST = redefiner.redefine(simplifiedAST);
      finalAST = redefinedAST;
    } else {
      const macroASTImports = firstAST.filter(
        (e) => e instanceof Atomic.Import
      );
      const macroASTRest = firstAST.filter(
        (e) => !(e instanceof Atomic.Import)
      );
      const macroASTformattedRest = macroASTRest.length === 0 ? [] : macroASTRest.length === 1 ? [wrapInEval(macroASTRest[0])] : [wrapInEval(wrapInBegin(macroASTRest))];
      finalAST = [...macroASTImports, ...macroASTformattedRest];
    }
    const program = transpiler.transpile(finalAST);
    return encode3 ? estreeEncode(program) : program;
  }

  // src/index.ts
  var JS_KEYWORDS = [
    "break",
    "case",
    "catch",
    "class",
    "const",
    "continue",
    "debugger",
    "default",
    "delete",
    "do",
    "else",
    "eval",
    "export",
    "extends",
    "false",
    "finally",
    "for",
    "function",
    "if",
    "import",
    "in",
    "instanceof",
    "new",
    "return",
    "super",
    "switch",
    "this",
    "throw",
    "true",
    "try",
    "typeof",
    "var",
    "void",
    "while",
    "with",
    "yield",
    "enum",
    "await",
    "implements",
    "package",
    "protected",
    "static",
    "interface",
    "private",
    "public"
  ];
  function encode2(identifier) {
    if (JS_KEYWORDS.includes(identifier) || identifier.startsWith("$scheme_")) {
      return "$scheme_" + encode(identifier).replace(
        /([^a-zA-Z0-9_])/g,
        (match) => `$${match.charCodeAt(0)}$`
      );
    } else {
      return identifier.replace(
        /([^a-zA-Z0-9_])/g,
        (match) => `$${match.charCodeAt(0)}$`
      );
    }
  }
  function decode2(identifier) {
    if (identifier.startsWith("$scheme_")) {
      return decode(
        identifier.slice(8).replace(
          /\$([0-9]+)\$/g,
          (_, code) => String.fromCharCode(parseInt(code))
        )
      );
    } else {
      return identifier.replace(
        /\$([0-9]+)\$/g,
        (_, code) => String.fromCharCode(parseInt(code))
      );
    }
  }
  if (typeof globalThis.import === "function" && "conductor" in globalThis) {
    Promise.all([
      globalThis.import("@sourceacademy/conductor/runner/util"),
      globalThis.import("./conductor/SchemeEvaluator")
    ]).then(([{ initialise }, { default: SchemeEvaluator }]) => {
      const { runnerPlugin, conduit } = initialise(SchemeEvaluator);
      globalThis.scmSlangRunnerPlugin = runnerPlugin;
      globalThis.scmSlangConduit = conduit;
      console.log("[scm-slang] Conductor integration initialized");
    }).catch((err) => {
      console.error("[scm-slang] Conductor initialization error:", err);
    });
  }

  // src/conductor/SchemeInterpreter.ts
  var SchemeInterpreter = class {
    constructor() {
      this.evaluateCounter = 0;
      this.globalEnv = this.createEnvironment(null);
      this.initializeGlobalEnvironment();
    }
    /**
     * Initialize global environment with stdlib functions
     */
    initializeGlobalEnvironment() {
      for (const [encodedKey, value] of Object.entries(base_exports)) {
        this.globalEnv.values.set(encodedKey, value);
        const decodedKey = decode2(encodedKey);
        if (decodedKey !== encodedKey) {
          this.globalEnv.values.set(decodedKey, value);
        }
      }
      if (make_number2) {
        this.globalEnv.values.set("make_number", make_number2);
      }
      if (!this.globalEnv.values.has("make_number")) {
        const coreImport = (init_core_math(), __toCommonJS(core_math_exports));
        if (coreImport.make_number) {
          this.globalEnv.values.set("make_number", coreImport.make_number);
        }
      }
      this.globalEnv.values.set("eval", (schemeExpr, env) => {
        const envToUse = env || this.globalEnv;
        return this.evalSchemeExpression(schemeExpr, envToUse);
      });
    }
    // ==========================================================================
    // Environment operations
    // ==========================================================================
    /**
     * Create a new environment
     */
    createEnvironment(parent) {
      return {
        values: /* @__PURE__ */ new Map(),
        parent
      };
    }
    /**
     * Look up a variable in the environment chain.
     * Tries the name as-is first, then tries the encoded version.
     */
    lookupVariable(name, env) {
      let current = env;
      while (current !== null) {
        if (current.values.has(name)) {
          return current.values.get(name);
        }
        current = current.parent;
      }
      const encodedName = encode2(name);
      if (encodedName !== name) {
        let current2 = env;
        while (current2 !== null) {
          if (current2.values.has(encodedName)) {
            return current2.values.get(encodedName);
          }
          current2 = current2.parent;
        }
      }
      const decodedName = decode2(name);
      if (decodedName !== name) {
        let current3 = env;
        while (current3 !== null) {
          if (current3.values.has(decodedName)) {
            return current3.values.get(decodedName);
          }
          current3 = current3.parent;
        }
      }
      throw new Error(`Undefined variable: ${name}`);
    }
    /**
     * Define a variable in the environment.
     * Stores under both the given name and its encoded/decoded counterpart
     * so lookups from either the ESTree path or the s-expression path work.
     */
    defineVariable(name, value, env) {
      env.values.set(name, value);
      const encodedName = encode2(name);
      if (encodedName !== name) {
        env.values.set(encodedName, value);
      }
      const decodedName = decode2(name);
      if (decodedName !== name) {
        env.values.set(decodedName, value);
      }
    }
    /**
     * Set (mutate) an existing variable by walking up the environment chain.
     * Updates under both the found name and its encoded/decoded counterpart.
     * Throws if the variable was never defined.
     */
    setVariable(name, value, env) {
      let current = env;
      while (current !== null) {
        if (current.values.has(name)) {
          current.values.set(name, value);
          const encodedName2 = encode2(name);
          if (encodedName2 !== name && current.values.has(encodedName2)) {
            current.values.set(encodedName2, value);
          }
          const decodedName = decode2(name);
          if (decodedName !== name && current.values.has(decodedName)) {
            current.values.set(decodedName, value);
          }
          return value;
        }
        current = current.parent;
      }
      const encodedName = encode2(name);
      if (encodedName !== name) {
        let current2 = env;
        while (current2 !== null) {
          if (current2.values.has(encodedName)) {
            current2.values.set(encodedName, value);
            current2.values.set(name, value);
            return value;
          }
          current2 = current2.parent;
        }
      }
      throw new Error(`Undefined variable: ${name}`);
    }
    // ==========================================================================
    // ESTree evaluation (main path)
    // ==========================================================================
    /**
     * Evaluates an ESTree Program
     */
    evaluate(program) {
      this.evaluateCounter++;
      let result = void 0;
      for (const statement of program.body) {
        result = this.evaluateNode(statement, this.globalEnv);
      }
      return result;
    }
    /**
     * Main evaluation dispatcher
     */
    evaluateNode(node, env) {
      switch (node.type) {
        case "Program":
          return this.evaluateProgram(node, env);
        case "ExpressionStatement":
          return this.evaluateNode(
            node.expression,
            env
          );
        case "VariableDeclaration":
          return this.evaluateVariableDeclaration(
            node,
            env
          );
        case "CallExpression":
          return this.evaluateCallExpression(node, env);
        case "Identifier":
          return this.lookupVariable(node.name, env);
        case "Literal":
          return node.value;
        case "ArrowFunctionExpression":
          return this.evaluateArrowFunctionExpression(
            node,
            env
          );
        case "BlockStatement":
          return this.evaluateBlockStatement(node, env);
        case "ReturnStatement": {
          const returnStmt = node;
          return returnStmt.argument ? this.evaluateNode(returnStmt.argument, env) : void 0;
        }
        case "ConditionalExpression":
          return this.evaluateConditionalExpression(
            node,
            env
          );
        case "ArrayExpression":
          return this.evaluateArrayExpression(node, env);
        case "AssignmentExpression": {
          const assignNode = node;
          const value = this.evaluateNode(assignNode.right, env);
          const name = assignNode.left.name;
          return this.setVariable(name, value, env);
        }
        default:
          throw new Error(
            `Unsupported node type: ${node.type || "unknown"}`
          );
      }
    }
    /**
     * Evaluate a Program node
     */
    evaluateProgram(program, env) {
      let result = void 0;
      for (const statement of program.body) {
        result = this.evaluateNode(statement, env);
      }
      return result;
    }
    /**
     * Evaluate variable declaration (define)
     */
    evaluateVariableDeclaration(node, env) {
      for (const declarator of node.declarations) {
        const name = declarator.id.name;
        const value = declarator.init ? this.evaluateNode(declarator.init, env) : void 0;
        this.defineVariable(name, value, env);
      }
      return void 0;
    }
    /**
     * Evaluate function call
     */
    evaluateCallExpression(node, env) {
      const func = this.evaluateNode(node.callee, env);
      const args = node.arguments.map((arg) => {
        if (arg.type === "SpreadElement") {
          const arr = this.evaluateNode(arg.argument, env);
          return Array.isArray(arr) ? arr : [arr];
        }
        return this.evaluateNode(arg, env);
      });
      const flatArgs = [];
      for (let i = 0; i < args.length; i++) {
        if (Array.isArray(args[i]) && args.length === 1 && node.arguments[i]?.type === "SpreadElement") {
          flatArgs.push(...args[i]);
        } else {
          flatArgs.push(args[i]);
        }
      }
      if (typeof func === "function") {
        return func(...flatArgs);
      }
      if (func && typeof func === "object" && func.__call__) {
        return func.__call__(...flatArgs);
      }
      throw new Error(`Not a function: ${func}`);
    }
    /**
     * Evaluate arrow function expression — creates a closure
     */
    evaluateArrowFunctionExpression(node, env) {
      const closure = (...args) => {
        const funcEnv = this.createEnvironment(env);
        for (let i = 0; i < node.params.length; i++) {
          const param = node.params[i];
          if (param.type === "Identifier") {
            this.defineVariable(param.name, args[i], funcEnv);
          } else if (param.type === "RestElement") {
            const restName = param.argument.name;
            this.defineVariable(restName, args.slice(i), funcEnv);
            break;
          }
        }
        if (node.body.type === "BlockStatement") {
          return this.evaluateBlockStatement(
            node.body,
            funcEnv
          );
        } else {
          return this.evaluateNode(node.body, funcEnv);
        }
      };
      return closure;
    }
    /**
     * Evaluate block statement
     */
    evaluateBlockStatement(node, env) {
      let result = void 0;
      for (const statement of node.body) {
        result = this.evaluateNode(statement, env);
      }
      return result;
    }
    /**
     * Evaluate conditional (ternary) expression
     */
    evaluateConditionalExpression(node, env) {
      const test = this.evaluateNode(node.test, env);
      return test !== false ? this.evaluateNode(node.consequent, env) : this.evaluateNode(node.alternate, env);
    }
    /**
     * Evaluate array literal
     */
    evaluateArrayExpression(node, env) {
      return node.elements.map((el) => {
        if (el === null) return null;
        if (el.type === "SpreadElement") {
          const arr = this.evaluateNode(el.argument, env);
          return Array.isArray(arr) ? arr : [arr];
        }
        return this.evaluateNode(el, env);
      });
    }
    // ==========================================================================
    // S-expression evaluation (used by eval special form at runtime)
    // ==========================================================================
    /**
     * Convert a Scheme pair structure to a flat array
     */
    pairToArray(pair2) {
      const result = [];
      let current = pair2;
      while (current !== null && Array.isArray(current) && current.pair === true) {
        result.push(current[0]);
        current = current[1];
      }
      if (current !== null) {
        result.push(current);
      }
      return result;
    }
    /**
     * Extract identifier name from a parameter
     */
    extractParamName(param) {
      if (param === null || param === void 0) {
        throw new Error("Invalid parameter");
      }
      if (typeof param === "string") {
        return param;
      }
      if (param.sym !== void 0) {
        return param.sym;
      }
      return String(param);
    }
    /**
     * Evaluates a Scheme s-expression at runtime.
     * Used by the eval special form.
     */
    evalSchemeExpression(expr, env) {
      if (expr === null || expr === void 0) {
        return expr;
      }
      if (typeof expr !== "object") {
        return expr;
      }
      if (expr.numberType !== void 0 && typeof expr.coerce === "function") {
        return expr;
      }
      if (expr.sym !== void 0) {
        return this.lookupVariable(expr.sym, env);
      }
      if (Array.isArray(expr) && expr.pair === true) {
        expr = this.pairToArray(expr);
      }
      if (Array.isArray(expr)) {
        if (expr.length === 0) {
          return expr;
        }
        const [operator, ...operands] = expr;
        if (operator && typeof operator === "object" && operator.sym) {
          const operatorName = operator.sym;
          if (operatorName === "define") {
            return this.evalDefine(operands, env);
          }
          if (operatorName === "if") {
            if (operands.length < 2) {
              throw new Error("if: insufficient arguments");
            }
            const test = this.evalSchemeExpression(operands[0], env);
            if (test !== false) {
              return this.evalSchemeExpression(operands[1], env);
            } else {
              return operands.length >= 3 ? this.evalSchemeExpression(operands[2], env) : void 0;
            }
          }
          if (operatorName === "lambda") {
            return this.evalLambda(operands, env);
          }
          if (operatorName === "set!") {
            if (operands.length < 2) {
              throw new Error("set!: insufficient arguments");
            }
            const nameStr = this.extractParamName(operands[0]);
            const value = this.evalSchemeExpression(operands[1], env);
            return this.setVariable(nameStr, value, env);
          }
          if (operatorName === "begin") {
            let result = void 0;
            for (const operand of operands) {
              result = this.evalSchemeExpression(operand, env);
            }
            return result;
          }
          const evaluatedOperands = operands.map(
            (operand) => this.evalSchemeExpression(operand, env)
          );
          const func = this.lookupVariable(operatorName, env);
          if (typeof func === "function") {
            return func(...evaluatedOperands);
          }
          throw new Error(`Unknown operator: ${operatorName}`);
        }
        if (Array.isArray(operator)) {
          const evaluatedFunc = this.evalSchemeExpression(operator, env);
          const evaluatedOperands = operands.map(
            (op) => this.evalSchemeExpression(op, env)
          );
          if (typeof evaluatedFunc === "function") {
            return evaluatedFunc(...evaluatedOperands);
          }
        }
        if (typeof operator === "function") {
          const evaluatedOperands = operands.map(
            (op) => this.evalSchemeExpression(op, env)
          );
          return operator(...evaluatedOperands);
        }
        if (typeof operator !== "function" && operator !== void 0) {
          throw new Error(`Cannot call non-function: ${operator}`);
        }
      }
      return expr;
    }
    /**
     * Handle (define ...) in s-expression evaluation
     */
    evalDefine(operands, env) {
      if (operands.length < 2) {
        throw new Error("define: insufficient arguments");
      }
      const nameOrSignature = operands[0];
      const bodyExprs = operands.slice(1);
      if (Array.isArray(nameOrSignature) || nameOrSignature && typeof nameOrSignature === "object" && !nameOrSignature.sym && nameOrSignature.pair) {
        let flatSignature = nameOrSignature;
        if (Array.isArray(nameOrSignature) && nameOrSignature.pair === true) {
          flatSignature = this.pairToArray(nameOrSignature);
        }
        if (!Array.isArray(flatSignature)) {
          flatSignature = [flatSignature];
        }
        const [funcName, ...params] = flatSignature;
        const funcNameStr = this.extractParamName(funcName);
        const flatParams = params.map((param) => {
          if (Array.isArray(param) && param.pair === true) {
            return this.pairToArray(param)[0];
          }
          return param;
        });
        const schemeFunc = (...args) => {
          const funcEnv = this.createEnvironment(env);
          for (let i = 0; i < flatParams.length; i++) {
            const paramName = this.extractParamName(flatParams[i]);
            this.defineVariable(paramName, args[i], funcEnv);
          }
          let result = void 0;
          for (const bodyExpr of bodyExprs) {
            result = this.evalSchemeExpression(bodyExpr, funcEnv);
          }
          return result;
        };
        this.defineVariable(funcNameStr, schemeFunc, env);
        return void 0;
      } else {
        const nameStr = this.extractParamName(nameOrSignature);
        const evaluatedValue = this.evalSchemeExpression(bodyExprs[0], env);
        this.defineVariable(nameStr, evaluatedValue, env);
        return void 0;
      }
    }
    /**
     * Handle (lambda ...) in s-expression evaluation
     */
    evalLambda(operands, env) {
      if (operands.length < 2) {
        throw new Error("lambda: insufficient arguments");
      }
      const params = operands[0];
      const bodyExprs = operands.slice(1);
      let flatParams = params;
      if (Array.isArray(params) && params.pair === true) {
        flatParams = this.pairToArray(params);
      }
      return (...args) => {
        const funcEnv = this.createEnvironment(env);
        if (Array.isArray(flatParams)) {
          for (let i = 0; i < flatParams.length; i++) {
            const paramName = this.extractParamName(flatParams[i]);
            this.defineVariable(paramName, args[i], funcEnv);
          }
        }
        let result = void 0;
        for (const bodyExpr of bodyExprs) {
          result = this.evalSchemeExpression(bodyExpr, funcEnv);
        }
        return result;
      };
    }
  };

  // src/conductor/evaluatorEntry.ts
  function evaluate(code) {
    try {
      const programAst = schemeParse(code);
      const interpreter = new SchemeInterpreter();
      const result = interpreter.evaluate(programAst);
      return { status: "finished", value: result };
    } catch (e) {
      return { status: "error", error: e instanceof Error ? e.stack : String(e) };
    }
  }
  self.evaluate = evaluate;
})();
