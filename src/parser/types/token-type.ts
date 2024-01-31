// Adapted from https://craftinginterpreters.com/scanning.html
// Adapted for Scheme use

export enum TokenType {
    // + - * / % ^ ! = < > & | ~ etc are recognized as IDENTIFIERS

    // Single-character tokens
    LEFT_PAREN, RIGHT_PAREN, 
    LEFT_BRACKET, RIGHT_BRACKET, 
    APOSTROPHE, BACKTICK, COMMA, HASH, DOT,

    // Two-character tokens
    COMMA_AT,

    // Atoms: Literals or Identifiers
    IDENTIFIER, NUMBER, BOOLEAN, STRING,

    // SICP Chapter 1
    IF, LET, COND, ELSE, DEFINE, LAMBDA,

    // SICP Chapter 2
    QUOTE, UNQUOTE, QUASIQUOTE,
    
    // SICP Chapter 3
    SET, BEGIN, DELAY, 
    
    // Other important keywords
    IMPORT, EXPORT,

    // Not in scope at the moment
    VECTOR, UNQUOTE_SPLICING,

    EOF
}