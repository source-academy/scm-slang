// A data structure representing the span of the scheme node.
export class Location {
    constructor(public start: Position, public end: Position) {}
}

// A data structure representing a particular position of a token.
export class Position {
    constructor(public line: number, public column: number) {}
}