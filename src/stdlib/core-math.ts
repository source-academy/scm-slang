// The core library of scm-slang,
// different from the base library,
// this library contains all methods required
// for the language to function properly.

// This file contains the minimum subset
// required for arithmetic to work.
// which includes the numeric tower,
// as well as the regex forms used to detect numbers.

export type SchemeNumber =
  | SchemeInteger
  | SchemeRational
  | SchemeReal
  | SchemeComplex;

// define here the functions used to check and split the number into its parts

export enum NumberType {
  INTEGER = 1,
  RATIONAL = 2,
  REAL = 3,
  COMPLEX = 4,
}

export abstract class Match {
  constructor(public result: boolean) {}
}

class IntegerMatch extends Match {
  constructor(
    public result: boolean,
    public value?: string,
  ) {
    super(result);
  }

  isSigned(): boolean {
    return this.result
      ? this.value![0] === "+" || this.value![0] === "-"
      : false;
  }
}

class RationalMatch extends Match {
  constructor(
    public result: boolean,
    public numerator?: string,
    public denominator?: string,
  ) {
    super(result);
  }
}

class RealMatch extends Match {
  constructor(
    public result: boolean,
    public integer?: string,
    public decimal?: string,
    public exponent?: Match,
  ) {
    super(result);
  }
}

class ComplexMatch extends Match {
  constructor(
    public result: boolean,
    public real?: Match,
    public sign?: string,
    public imaginary?: Match,
  ) {
    super(result);
  }
}

// these are used to determine the type of the number and to separate it into its parts as well
export function isInteger(value: string): IntegerMatch {
  // <integer> = [+-]?<digit>+
  // check if the value is an integer. if it is, return true and the value.
  // if not, return false and an empty array.
  const integerRegex = new RegExp(`^([+-]?)(\\d+)$`);
  const match = integerRegex.exec(value);
  if (match) {
    return new IntegerMatch(true, match[0]);
  }
  return new IntegerMatch(false);
}

