/**
 * A data structure grouping together elements of the same level of parentheses.
 * The parentheses are included in the grouping.
 * The final intermediate representation before AST generation.
 */

import { Token } from "../types/token";
import { TokenType } from "../types/token-type";
import { Location, Position } from "../types/location";

export class Group {

  elements: (Token | Group)[];
  location: Location;
  constructor(
    elements: (Token | Group)[],
  ) {
    this.elements = elements;
    if (!this.validateGroupIntegrity()) {

    }
    this.location = new Location(
      this.firstPos(),
      this.lastPos()
    );
  }

  // helper function to check if the parentheses match.
  matchingParentheses(lParen: Token, rParen: Token) {
      return (
        (lParen.type === TokenType.LEFT_PAREN &&
          rParen.type === TokenType.RIGHT_PAREN) ||
        (lParen.type === TokenType.LEFT_BRACKET &&
          rParen.type === TokenType.RIGHT_BRACKET)
      );
    }
  
  // Check for the case of invalid parentheses.
  validateGroupIntegrity(): boolean {
    // if the group is empty, it is not valid.
    if (this.elements.length === 0) {
      throw new Error("Empty group.");
    }

    // get the first and last elements of the group.
    const firstElement = this.first();
    const lastElement = this.last();
    // check if the first element is not a parenthesis.
    // if so, the group is not bounded by parentheses.
    if (!(firstElement instanceof Token)) {
      return true;
    } else if (!(firstElement.type === TokenType.LEFT_PAREN || firstElement.type === TokenType.LEFT_BRACKET)) {
      return true;
    } else {
      // we have confirmed that the first element is a parenthesis.
      // the last element must also be a parenthesis.
      if (!(lastElement instanceof Token)) {
        return false;
      } else {
        // we have confirmed that the last element is a token.
        // the parentheses must match.
        return this.matchingParentheses(firstElement, lastElement);
      }
    }
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
  
  // Get the ending position of the last element of the group.
  lastPos(): Position {
    const lastElement = this.last();
    if (lastElement instanceof Group) {
      return lastElement.lastPos();
    } else {
      return lastElement.endPos;
    }
  }

  /**
   * Check if the current group is parenthesized.
   */
  public isParenthesized(): boolean {
    const firstElement = this.elements[0];
    const lastElement = this.elements[this.elements.length - 1];
    if (!(firstElement instanceof Token && lastElement instanceof Token)) {
      return false;
    }
    return this.matchingParentheses(firstElement, lastElement);
  }

  /**
   * Get the internal elements of the group.
   * If the group is bounded by parentheses, the parentheses are excluded.
   * @returns All elements of the group excluding parentheses.
   */
  public unwrap(): (Token | Group)[] {
    const firstElement = this.first();
    const lastElement = this.last();
    if ((firstElement instanceof Token && lastElement instanceof Token) && 
    ((firstElement.type === TokenType.LEFT_PAREN && lastElement.type === TokenType.RIGHT_PAREN) ||
    (firstElement.type === TokenType.LEFT_BRACKET && lastElement.type === TokenType.RIGHT_BRACKET))) {
      return this.elements.slice(1, this.elements.length - 1);
    } else { 
      
    }
    return this.elements;
  }

  /**
   * Get the number of elements in the group.
   * @returns The number of elements in the group.
   */
  public length(): number {
    return this.elements.length;
  }

  /**
   * Add a token to front of group.
   * @param token The token to be added.
   */
  public admit(token: Token): void {
    this.elements.unshift(token);
    this.location = new Location(
      token.pos, 
      this.location.end);
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