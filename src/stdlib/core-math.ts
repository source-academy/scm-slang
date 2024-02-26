// The core library of scm-slang,
// different from the base library,
// this library contains all methods required
// for the language to function properly.n

// This file contains the minimum subset
// required for arithmetic to work.
// which includes the numeric tower.

type SchemeNumber = SchemeInteger | SchemeRational | SchemeReal | SchemeComplex;

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
  readonly numberType = 1;
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

  equals(other: SchemeInteger): boolean {
    return this.value === other.value;
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

  toString(): string {
    return this.value.toString();
  }
}

class SchemeRational {
  readonly numberType = 2;
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

  equals(other: SchemeRational): boolean {
    return (
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

  toString(): string {
    return `${this.numerator}/${this.denominator}`;
  }
}

class SchemeReal {
  readonly numberType = 3;
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
    while (mantissa > 10) {
      newMantissa /= 10;
      newExponent++;
    }
    while (mantissa < 1) {
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

  equals(other: SchemeReal): boolean {
    return (
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

  toString(): string {
    if (this.exponent === 0n) {
      return `${this.mantissa}`;
    }
    return `${this.mantissa}e${this.exponent}`;
  }
}

class SchemeComplex {
  readonly numberType = 4;
  private readonly real: SchemeReal;
  private readonly imaginary: SchemeReal;

  static build(
    real: SchemeReal,
    imaginary: SchemeReal,
    force: boolean = false,
  ): SchemeComplex {
    return new SchemeComplex(real, imaginary);
  }

  private constructor(real: SchemeReal, imaginary: SchemeReal) {
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
      this.real.equals(other.real) && this.imaginary.equals(other.imaginary)
    );
  }

  greaterThan(other: SchemeComplex): boolean {
    return (
      this.real.greaterThan(other.real) &&
      this.imaginary.greaterThan(other.imaginary)
    );
  }

  multiplicativeInverse(): SchemeComplex {
    // inverse of a + bi = a - bi / a^2 + b^2
    // in this case, we use a / a^2 + b^2 and -b / a^2 + b^2 as the new values required
    const denominator = this.real
      .multiply(this.real)
      .add(this.imaginary.multiply(this.imaginary));
    return SchemeComplex.build(
      denominator.multiplicativeInverse().multiply(this.real),
      denominator.multiplicativeInverse().multiply(this.imaginary.negate()),
    );
  }

  add(other: SchemeComplex): SchemeComplex {
    return SchemeComplex.build(
      this.real.add(other.real),
      this.imaginary.add(other.imaginary),
    );
  }

  multiply(other: SchemeComplex): SchemeComplex {
    // (a + bi) * (c + di) = (ac - bd) + (ad + bc)i
    const realPart = this.real
      .multiply(other.real)
      .add(this.imaginary.multiply(other.imaginary).negate());
    const imaginaryPart = this.real
      .multiply(other.imaginary)
      .add(this.imaginary.multiply(other.real));
    return SchemeComplex.build(realPart, imaginaryPart);
  }

  toString(): string {
    return `${this.real}+${this.imaginary}i`;
  }
}

// these functions deal with checking the type of a number.
export function is_number(a: any): boolean {
  return a.numberType !== undefined;
}

export function is_integer(a: any): boolean {
  return a.numberType === 1;
}

export function is_rational(a: any): boolean {
  return a.numberType === 2;
}

export function is_real(a: any): boolean {
  return a.numberType === 3;
}

export function is_complex(a: any): boolean {
  return a.numberType === 4;
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