export function isRational(value: string): RationalMatch {
  // <rational> = <integer>/<integer>
  // both sides of the rational should parse as integers
  // we can split the rational into two parts and check if both are integers
  // make sure there is a /
  const count = (value.match(/\//g) || []).length;
  if (count !== 1) {
    return new RationalMatch(false);
  }
  const parts = value.split("/");
  if (parts.length !== 2) {
    return new RationalMatch(false);
  }
  const [numerator, denominator] = parts;
  const numeratorMatch = isInteger(numerator);
  const denominatorMatch = isInteger(denominator);

  if (!(numeratorMatch.result && denominatorMatch.result)) {
    return new RationalMatch(false);
  }

  return new RationalMatch(true, numerator, denominator);
}

export function isReal(value: string): RealMatch {
  // <real> = <basic> | <extended>
  // <basic>: [+-]?a.b | [+-]?a | [+-]?.b | [+-]?a.
  // <extended>: <basic>[eE]<integer | rational | real>
  // where a = <digit>+ | inf | nan
  //       b = <digit>+
  //
  // keep in mind that the value matches an integer too! but
  // by the point of time this is called, we have already checked for an integer
  function checkBasicReal(value: string): RealMatch {
    function isSpecialNumber(value: string): boolean {
      const specialRegex = new RegExp(`^([+-]?)(inf|nan)$`);
      const match = specialRegex.exec(value);
      return match !== null;
    }
    // check for the presence of a dot
    const count = (value.match(/\./g) || []).length;
    if (count > 1) {
      return new RealMatch(false);
    }

    if (count === 0) {
      // check for a special number
      if (isSpecialNumber(value)) {
        return new RealMatch(true, value);
      }

      // check for a default integer
      const result = isInteger(value);
      return new RealMatch(result.result, result.value);
    }

    // check for a basic real number
    const [integerPart, decimalPart] = value.split(".");
    const integerMatch = isInteger(integerPart);
    const decimalMatch = isInteger(decimalPart);

    const properInteger = integerMatch.result || integerPart === "";
    const properDecimal = decimalMatch.result || decimalPart === "";

    // if the integer part is a special number, the decimal part should be 0
    if (isSpecialNumber(integerPart)) {
      if (decimalPart !== "0") {
        return new RealMatch(false);
      }
      return new RealMatch(true, value);
    }

    // at least one of the parts should be non-empty
    if (
      !(
        (integerMatch.result && properDecimal) ||
        (properInteger && decimalMatch.result)
      )
    ) {
      return new RealMatch(false);
    }

    // if there is a decimal match, there should have no sign
    if (decimalMatch.result && decimalMatch.isSigned()) {
      return new RealMatch(false);
    }

    return new RealMatch(true, integerMatch.value, decimalMatch.value);
  }

  function checkExtendedReal(value: string): RealMatch {
    // split the value into two parts by e/E
    const parts = value.split(/[eE]/, 2);
    console.log(parts);
    if (parts.length !== 2) {
      return new RealMatch(false);
    }
    const [basicRealPart, exponentPart] = parts;

    // parse each part
    const basicRealMatch = checkBasicReal(basicRealPart);

    if (!basicRealMatch.result) {
      return new RealMatch(false);
    }

    // match the exponent part across types up to real
    const exponentMatch = universalMatch(exponentPart, NumberType.REAL);
    if (!exponentMatch.result) {
      return new RealMatch(false);
    }

    return new RealMatch(
      true,
      basicRealMatch.integer,
      basicRealMatch.decimal,
      exponentMatch,
    );
  }

  // check for the presence of e/E
  const count = (value.match(/[eE]/g) || []).length;

  if (count === 0) {
    // check for a basic real number
    return checkBasicReal(value);
  }

  // check for an extended real number
  return checkExtendedReal(value);
}

export function isComplex(value: string): ComplexMatch {
  // <basic-num> = <integer> | <rational> | <real>
  // <complex> = <basic-num>[+-]<basic-num>i
  // check if the value is a complex number. if it is, return true and the value.
  // if not, return a failed match.
  const count = (value.match(/i/g) || []).length;
  if (count !== 1) {
    return new ComplexMatch(false);
  }

  if (value[value.length - 1] !== "i") {
    return new ComplexMatch(false);
  }

  // find the first + or - that is not at the start of the string
  // this is the split point
  const splitPoint = value.search(/(?<!^)[+-]/);

  // if no such point was found,
  if (splitPoint === -1) {
    // the value may be purely imaginary

    const imaginaryPart = value.split("i")[0];
    const imaginaryMatch = universalMatch(imaginaryPart, NumberType.REAL);

    if (imaginaryMatch.result) {
      return new ComplexMatch(true, undefined, undefined, imaginaryMatch);
    }

    return new ComplexMatch(false);
  }

  const realPart = value.slice(0, splitPoint);
  const imaginaryPart = value.slice(splitPoint + 1, -1);
  const realMatch = universalMatch(realPart, NumberType.REAL);
  const imaginaryMatch = universalMatch(imaginaryPart, NumberType.REAL);

  if (!(realMatch.result && imaginaryMatch.result)) {
    return new ComplexMatch(false);
  }

  return new ComplexMatch(true, realMatch, value[splitPoint], imaginaryMatch);
}

// tests the value across all possible types
// only limited by the finalWillingType of
function universalMatch(value: string, finalWillingType: NumberType): Match {
  const integerMatch = isInteger(value);
  if (integerMatch.result && finalWillingType >= NumberType.INTEGER) {
    return integerMatch;
  }
  const rationalMatch = isRational(value);
  if (rationalMatch.result && finalWillingType >= NumberType.RATIONAL) {
    return rationalMatch;
  }
  const realMatch = isReal(value);
  if (realMatch.result && finalWillingType >= NumberType.REAL) {
    return realMatch;
  }
  const complexMatch = isComplex(value);
  if (complexMatch.result && finalWillingType >= NumberType.COMPLEX) {
    return complexMatch;
  }
  return new IntegerMatch(false) as Match;
}

// for the lexer.
export function stringIsSchemeNumber(value: string): boolean {
  const match = universalMatch(value, NumberType.COMPLEX);
  return match.result;
}

// Each class has a numberType property that is used to determine the type of the number.
// If another instance's numbertype is higher in an operation, it will "promote" itself to the higher type.

// Each class also has a convert method that converts the number back into a javascript number.
// This is used when the number is used in a context where a javascript number is expected.
// If used in contexts where the values are too extreme for a javascript number, it will throw an error.
// This includes attempting to convert a complex number to a javascript number.

// If a simplified rational number has a denominator of 1, it will convert to an integer.

// for now, either a integer or real.
export let make_number = (value: number): SchemeNumber => {
  if (Number.isInteger(value)) {
    return SchemeInteger.build(value);
  }
  return SchemeReal.build(value > 0, Math.abs(value), 0);
};

class SchemeInteger {
  readonly numberType = NumberType.INTEGER;
  private readonly value: bigint;

  private constructor(value: bigint) {
    this.value = value;
  }

  // Factory method for creating a new SchemeInteger instance.
  // Force prevents automatic downcasting to a lower type.
  static build(
    value: number | string | bigint,
    force: boolean = false,
  ): SchemeInteger {
    return new SchemeInteger(BigInt(value));
  }

  promote(): SchemeRational {
    return SchemeRational.build(this.value, 1n, true) as SchemeRational;
  }

  equals(other: any): boolean {
    return other instanceof SchemeInteger && this.value === other.value;
  }

  greaterThan(other: SchemeInteger): boolean {
    return this.value > other.value;
  }

  negate(): SchemeInteger {
    return SchemeInteger.build(-this.value);
  }

  multiplicativeInverse(): SchemeInteger | SchemeRational {
    if (this.value === 0n) {
      throw new Error("Division by zero");
    }
    return SchemeRational.build(1n, this.value, false);
  }

  add(other: SchemeInteger): SchemeInteger {
    return SchemeInteger.build(this.value + other.value);
  }

  multiply(other: SchemeInteger): SchemeInteger {
    return SchemeInteger.build(this.value * other.value);
  }

  coerce(): number {
    return Number(this.value);
  }

  toString(): string {
    return this.value.toString();
  }
}

class SchemeRational {
  readonly numberType = NumberType.RATIONAL;
  private readonly numerator: bigint;
  private readonly denominator: bigint;

  private constructor(numerator: bigint, denominator: bigint) {
    this.numerator = numerator;
    this.denominator = denominator;
  }

  // Builds a rational number.
  // Force prevents automatic downcasting to a lower type.
  static build(
    numerator: number | string | bigint,
    denominator: number | string | bigint,
    force: boolean = false,
  ): SchemeRational | SchemeInteger {
    return SchemeRational.simplify(
      BigInt(numerator),
      BigInt(denominator),
      force,
    );
  }

  private static simplify(
    numerator: bigint,
    denominator: bigint,
    force: boolean = false,
  ): SchemeRational | SchemeInteger {
    const gcd = (a: bigint, b: bigint): bigint => {
      if (b === 0n) {
        return a;
      }
      return gcd(b, a.valueOf() % b.valueOf());
    };
    const divisor = gcd(numerator, denominator);
    const numeratorSign = numerator < 0n ? -1n : 1n;
    const denominatorSign = denominator < 0n ? -1n : 1n;
    // determine the sign of the result
    const sign = numeratorSign * denominatorSign;
    // remove the sign from the numerator and denominator
    numerator = numerator * numeratorSign;
    denominator = denominator * denominatorSign;
    // if the denominator is 1, we can return an integer
    if (denominator === 1n && !force) {
      return SchemeInteger.build(sign * numerator);
    }
    return new SchemeRational(
      (sign * numerator) / divisor,
      denominator / divisor,
    );
  }

  promote(): SchemeReal {
    const sign = this.numerator < 0n ? -1n : 1n;
    // remove the sign from the numerator
    let numerator = this.numerator * sign;
    let denominator = this.denominator;
    let exponent = 0n;
    // bring both values to the safe range of a javascript number
    while (numerator > Number.MAX_SAFE_INTEGER) {
      numerator /= 10n;
      exponent++;
    }
    while (denominator > Number.MAX_SAFE_INTEGER) {
      denominator /= 10n;
      exponent--;
    }
    // now we can safely create the mantissa
    let mantissa = Number(numerator / denominator);
    // we need to normalize the mantissa
    while (mantissa > 10) {
      mantissa /= 10;
      exponent++;
    }
    while (mantissa < 1) {
      mantissa *= 10;
      exponent--;
    }
    return SchemeReal.build(sign > 0, mantissa, exponent, true);
  }

  equals(other: any): boolean {
    return (
      other instanceof SchemeRational &&
      this.numerator === other.numerator &&
      this.denominator === other.denominator
    );
  }

  greaterThan(other: SchemeRational): boolean {
    return (
      this.numerator * other.denominator > other.numerator * this.denominator
    );
  }

  negate(): SchemeRational {
    return SchemeRational.build(
      -this.numerator,
      this.denominator,
    ) as SchemeRational;
  }

  multiplicativeInverse(): SchemeInteger | SchemeRational {
    if (this.numerator === 0n) {
      throw new Error("Division by zero");
    }
    return SchemeRational.build(this.denominator, this.numerator);
  }

  add(other: SchemeRational): SchemeInteger | SchemeRational {
    const newNumerator =
      this.numerator * other.denominator + other.numerator * this.denominator;
    const newDenominator = this.denominator * other.denominator;
    return SchemeRational.build(newNumerator, newDenominator);
  }

  multiply(other: SchemeRational): SchemeInteger | SchemeRational {
    const newNumerator = this.numerator * other.numerator;
    const newDenominator = this.denominator * other.denominator;
    return SchemeRational.build(newNumerator, newDenominator);
  }

  coerce(): number {
    throw new Error("Cannot coerce a rational number to a javascript number");
  }

  toString(): string {
    return `${this.numerator}/${this.denominator}`;
  }
}

class SchemeReal {
  readonly numberType = NumberType.REAL;
  private readonly positive: boolean;
  private readonly mantissa: number;
  private readonly exponent: bigint;
  private static readonly epsilon = 1e-10;
  private static readonly ZERO = new SchemeReal(true, 0, 0n);

  static build(
    positive: boolean,
    mantissa: number,
    exponent: number | string | bigint,
    force: boolean = false,
  ): SchemeReal {
    if (mantissa === 0) {
      return SchemeReal.ZERO;
    }
    let newMantissa = mantissa;
    let newExponent = BigInt(exponent);
    while (newMantissa > 10) {
      newMantissa /= 10;
      newExponent++;
    }
    while (newMantissa < 1) {
      newMantissa *= 10;
      newExponent--;
    }
    return new SchemeReal(positive, newMantissa, newExponent);
  }

  private constructor(positive: boolean, mantissa: number, exponent: bigint) {
    this.positive = positive;
    this.mantissa = mantissa;
    this.exponent = exponent;
  }

  promote(): SchemeComplex {
    return SchemeComplex.build(this, SchemeReal.ZERO, true) as SchemeComplex;
  }

  equals(other: any): boolean {
    return (
      other instanceof SchemeReal &&
      this.positive === other.positive &&
      this.exponent === other.exponent &&
      Math.abs(this.mantissa - other.mantissa) < SchemeReal.epsilon
    );
  }

  greaterThan(other: SchemeReal): boolean {
    if (this.positive !== other.positive) {
      return this.positive;
    }
    if (this.exponent !== other.exponent) {
      return this.exponent > other.exponent;
    }
    return this.mantissa > other.mantissa;
  }

  negate(): SchemeReal {
    if (this === SchemeReal.ZERO) {
      return SchemeReal.ZERO;
    }
    return SchemeReal.build(!this.positive, this.mantissa, this.exponent);
  }

  multiplicativeInverse(): SchemeReal {
    if (this === SchemeReal.ZERO) {
      throw new Error("Division by zero");
    }
    return SchemeReal.build(this.positive, 1 / this.mantissa, -this.exponent);
  }

  add(other: SchemeReal): SchemeReal {
    const exponentDifference = this.exponent - other.exponent;
    const sign = this.positive === other.positive ? 1 : -1;
    let newMantissa;
    if (exponentDifference > 0) {
      newMantissa =
        this.mantissa +
        sign * other.mantissa * 10 ** Number(exponentDifference);
    } else {
      newMantissa =
        sign * this.mantissa * 10 ** Number(-exponentDifference) +
        other.mantissa;
    }
    if (newMantissa === 0) {
      return SchemeReal.ZERO;
    }
    return SchemeReal.build(this.positive, newMantissa, this.exponent);
  }

  multiply(other: SchemeReal): SchemeReal {
    const newMantissa = this.mantissa * other.mantissa;
    const newExponent = this.exponent + other.exponent;
    if (newMantissa === 0) {
      return SchemeReal.ZERO;
    }
    return SchemeReal.build(
      this.positive === other.positive,
      newMantissa,
      newExponent,
    );
  }

  coerce(): number {
    throw new Error("Cannot coerce a real number to a javascript number");
  }

  toString(): string {
    if (this.exponent === 0n) {
      return `${this.mantissa}`;
    }
    return `${this.mantissa}e${this.exponent}`;
  }
}

class SchemeComplex {
  readonly numberType = NumberType.COMPLEX;
  private readonly real: SchemeInteger | SchemeRational | SchemeReal;
  private readonly imaginary: SchemeInteger | SchemeRational | SchemeReal;

  static build(
    real: SchemeReal | SchemeRational | SchemeInteger,
    imaginary: SchemeReal | SchemeRational | SchemeInteger,
    force: boolean = false,
  ): SchemeComplex {
    return new SchemeComplex(real, imaginary);
  }

  private constructor(
    real: SchemeReal | SchemeRational | SchemeInteger,
    imaginary: SchemeReal | SchemeRational | SchemeInteger,
  ) {
    this.real = real;
    this.imaginary = imaginary;
  }

  promote(): SchemeComplex {
    return this;
  }

  negate(): SchemeComplex {
    return SchemeComplex.build(this.real.negate(), this.imaginary.negate());
  }

  equals(other: SchemeComplex): boolean {
    return (
      atomic_equals(this.real, other.real) &&
      atomic_equals(this.imaginary, other.imaginary)
    );
  }

  greaterThan(other: SchemeComplex): boolean {
    return (
      atomic_greater_than(this.real, other.real) &&
      atomic_greater_than(this.imaginary, other.imaginary)
    );
  }

  multiplicativeInverse(): SchemeComplex {
    // inverse of a + bi = a - bi / a^2 + b^2
    // in this case, we use a / a^2 + b^2 and -b / a^2 + b^2 as the new values required
    const denominator = atomic_add(
      atomic_multiply(this.real, this.real),
      atomic_multiply(this.imaginary, this.imaginary),
    ) as SchemeInteger | SchemeRational | SchemeReal;
    return SchemeComplex.build(
      atomic_multiply(denominator.multiplicativeInverse(), this.real) as
        | SchemeInteger
        | SchemeRational
        | SchemeReal,
      atomic_multiply(
        denominator.multiplicativeInverse(),
        this.imaginary.negate(),
      ) as SchemeInteger | SchemeRational | SchemeReal,
    );
  }

  add(other: SchemeComplex): SchemeComplex {
    return SchemeComplex.build(
      atomic_add(this.real, other.real) as
        | SchemeInteger
        | SchemeRational
        | SchemeReal,
      atomic_add(this.imaginary, other.imaginary) as
        | SchemeInteger
        | SchemeRational
        | SchemeReal,
    );
  }

  multiply(other: SchemeComplex): SchemeComplex {
    // (a + bi) * (c + di) = (ac - bd) + (ad + bc)i
    const realPart = atomic_subtract(
      atomic_multiply(this.real, other.real),
      atomic_multiply(this.imaginary, other.imaginary),
    ) as SchemeInteger | SchemeRational | SchemeReal;
    const imaginaryPart = atomic_add(
      atomic_multiply(this.real, other.imaginary),
      atomic_multiply(this.imaginary, other.real),
    ) as SchemeInteger | SchemeRational | SchemeReal;
    return SchemeComplex.build(realPart, imaginaryPart);
  }

  coerce(): number {
    throw new Error("Cannot coerce a complex number to a javascript number");
  }

  toString(): string {
    return `${this.real}+${this.imaginary}i`;
  }
}

// these functions are used to convert a number to a javascript number.
// it should only be limited to numbers used for indexing, integers.
export function coerce_to_number(a: SchemeNumber): number {
  return a.coerce();
}

// these functions deal with checking the type of a number.
export function is_number(a: any): boolean {
  return (
    a.numberType !== undefined &&
    Object.values(NumberType).includes(a.numberType)
  );
}

export function is_integer(a: any): boolean {
  return is_number(a) && a.numberType <= 1;
}

export function is_rational(a: any): boolean {
  return is_number(a) && a.numberType <= 2;
}

export function is_real(a: any): boolean {
  return is_number(a) && a.numberType <= 3;
}

export function is_complex(a: any): boolean {
  return is_number(a) && a.numberType <= 4;
}

// the functions below are used to perform operations on numbers

/**
 * This function takes two numbers and brings them to the same level.
 */
function equalify(
  a: SchemeNumber,
  b: SchemeNumber,
): [SchemeNumber, SchemeNumber] {
  if (a.numberType > b.numberType) {
    return equalify(a, b.promote());
  } else if (a.numberType < b.numberType) {
    return equalify(a.promote(), b);
  }
  return [a, b];
}

export function atomic_negate(a: SchemeNumber): SchemeNumber {
  return a.negate();
}

export function atomic_inverse(a: SchemeNumber): SchemeNumber {
  return a.multiplicativeInverse();
}

export function atomic_equals(a: SchemeNumber, b: SchemeNumber): boolean {
  const [newA, newB] = equalify(a, b);
  // safe to cast as we are assured they are of the same type
  return newA.equals(newB as any);
}

export function atomic_less_than(a: SchemeNumber, b: SchemeNumber): boolean {
  return !atomic_greater_than(a, b) && !atomic_equals(a, b);
}

export function atomic_less_than_or_equals(
  a: SchemeNumber,
  b: SchemeNumber,
): boolean {
  return !atomic_greater_than(a, b);
}

export function atomic_greater_than(a: SchemeNumber, b: SchemeNumber): boolean {
  const [newA, newB] = equalify(a, b);
  // safe to cast as we are assured they are of the same type
  return newA.greaterThan(newB as any);
}

export function atomic_greater_than_or_equals(
  a: SchemeNumber,
  b: SchemeNumber,
): boolean {
  return atomic_greater_than(a, b) || atomic_equals(a, b);
}

export function atomic_add(a: SchemeNumber, b: SchemeNumber): SchemeNumber {
  const [newA, newB] = equalify(a, b);
  // safe to cast as we are assured they are of the same type
  return newA.add(newB as any);
}

export function atomic_multiply(
  a: SchemeNumber,
  b: SchemeNumber,
): SchemeNumber {
  const [newA, newB] = equalify(a, b);
  // safe to cast as we are assured they are of the same type
  return newA.multiply(newB as any);
}

export function atomic_subtract(
  a: SchemeNumber,
  b: SchemeNumber,
): SchemeNumber {
  return atomic_add(a, atomic_negate(b));
}

export function atomic_divide(a: SchemeNumber, b: SchemeNumber): SchemeNumber {
  return atomic_multiply(a, atomic_inverse(b));
}
