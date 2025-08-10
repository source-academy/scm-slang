import { parseSchemeSimple } from '../CSE-machine/simple-parser';
import { evaluate, Context } from '../CSE-machine/interpreter';
import { createProgramEnvironment } from '../CSE-machine/environment';
import { Stash } from '../CSE-machine/stash';
import { Control } from '../CSE-machine/control';

function testChapter1Features() {
  console.log('🧪 Testing Scheme Chapter 1 Advanced Features');
  console.log('============================================\n');

  const testCases = [
    // Nested expressions
    { code: '(+ (* 2 3) (/ 10 2))', expected: { type: 'number', value: 11 }, description: 'Nested arithmetic expressions' },
    { code: '(> (+ 3 4) (* 2 3))', expected: { type: 'boolean', value: true }, description: 'Nested comparison expressions' },
    
    // Multiple variable definitions
    { code: '(define a 5)', expected: { type: 'void' }, description: 'Define variable a' },
    { code: '(define b 10)', expected: { type: 'void' }, description: 'Define variable b' },
    { code: '(+ a b)', expected: { type: 'number', value: 15 }, description: 'Use multiple variables' },
    
    // Function with multiple parameters
    { code: '(define (multiply x y z) (* x (* y z)))', expected: { type: 'void' }, description: 'Function with 3 parameters' },
    { code: '(multiply 2 3 4)', expected: { type: 'number', value: 24 }, description: 'Call function with 3 parameters' },
    
    // Conditional with complex expressions
    { code: '(if (> (+ 5 3) (* 2 3)) "greater" "less")', expected: { type: 'string', value: 'greater' }, description: 'Complex conditional' },
    { code: '(if (and (> 5 3) (< 2 4)) "both true" "one false")', expected: { type: 'string', value: 'both true' }, description: 'Conditional with boolean operations' },
    
    // List operations with variables
    { code: '(define my-list (cons 1 (cons 2 ())))', expected: { type: 'void' }, description: 'Create list with cons' },
    { code: '(car my-list)', expected: { type: 'number', value: 1 }, description: 'Get first element' },
    { code: '(car (cdr my-list))', expected: { type: 'number', value: 2 }, description: 'Get second element' },
    
    // Type checking with variables
    { code: '(define num 42)', expected: { type: 'void' }, description: 'Define number variable' },
    { code: '(define str "hello")', expected: { type: 'void' }, description: 'Define string variable' },
    { code: '(number? num)', expected: { type: 'boolean', value: true }, description: 'Check if variable is number' },
    { code: '(string? str)', expected: { type: 'boolean', value: true }, description: 'Check if variable is string' },
    { code: '(string? num)', expected: { type: 'boolean', value: false }, description: 'Check if number is string' },
    
    // Complex number operations
    { code: '(define z1 3+4i)', expected: { type: 'void' }, description: 'Define complex number' },
    { code: '(define z2 1+2i)', expected: { type: 'void' }, description: 'Define another complex number' },
    { code: '(+ z1 z2)', expected: { type: 'complex', value: { real: 4, imag: 6 } }, description: 'Add complex numbers' },
    
    // Built-in functions with variables
    { code: '(define x -10)', expected: { type: 'void' }, description: 'Define negative number' },
    { code: '(abs x)', expected: { type: 'number', value: 10 }, description: 'Absolute value of variable' },
    { code: '(define values (list 3 7 1 9 2))', expected: { type: 'void' }, description: 'Define list of values' },
    { code: '(max 3 7 1 9 2)', expected: { type: 'number', value: 9 }, description: 'Maximum of multiple values' },
    { code: '(min 3 7 1 9 2)', expected: { type: 'number', value: 1 }, description: 'Minimum of multiple values' },
    
    // Boolean operations with variables
    { code: '(define flag1 #t)', expected: { type: 'void' }, description: 'Define boolean variable' },
    { code: '(define flag2 #f)', expected: { type: 'void' }, description: 'Define another boolean variable' },
    { code: '(and flag1 flag2)', expected: { type: 'boolean', value: false }, description: 'And with variables' },
    { code: '(or flag1 flag2)', expected: { type: 'boolean', value: true }, description: 'Or with variables' },
    { code: '(not flag2)', expected: { type: 'boolean', value: true }, description: 'Not with variable' },
    
    // Function composition
    { code: '(define (double x) (* x 2))', expected: { type: 'void' }, description: 'Define double function' },
    { code: '(define (add-one x) (+ x 1))', expected: { type: 'void' }, description: 'Define add-one function' },
    { code: '(add-one (double 5))', expected: { type: 'number', value: 11 }, description: 'Function composition' },
    { code: '(double (add-one 3))', expected: { type: 'number', value: 8 }, description: 'Reverse function composition' }
  ];

  let passed = 0;
  let failed = 0;
  let environment = createProgramEnvironment();

  for (const testCase of testCases) {
    try {
      const context: Context = {
        control: new Control(),
        stash: new Stash(),
        environment: environment,
        runtime: { isRunning: true }
      };

      const expressions = parseSchemeSimple(testCase.code);
      const result = evaluate(testCase.code, expressions, context);
      
      // Update environment for next test
      environment = context.environment;
      
      const success = JSON.stringify(result) === JSON.stringify(testCase.expected);
      
      if (success) {
        console.log(`✅ ${testCase.description}: ${testCase.code} -> ${JSON.stringify(result)}`);
        passed++;
      } else {
        console.log(`❌ ${testCase.description}: ${testCase.code} -> ${JSON.stringify(result)} (expected ${JSON.stringify(testCase.expected)})`);
        failed++;
      }
    } catch (error: any) {
      console.log(`❌ ${testCase.description}: ${testCase.code} -> ERROR: ${error.message}`);
      failed++;
    }
  }

  console.log('\n📊 Chapter 1 Advanced Features Test Results:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All Chapter 1 advanced features are working correctly!');
  } else {
    console.log('\n🔧 Some advanced features need fixes');
  }
  
  console.log('\n📋 Advanced Features Tested:');
  console.log('✅ Nested expressions');
  console.log('✅ Multiple variable definitions');
  console.log('✅ Functions with multiple parameters');
  console.log('✅ Complex conditionals');
  console.log('✅ List operations with variables');
  console.log('✅ Type checking with variables');
  console.log('✅ Complex number operations');
  console.log('✅ Built-in functions with variables');
  console.log('✅ Boolean operations with variables');
  console.log('✅ Function composition');
}

testChapter1Features(); 