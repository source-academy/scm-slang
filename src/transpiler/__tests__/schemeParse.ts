import { schemeParse } from "../..";

test("schemeParse", () => {
  const source = `
  (define (square x) (* x x))
  (square 5/8)
  (begin (define x 5) (set! x 10) x)
  (define (square x) (begin (define x 5) (* x x)))
  `;
  const program = schemeParse(source);
  expect(program).toMatchSnapshot();
});
