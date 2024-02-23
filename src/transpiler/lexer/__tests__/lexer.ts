import { SchemeLexer } from "..";
import { TokenType } from "../../types/tokens";
import { UnexpectedCharacterError, UnexpectedEOFError } from "../lexer-error";

test("Lexer parses simple identifiers correctly", () => {
  const source = "helloworld";
  const lexer = new SchemeLexer(source);
  const tokens = lexer.scanTokens();
  // tokens should be 2: helloworld, EOF
  expect(tokens.length).toBe(2);
  expect(tokens[0].type).toBe(TokenType.IDENTIFIER);
  expect(tokens[0].lexeme).toBe("helloworld");
});

test("Lexer parses identifiers with special characters correctly", () => {
  const source = "hello-$+!%#world";
  const lexer = new SchemeLexer(source);
  const tokens = lexer.scanTokens();
  // tokens should be 2: hello-world, EOF
  expect(tokens.length).toBe(2);
  expect(tokens[0].type).toBe(TokenType.IDENTIFIER);
  expect(tokens[0].lexeme).toBe("hello-$+!%#world");
});

test("Lexer parses extended identifiers correctly", () => {
  const source = "|你好世界 this is one identifier!|";
  const lexer = new SchemeLexer(source);
  const tokens = lexer.scanTokens();
  // tokens should be 2: hello-world, EOF
  expect(tokens.length).toBe(2);
  expect(tokens[0].type).toBe(TokenType.IDENTIFIER);
  expect(tokens[0].lexeme).toBe("你好世界 this is one identifier!");
});

test("Lexer parses integer numbers correctly", () => {
  const source = "123";
  const lexer = new SchemeLexer(source);
  const tokens = lexer.scanTokens();
  // tokens should be 2: 123, EOF
  expect(tokens.length).toBe(2);
  expect(tokens[0].type).toBe(TokenType.NUMBER);
  expect(tokens[0].lexeme).toBe("123");
  expect(tokens[0].literal).toBe(123);
});

test("Lexer parses floating point numbers correctly", () => {
  const source = ".45";
  const lexer = new SchemeLexer(source);
  const tokens = lexer.scanTokens();
  // tokens should be 2: .45, EOF
  expect(tokens.length).toBe(2);
  expect(tokens[0].type).toBe(TokenType.NUMBER);
  expect(tokens[0].lexeme).toBe(".45");
  expect(tokens[0].literal).toBe(0.45);
});

test("Lexer parses negative numbers correctly", () => {
  const source = "-123";
  const lexer = new SchemeLexer(source);
  const tokens = lexer.scanTokens();
  // tokens should be 2: -123, EOF
  expect(tokens.length).toBe(2);
  expect(tokens[0].type).toBe(TokenType.NUMBER);
  expect(tokens[0].lexeme).toBe("-123");
  expect(tokens[0].literal).toBe(-123);
});

test("Lexer treats poorly formatted numbers as identifiers", () => {
  const source = "123.45.67";
  const lexer = new SchemeLexer(source);
  const tokens = lexer.scanTokens();
  // tokens should be 2: 123.45.67, EOF
  expect(tokens.length).toBe(2);
  expect(tokens[0].type).toBe(TokenType.IDENTIFIER);
  expect(tokens[0].lexeme).toBe("123.45.67");
});

test("Lexer parses strings correctly", () => {
  const source = `"hello world"`;
  const lexer = new SchemeLexer(source);
  const tokens = lexer.scanTokens();
  // tokens should be 2: "hello world", EOF
  expect(tokens.length).toBe(2);
  expect(tokens[0].type).toBe(TokenType.STRING);
  expect(tokens[0].lexeme).toBe('"hello world"');
});

test("Lexer parses booleans correctly", () => {
  const source = `#t #f`;
  const lexer = new SchemeLexer(source);
  const tokens = lexer.scanTokens();
  // tokens should be 3: #t, #f, EOF
  expect(tokens.length).toBe(3);
  expect(tokens[0].type).toBe(TokenType.BOOLEAN);
  expect(tokens[0].lexeme).toBe("#t");
  expect(tokens[0].literal).toBe(true);
  expect(tokens[1].type).toBe(TokenType.BOOLEAN);
  expect(tokens[1].lexeme).toBe("#f");
  expect(tokens[1].literal).toBe(false);
});

