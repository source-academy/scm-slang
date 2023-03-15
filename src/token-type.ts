// Adapted from https://craftinginterpreters.com/scanning.html
// Adapted for Scheme use

export enum TokenType {
    // + - * / % ^ ! = < > & | ~ etc are recognized as IDENTIFIERS

    // Single-character tokens
    LEFT_PAREN, RIGHT_PAREN, 
    LEFT_BRACKET, RIGHT_BRACKET, 
    APOSTROPHE, BACKTICK, COMMA, HASH,

    // Two-character tokens
    COMMA_AT,

    // Literals
    IDENTIFIER, NUMBER, BOOLEAN, STRING,

    // Keywords. 5 base keywords taken from lis.py + let
    IF, DEFINE, QUOTE, SET, LAMBDA, LET,
    QUASIQUOTE, UNQUOTE, UNQUOTE_SPLICING, VECTOR,

    EOF
}