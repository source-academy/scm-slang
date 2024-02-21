/**
 * A data structure grouping together elements of the same level of parentheses.
 * The parentheses are included in the grouping.
 * An intermediate representation before AST generation.
 */

import { Token } from "../types/token";
import { TokenType } from "../types/token-type";
import { Location, Position } from "../types/location";

export class Group {
  // Invariants:
  // - A group must not be empty.
  // - If a group is not parenthesized, it contains either one element, that is not a group,
  //   or two elements, of which the first one is not a group but the second one is.
  // - If a group is parenthesized, it must have matching parentheses.

  readonly elements: (Token | Group)[];
  readonly location: Location;
  private constructor(elements: (Token | Group)[]) {
    this.elements = elements;
    this.location = new Location(this.firstPos(), this.lastPos());
  }

  /**
   * A constructor function for a group that enforces group invariants.
   */
  public static build(elements: (Token | Group)[]) {
    // helper function to check if the parentheses match.
    function matchingParentheses(lParen: Token, rParen: Token) {
      return (
        (lParen.type === TokenType.LEFT_PAREN &&
          rParen.type === TokenType.RIGHT_PAREN) ||
        (lParen.type === TokenType.LEFT_BRACKET &&
          rParen.type === TokenType.RIGHT_BRACKET)
      );
    }

    // helper function to check if the token is a data type.
    function isDataType(token: Token) {
      return (
        token.type === TokenType.IDENTIFIER ||
        token.type === TokenType.NUMBER ||
        token.type === TokenType.STRING ||
        token.type === TokenType.BOOLEAN
      );
    }

    // helper function to determine if the token is an affector type.
    // (and the affector type should be the short version).
    function isShortAffector(token: Token) {
      return (
        token.type === TokenType.APOSTROPHE ||
        token.type === TokenType.BACKTICK ||
        token.type === TokenType.HASH ||
        token.type === TokenType.COMMA ||
        token.type === TokenType.COMMA_AT
      );
    }

    // Illegal empty group.
    if (elements.length === 0) {
      // This should never happen.
      // If it does its the implementor's fault.
      throw new Error("Empty group.");
    }

    // If the group is not parenthesized, the first case contains only one element.
    if (elements.length === 1) {
      const onlyElement: Group | Token = elements[0];

      if (onlyElement instanceof Group) {
        // Return the inner group.
        // Avoid nested groups that are a product of the grouping generation in the parser.
        // Ensures the single internal element is not a group.
        return onlyElement;
      }

      // Ensure the single element is a data type by validating its token type.
      if (!isDataType(onlyElement)) {
        // This should never happen.
        // If it does its the implementor's fault.
        throw new Error("Invalid group.");
      }

      return new Group(elements);
    }

    // If the group is not parenthesized, the remaining case contains two elements.
    if (elements.length === 2) {
      const firstElement = elements[0];

      // Ensure the first element is an affector type.
      if (firstElement instanceof Token && isShortAffector(firstElement)) {
        // Ensure the first element is an affector type.
        return new Group(elements);
      }

      // If all else fails, use the most generic case. below.
    }

    // If the group is parenthesized, the parentheses must match.
    const firstElement = elements[0];
    const lastElement = elements[elements.length - 1];
    if (
      firstElement instanceof Token &&
      lastElement instanceof Token &&
      matchingParentheses(firstElement, lastElement)
    ) {
      return new Group(elements);
    }

    throw new Error("Invalid group.");
  }

  // Get the first element of the group.
  first(): Token | Group {
    return this.elements[0];
  }

  // Get the first token of the group.
  public firstToken(): Token {
    const firstElement = this.first();
    if (firstElement instanceof Token) {
      return firstElement;
    } else {
      return firstElement.firstToken();
    }
  }

  // Get the starting position of the first element of the group.
  firstPos(): Position {
    return this.firstToken().pos;
  }

  // Get the last element of the group.
  last(): Token | Group {
    return this.elements[this.elements.length - 1];
  }

  lastToken(): Token {
    const lastElement = this.last();
    if (lastElement instanceof Token) {
      return lastElement;
    } else {
      return lastElement.lastToken();
    }
  }

  // Get the ending position of the last element of the group.
  lastPos(): Position {
    return this.lastToken().pos;
  }

  /**
   * Check if the current group is parenthesized.
   */
  public isParenthesized(): boolean {
    const firstElement = this.first();
    const lastElement = this.last();

    // Because of the validation performed by the factory function,
    // we can assume that as long as the first element is a paranthesis,
    // the last element is also the corresponding paranthesis.

    return (
      firstElement instanceof Token &&
      (firstElement.type === TokenType.LEFT_PAREN ||
        firstElement.type === TokenType.LEFT_BRACKET)
    );
  }

  /**
   * Get the internal elements of the group.
   * If the group is bounded by parentheses, the parentheses are excluded.
   * @returns All elements of the group excluding parentheses.
   */
  public unwrap(): (Token | Group)[] {
    const firstElement = this.first();
    const lastElement = this.last();
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
  public length(): number {
    return this.unwrap().length;
  }

  /**
   * To aid in debugging.
   * Groups are separated by pipes.
   * @returns A string representation of the group
   */
  toString(): string {
    return " |> " + this.elements.map((e) => e.toString()).join(" ") + " <| ";
  }
}