test("Lexer can detect keywords", () => {
  const source = `if else lambda define`;
  const lexer = new SchemeLexer(source);
  const tokens = lexer.scanTokens();
  // tokens should be 5: if, else, lambda, define, EOF
  expect(tokens.length).toBe(5);
  expect(tokens[0].type).toBe(TokenType.IF);
  expect(tokens[1].type).toBe(TokenType.ELSE);
  expect(tokens[2].type).toBe(TokenType.LAMBDA);
  expect(tokens[3].type).toBe(TokenType.DEFINE);
});

test("Lexer can ignore comments", () => {
  const source = `; this is a comment
  123`;
  const lexer = new SchemeLexer(source);
  const tokens = lexer.scanTokens();
  // tokens should be 2: 123, EOF
  expect(tokens.length).toBe(2);
  expect(tokens[0].type).toBe(TokenType.NUMBER);
  expect(tokens[0].literal).toBe(123);
});

test("Lexer can ignore comments at the end of a line", () => {
  const source = `123 ; this is a comment`;
  const lexer = new SchemeLexer(source);
  const tokens = lexer.scanTokens();
  // tokens should be 2: 123, EOF
  expect(tokens.length).toBe(2);
  expect(tokens[0].type).toBe(TokenType.NUMBER);
  expect(tokens[0].literal).toBe(123);
});

test("Lexer can ignore multiline comments", () => {
  const source = `#| this is a comment
   this is another comment |# 456
  123`;
  const lexer = new SchemeLexer(source);
  const tokens = lexer.scanTokens();
  // tokens should be 2: 456, 123, EOF
  expect(tokens.length).toBe(3);
  expect(tokens[0].type).toBe(TokenType.NUMBER);
  expect(tokens[0].literal).toBe(456);
  expect(tokens[1].type).toBe(TokenType.NUMBER);
  expect(tokens[1].literal).toBe(123);
});

test("Lexer can properly detect all the double character tokens", () => {
  const source = `#t #f #;`;
  const lexer = new SchemeLexer(source);
  const tokens = lexer.scanTokens();
  // tokens should be 4: #t, #f, #;, EOF
  expect(tokens.length).toBe(4);
  expect(tokens[0].type).toBe(TokenType.BOOLEAN);
  expect(tokens[1].type).toBe(TokenType.BOOLEAN);
  expect(tokens[2].type).toBe(TokenType.HASH_SEMICOLON);
});

test("Lexer can promote a hash to a hash vector in the right context", () => {
  const source = `#(1 2 3)`;
  const lexer = new SchemeLexer(source);
  const tokens = lexer.scanTokens();
  // tokens should be 4: #-vector, (, 1, 2, 3, ), EOF
  expect(tokens.length).toBe(7);
  expect(tokens[0].type).toBe(TokenType.HASH_VECTOR);
  expect(tokens[1].type).toBe(TokenType.LEFT_PAREN);
  expect(tokens[2].type).toBe(TokenType.NUMBER);
  expect(tokens[3].type).toBe(TokenType.NUMBER);
  expect(tokens[4].type).toBe(TokenType.NUMBER);
  expect(tokens[5].type).toBe(TokenType.RIGHT_PAREN);
});

test("Lexer does not recognise hash as a vector if it is not followed immediately by a ( or [", () => {
  const source = `# (`;
  const lexer = new SchemeLexer(source);
  expect(() => lexer.scanTokens()).toThrow(UnexpectedCharacterError);
});

test("Lexer throws EOF error when it encounters undelimited strings", () => {
  const source = `"hello world`;
  const lexer = new SchemeLexer(source);
  expect(() => lexer.scanTokens()).toThrow(UnexpectedEOFError);
});

test("Lexer throws EOF error when it encounters undelimited comments", () => {
  const source = `#| hello world
  
  
  
  still not done`;
  const lexer = new SchemeLexer(source);
  expect(() => lexer.scanTokens()).toThrow(UnexpectedEOFError);
});

test("Lexer throws EOF error if it encounters undelimited loose identifiers", () => {
  const source = `| hello world`;
  const lexer = new SchemeLexer(source);
  expect(() => lexer.scanTokens()).toThrow(UnexpectedEOFError);
});
