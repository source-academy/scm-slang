// adapted from https://craftinginterpreters.com/scanning.html
// adapted for scheme use
export enum TokenType {
    // + - * / % ^ ! = < > & | ~ etc are recognized as IDENTIFIERS

    // Single-character tokens
    LEFT_PAREN, RIGHT_PAREN, APOSTROPHE,
    BACKTICK, COMMA, HASH,

    // Literals
    IDENTIFIER, NUMBER, BOOLEAN, STRING,

    // Keywords. 5 base keywords taken from lis.py
    IF, DEFINE, QUOTE, SET, LAMBDA,

    EOF
}