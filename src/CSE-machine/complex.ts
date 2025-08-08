// Complex number implementation for Scheme
// Based on py-slang PyComplexNumber

export class SchemeComplexNumber {
  public real: number;
  public imag: number;

  constructor(real: number, imag: number) {
    this.real = real;
    this.imag = imag;
  }

  public static fromNumber(value: number): SchemeComplexNumber {
    return new SchemeComplexNumber(value, 0);
  }

  public static fromString(str: string): SchemeComplexNumber {
    // Handle Scheme complex number syntax: 3+4i, 1-2i, 5i
    if (!/[iI]/.test(str)) {
      const realVal = Number(str);
      if (isNaN(realVal)) {
        throw new Error(`Invalid complex string: ${str}`);
      }
      return new SchemeComplexNumber(realVal, 0);
    }

    const lower = str.toLowerCase();
    if (lower.endsWith('i')) {
      const numericPart = str.substring(0, str.length - 1);
      
      // Handle purely imaginary: i, +i, -i
      if (numericPart === '' || numericPart === '+') {
        return new SchemeComplexNumber(0, 1);
      } else if (numericPart === '-') {
        return new SchemeComplexNumber(0, -1);
      }

      // Check if it's purely imaginary: 5i
      const imagVal = Number(numericPart);
      if (!isNaN(imagVal)) {
        return new SchemeComplexNumber(0, imagVal);
      }

      // Handle complex with both real and imaginary parts: 3+4i, 1-2i
      const match = numericPart.match(/^([\+\-]?\d+(?:\.\d+)?(?:[eE][+\-]?\d+)?)([\+\-]\d+(?:\.\d+)?(?:[eE][+\-]?\d+)?)$/);
      if (match) {
        const realPart = Number(match[1]);
        const imagPart = Number(match[2]);
        return new SchemeComplexNumber(realPart, imagPart);
      }
    }

    throw new Error(`Invalid complex string: ${str}`);
  }

  public static fromValue(value: number | string | SchemeComplexNumber): SchemeComplexNumber {
    if (value instanceof SchemeComplexNumber) {
      return value;
    } else if (typeof value === 'number') {
      return SchemeComplexNumber.fromNumber(value);
    } else if (typeof value === 'string') {
      return SchemeComplexNumber.fromString(value);
    } else {
      throw new Error(`Cannot convert ${typeof value} to complex number`);
    }
  }

  // Arithmetic operations
  public add(other: SchemeComplexNumber): SchemeComplexNumber {
    return new SchemeComplexNumber(
      this.real + other.real,
      this.imag + other.imag
    );
  }

  public sub(other: SchemeComplexNumber): SchemeComplexNumber {
    return new SchemeComplexNumber(
      this.real - other.real,
      this.imag - other.imag
    );
  }

  public mul(other: SchemeComplexNumber): SchemeComplexNumber {
    // (a + bi) * (c + di) = (ac - bd) + (ad + bc)i
    const real = this.real * other.real - this.imag * other.imag;
    const imag = this.real * other.imag + this.imag * other.real;
    return new SchemeComplexNumber(real, imag);
  }

  public div(other: SchemeComplexNumber): SchemeComplexNumber {
    // (a + bi) / (c + di) = ((ac + bd) + (bc - ad)i) / (c² + d²)
    const denominator = other.real * other.real + other.imag * other.imag;
    if (denominator === 0) {
      throw new Error('Division by zero');
    }
    const real = (this.real * other.real + this.imag * other.imag) / denominator;
    const imag = (this.imag * other.real - this.real * other.imag) / denominator;
    return new SchemeComplexNumber(real, imag);
  }

  public negate(): SchemeComplexNumber {
    return new SchemeComplexNumber(-this.real, -this.imag);
  }

  // Comparison (only for equality)
  public equals(other: SchemeComplexNumber): boolean {
    return this.real === other.real && this.imag === other.imag;
  }

  // Magnitude
  public abs(): number {
    return Math.sqrt(this.real * this.real + this.imag * this.imag);
  }

  // String representation
  public toString(): string {
    if (this.imag === 0) {
      return this.real.toString();
    } else if (this.real === 0) {
      if (this.imag === 1) return 'i';
      if (this.imag === -1) return '-i';
      return `${this.imag}i`;
    } else {
      const imagPart = this.imag === 1 ? 'i' : 
                      this.imag === -1 ? '-i' :
                      this.imag > 0 ? `+${this.imag}i` : `${this.imag}i`;
      return `${this.real}${imagPart}`;
    }
  }

  // Convert to JavaScript number (only if purely real)
  public toNumber(): number {
    if (this.imag !== 0) {
      throw new Error('Cannot convert complex number with imaginary part to real number');
    }
    return this.real;
  }
}