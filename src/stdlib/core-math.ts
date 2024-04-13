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
  abstract build(): SchemeNumber;
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

  build(): SchemeInteger {
    return SchemeInteger.build(this.value!);
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

  build(): SchemeInteger | SchemeRational {
    return SchemeRational.build(this.numerator!, this.denominator!);
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

  build(): SchemeReal {
    if (this.integer?.includes("inf")) {
      return this.integer!.includes("-")
        ? SchemeReal.NEG_INFINITY
        : SchemeReal.INFINITY;
    }

    if (this.integer?.includes("nan")) {
      return SchemeReal.NAN;
    }

    // recursively build the exponent
    let exponent = (
      this.exponent ? this.exponent.build() : SchemeReal.INEXACT_ZERO
    ).coerce();

    // we are assured that either part exists
    let value = Number(
      (this.integer ? this.integer : "0") +
        "." +
        (this.decimal ? this.decimal : "0"),
    );

    // apply the exponent
    value *= Math.pow(10, exponent);

    return SchemeReal.build(value);
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
  build(): SchemeNumber {
    const real = this.real
      ? (this.real.build() as SchemeInteger | SchemeRational | SchemeReal)
      : SchemeInteger.EXACT_ZERO;
    const imaginary = this.imaginary!.build() as
      | SchemeInteger
      | SchemeRational
      | SchemeReal;

    if (this.sign && this.sign === "-") {
      return SchemeComplex.build(real, imaginary.negate());
    }

    return SchemeComplex.build(real, imaginary);
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
    // checks if the value is one of the 4 forms of special numbers
    function isSpecialNumber(value: string): boolean {
      return (
        value === "+inf.0" ||
        value === "-inf.0" ||
        value === "+nan.0" ||
        value === "-nan.0"
      );
    }

    // check if the value is a special number
    if (isSpecialNumber(value)) {
      return new RealMatch(true, value);
    }

    // check for the presence of a dot
    const count = (value.match(/\./g) || []).length;
    if (count > 1) {
      return new RealMatch(false);
    }

    if (count === 0) {
      const result = isInteger(value);
      return new RealMatch(result.result, result.value);
    }

    // check for a basic real number
    const [integerPart, decimalPart] = value.split(".");
    const integerMatch = isInteger(integerPart);
    const decimalMatch = isInteger(decimalPart);

    const properInteger = integerMatch.result || integerPart === "";
    const properDecimal = decimalMatch.result || decimalPart === "";

    // if the integer part is just a sign, the decimal part should be non-empty
    if (integerPart === "+" || integerPart === "-") {
      if (decimalPart === "") {
        return new RealMatch(false);
      }
      return new RealMatch(true, `${integerPart}0`, value);
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
    const first_e_index = value.indexOf("e");
    const first_E_index = value.indexOf("E");
    if (first_e_index === -1 && first_E_index === -1) {
      return new RealMatch(false);
    }

    const exponentIndex = first_e_index === -1 ? first_E_index : first_e_index;

    const basicRealPart = value.substring(0, exponentIndex);
    const exponentPart = value.substring(exponentIndex + 1);

    // both should not be empty
    if (basicRealPart === "" || exponentPart == "") {
      return new RealMatch(false);
    }

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
  if (count < 1) {
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

    let imaginaryPart = value.slice(0, -1);

    const imaginaryMatch = universalMatch(imaginaryPart, NumberType.REAL);

    if (imaginaryMatch.result) {
      return new ComplexMatch(true, undefined, undefined, imaginaryMatch);
    }

    return new ComplexMatch(false);
  }

  const realPart = value.slice(0, splitPoint);
  let imaginaryPart = value.slice(splitPoint + 1, -1);

  // if imaginaryPart doesn't start with a sign, add one
  // this lets us properly parse expressions such as 1+inf.0i
  // even if the + belongs to the complex number
  if (imaginaryPart[0] !== "+" && imaginaryPart[0] !== "-") {
    imaginaryPart = "+" + imaginaryPart;
  }
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

// We are assured that the string passed to this function is a valid number.
export let make_number = (value: string): SchemeNumber => {
  const match = universalMatch(value, NumberType.COMPLEX);
  if (!match.result) {
    throw new Error("Invalid number");
  }
  return match.build();
};

export class SchemeInteger {
  readonly numberType = NumberType.INTEGER;
  private readonly value: bigint;
  static readonly EXACT_ZERO = new SchemeInteger(0n);

  private constructor(value: bigint) {
    this.value = value;
  }

  // Factory method for creating a new SchemeInteger instance.
  // Force prevents automatic downcasting to a lower type.
  static build(
    value: number | string | bigint,
    _force: boolean = false,
  ): SchemeInteger {
    const val = BigInt(value);
    if (val === 0n) {
      return SchemeInteger.EXACT_ZERO;
    }
    return new SchemeInteger(val);
  }

  promote(nType: NumberType): SchemeNumber {
    switch (nType) {
      case NumberType.INTEGER:
        return this;
      case NumberType.RATIONAL:
        return SchemeRational.build(this.value, 1n, true);
      case NumberType.REAL:
        return SchemeReal.build(this.coerce(), true);
      case NumberType.COMPLEX:
        return SchemeComplex.build(this, SchemeInteger.EXACT_ZERO);
    }
  }

  equals(other: any): boolean {
    return other instanceof SchemeInteger && this.value === other.value;
  }

  greaterThan(other: SchemeInteger): boolean {
    return this.value > other.value;
  }

  negate(): SchemeInteger {
    if (this === SchemeInteger.EXACT_ZERO) {
      return this;
    }
    return SchemeInteger.build(-this.value);
  }

  multiplicativeInverse(): SchemeInteger | SchemeRational {
    if (this === SchemeInteger.EXACT_ZERO) {
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
    if (this.value > Number.MAX_SAFE_INTEGER) {
      return Infinity;
    }

    if (this.value < Number.MIN_SAFE_INTEGER) {
      return -Infinity;
    }

    return Number(this.value);
  }

  toString(): string {
    return this.value.toString();
  }
}

export class SchemeRational {
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

  getNumerator(): bigint {
    return this.numerator;
  }

  getDenominator(): bigint {
    return this.denominator;
  }

  promote(nType: NumberType): SchemeNumber {
    switch (nType) {
      case NumberType.RATIONAL:
        return this;
      case NumberType.REAL:
        return SchemeReal.build(this.coerce(), true);
      case NumberType.COMPLEX:
        return SchemeComplex.build(this, SchemeInteger.EXACT_ZERO);
      default:
        throw new Error("Unable to demote rational");
    }
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
    const workingNumerator =
      this.numerator < 0n ? -this.numerator : this.numerator;
    let converterDenominator = this.denominator;

    // we can take the whole part directly
    const wholePart = Number(workingNumerator / converterDenominator);

    if (wholePart > Number.MAX_VALUE) {
      return this.numerator < 0n ? -Infinity : Infinity;
    }
    // remainder should be lossily converted below safe levels
    let remainder = workingNumerator % converterDenominator;

    // we lossily convert both values below safe number thresholds
    while (
      remainder > Number.MAX_SAFE_INTEGER ||
      converterDenominator > Number.MAX_SAFE_INTEGER
    ) {
      remainder = remainder / 2n;
      converterDenominator = converterDenominator / 2n;
    }

    // coerce the now safe parts into a remainder number
    const remainderPart = Number(remainder) / Number(converterDenominator);

    return this.numerator < 0n
      ? -(wholePart + remainderPart)
      : wholePart + remainderPart;
  }

  toString(): string {
    return `${this.numerator}/${this.denominator}`;
  }
}

// it is allowable to represent the Real number using
// float/double representation, and so we shall do that.
// the current schemeReal implementation is fully based
// on JavaScript numbers.
export class SchemeReal {
  readonly numberType = NumberType.REAL;
  private readonly value: number;

  public static INEXACT_ZERO = new SchemeReal(0);
  public static INEXACT_NEG_ZERO = new SchemeReal(-0);
  public static INFINITY = new SchemeReal(Infinity);
  public static NEG_INFINITY = new SchemeReal(-Infinity);
  public static NAN = new SchemeReal(NaN);

  static build(value: number, _force: boolean = false): SchemeReal {
    if (value === Infinity) {
      return SchemeReal.INFINITY;
    } else if (value === -Infinity) {
      return SchemeReal.NEG_INFINITY;
    } else if (isNaN(value)) {
      return SchemeReal.NAN;
    } else if (value === 0) {
      return SchemeReal.INEXACT_ZERO;
    } else if (value === -0) {
      return SchemeReal.INEXACT_NEG_ZERO;
    }
    return new SchemeReal(value);
  }

  private constructor(value: number) {
    this.value = value;
  }

  promote(nType: NumberType): SchemeNumber {
    switch (nType) {
      case NumberType.REAL:
        return this;
      case NumberType.COMPLEX:
        return SchemeComplex.build(this, SchemeInteger.EXACT_ZERO);
      default:
        throw new Error("Unable to demote real");
    }
  }

  equals(other: any): boolean {
    return other instanceof SchemeReal && this.value === other.value;
  }

  greaterThan(other: SchemeReal): boolean {
    return this.value > other.value;
  }

  negate(): SchemeReal {
    return SchemeReal.build(-this.value);
  }

  multiplicativeInverse(): SchemeReal {
    if (
      this === SchemeReal.INEXACT_ZERO ||
      this === SchemeReal.INEXACT_NEG_ZERO
    ) {
      throw new Error("Division by zero");
    }
    return SchemeReal.build(1 / this.value);
  }

  add(other: SchemeReal): SchemeReal {
    return SchemeReal.build(this.value + other.value);
  }

  multiply(other: SchemeReal): SchemeReal {
    return SchemeReal.build(this.value * other.value);
  }

  coerce(): number {
    return this.value;
  }

  toString(): string {
    if (this === SchemeReal.INFINITY) {
      return "+inf.0";
    }
    if (this === SchemeReal.NEG_INFINITY) {
      return "-inf.0";
    }
    if (this === SchemeReal.NAN) {
      return "+nan.0";
    }
    return this.value.toString();
  }
}

export class SchemeComplex {
  readonly numberType = NumberType.COMPLEX;
  private readonly real: SchemeInteger | SchemeRational | SchemeReal;
  private readonly imaginary: SchemeInteger | SchemeRational | SchemeReal;

  static build(
    real: SchemeReal | SchemeRational | SchemeInteger,
    imaginary: SchemeReal | SchemeRational | SchemeInteger,
    force: boolean = false,
  ): SchemeNumber {
    return SchemeComplex.simplify(new SchemeComplex(real, imaginary), force);
  }

  private constructor(
    real: SchemeReal | SchemeRational | SchemeInteger,
    imaginary: SchemeReal | SchemeRational | SchemeInteger,
  ) {
    this.real = real;
    this.imaginary = imaginary;
  }

  private static simplify(
    complex: SchemeComplex,
    force: boolean,
  ): SchemeNumber {
    if (!force && atomic_equals(complex.imaginary, SchemeInteger.EXACT_ZERO)) {
      return complex.real;
    }
    return complex;
  }

  promote(nType: NumberType): SchemeNumber {
    switch (nType) {
      case NumberType.COMPLEX:
        return this;
      default:
        throw new Error("Unable to demote complex");
    }
  }

  negate(): SchemeNumber {
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

  multiplicativeInverse(): SchemeNumber {
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

  add(other: SchemeComplex): SchemeNumber {
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

  multiply(other: SchemeComplex): SchemeNumber {
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

  getReal(): SchemeInteger | SchemeRational | SchemeReal {
    return this.real;
  }

  getImaginary(): SchemeInteger | SchemeRational | SchemeReal {
    return this.imaginary;
  }

  coerce(): number {
    throw new Error("Cannot coerce a complex number to a javascript number");
  }

  toPolar(): SchemePolar {
    // force both the real and imaginary parts to be inexact
    const real = this.real.promote(NumberType.REAL) as SchemeReal;
    const imaginary = this.imaginary.promote(NumberType.REAL) as SchemeReal;

    // schemeReals can be reasoned with using the same logic as javascript numbers
    // r = sqrt(a^2 + b^2)
    const magnitude = SchemeReal.build(
      Math.sqrt(
        real.coerce() * real.coerce() + imaginary.coerce() * imaginary.coerce(),
      ),
    );
    // theta = atan(b / a)
    const angle = SchemeReal.build(
      Math.atan2(imaginary.coerce(), real.coerce()),
    );
    return SchemePolar.build(magnitude, angle);
  }

  toString(): string {
    return `${this.real}+${this.imaginary}i`;
  }
}

// an alternative form of the complex number.
// only used in intermediate steps, will be converted back at the end of the operation.
// current scm-slang will force any polar complex numbers to be made
// inexact, hence we opt to limit the use of polar form as much as possible.
class SchemePolar {
  private readonly magnitude: SchemeReal;
  private readonly angle: SchemeReal;

  constructor(magnitude: SchemeReal, angle: SchemeReal) {
    this.magnitude = magnitude;
    this.angle = angle;
  }

  static build(magnitude: SchemeReal, angle: SchemeReal): SchemePolar {
    return new SchemePolar(magnitude, angle);
  }

  // converts the polar number back to a cartesian complex number
  toCartesian(): SchemeNumber {
    // a + bi = r * cos(theta) + r * sin(theta)i
    // a = r * cos(theta)
    // b = r * sin(theta)
    const real = SchemeReal.build(
      this.magnitude.coerce() * Math.cos(this.angle.coerce()),
    );
    const imaginary = SchemeReal.build(
      this.magnitude.coerce() * Math.sin(this.angle.coerce()),
    );
    return SchemeComplex.build(real, imaginary);
  }
}

export const infinity = SchemeReal.INFINITY;
export const nan = SchemeReal.NAN;

// this function is used to convert a number to a javascript number.
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

export function is_exact(a: any): boolean {
  // if the number is a complex number, we need to check both the real and imaginary parts
  return is_number(a)
    ? a.numberType === 4
      ? is_exact(a.real) && is_exact(a.imaginary)
      : a.numberType <= 2
    : false;
}

export function is_inexact(a: any): boolean {
  // defined in terms of is_exact
  return is_number(a) && !is_exact(a);
}

// the functions below are used to perform operations on numbers

function simplify(a: SchemeNumber): SchemeNumber {
  switch (a.numberType) {
    case NumberType.INTEGER:
      return a;
    case NumberType.RATIONAL:
      return (a as SchemeRational).getDenominator() === 1n
        ? SchemeInteger.build(a.getNumerator())
        : a;
    case NumberType.REAL:
      return a;
    case NumberType.COMPLEX:
      // safe to cast as simplify never promotes a number
      return SchemeComplex.build(
        simplify((a as SchemeComplex).getReal()) as SchemeInteger | SchemeRational | SchemeReal,
        simplify((a as SchemeComplex).getImaginary()) as SchemeInteger | SchemeRational | SchemeReal,
      );
    }
}

/**
 * This function takes two numbers and brings them to the same level.
 */
function equalify(
  a: SchemeNumber,
  b: SchemeNumber,
): [SchemeNumber, SchemeNumber] {
  if (a.numberType > b.numberType) {
    return [a, b.promote(a.numberType)];
  } else if (a.numberType < b.numberType) {
    return [a.promote(b.numberType), b];
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
  return simplify(newA.add(newB as any));
}

export function atomic_multiply(
  a: SchemeNumber,
  b: SchemeNumber,
): SchemeNumber {
  const [newA, newB] = equalify(a, b);
  // safe to cast as we are assured they are of the same type
  return simplify(newA.multiply(newB as any));
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

/**
 * Important constants
 */
export const PI = SchemeReal.build(Math.PI);
export const E = SchemeReal.build(Math.E);
export const SQRT2 = SchemeReal.build(Math.SQRT2);
export const LN2 = SchemeReal.build(Math.LN2);
export const LN10 = SchemeReal.build(Math.LN10);
export const LOG2E = SchemeReal.build(Math.LOG2E);
export const LOG10E = SchemeReal.build(Math.LOG10E);
export const SQRT1_2 = SchemeReal.build(Math.SQRT1_2);

// other important functions
