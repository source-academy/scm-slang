import { parseSchemeSimple } from '../CSE-machine/simple-parser';
import { evaluate, Context } from '../CSE-machine/interpreter';
import { createProgramEnvironment } from '../CSE-machine/environment';
import { Stash } from '../CSE-machine/stash';
import { Control } from '../CSE-machine/control';

function testErrorHandling() {
  console.log('🧪 Testing Scheme Chapter 1 Error Handling');
  console.log('==========================================\n');

  const testCases = [
    // Syntax errors
    { code: '(define x)', expected: 'Error', description: 'Define with missing value' },
    { code: '(define 10 x)', expected: 'Error', description: 'Define with non-identifier name' },
    { code: '(if (> 5 3))', expected: 'Error', description: 'If with missing else clause' },
    { code: '(lambda x y)', expected: 'Error', description: 'Lambda with invalid parameters' },
    
    // Runtime errors
    { code: 'undefined-var', expected: 'Error', description: 'Undefined variable' },
    { code: '(+ 1 "hello")', expected: 'Error', description: 'Type mismatch in arithmetic' },
    { code: '(car 42)', expected: 'Error', description: 'Car on non-pair' },
    { code: '(cdr 42)', expected: 'Error', description: 'Cdr on non-pair' },
    { code: '(cons 1 2 3)', expected: 'Error', description: 'Cons with too many arguments' },
    { code: '(car)', expected: 'Error', description: 'Car with no arguments' },
    { code: '(cdr)', expected: 'Error', description: 'Cdr with no arguments' },
    
    // Division by zero
    { code: '(/ 10 0)', expected: 'Error', description: 'Division by zero' },
    
    // Function call errors
    { code: '(not-a-function 1 2 3)', expected: 'Error', description: 'Call undefined function' },
    { code: '(+ 1 2 3 4 5)', expected: { type: 'number', value: 15 }, description: 'Add with many arguments (should work)' },
    { code: '(max)', expected: 'Error', description: 'Max with no arguments' },
    { code: '(min)', expected: 'Error', description: 'Min with no arguments' },
    
    // Type predicate errors
    { code: '(number? 1 2)', expected: 'Error', description: 'Number? with too many arguments' },
    { code: '(string? 1 2)', expected: 'Error', description: 'String? with too many arguments' },
    { code: '(boolean? 1 2)', expected: 'Error', description: 'Boolean? with too many arguments' },
    
    // Boolean operation errors
    { code: '(and)', expected: { type: 'boolean', value: true }, description: 'And with no arguments (should return true)' },
    { code: '(or)', expected: { type: 'boolean', value: false }, description: 'Or with no arguments (should return false)' },
    { code: '(not 1 2)', expected: 'Error', description: 'Not with too many arguments' },
    
    // Complex number errors
    { code: '(+ 3+4i "hello")', expected: 'Error', description: 'Complex addition with string' },
    { code: '(+ 3+4i #t)', expected: 'Error', description: 'Complex addition with boolean' },
    
    // List operation errors
    { code: '(list 1 2 3 4 5)', expected: { type: 'list', elements: [{ type: 'number', value: 1 }, { type: 'number', value: 2 }, { type: 'number', value: 3 }, { type: 'number', value: 4 }, { type: 'number', value: 5 }] }, description: 'List with many arguments (should work)' },
    { code: '(null? 1 2)', expected: 'Error', description: 'Null? with too many arguments' },
    { code: '(pair? 1 2)', expected: 'Error', description: 'Pair? with too many arguments' }
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
      
      if (testCase.expected === 'Error') {
        console.log(`❌ ${testCase.description}: ${testCase.code} -> Should have thrown error but got ${JSON.stringify(result)}`);
        failed++;
      } else {
        const success = JSON.stringify(result) === JSON.stringify(testCase.expected);
        if (success) {
          console.log(`✅ ${testCase.description}: ${testCase.code} -> ${JSON.stringify(result)}`);
          passed++;
        } else {
          console.log(`❌ ${testCase.description}: ${testCase.code} -> ${JSON.stringify(result)} (expected ${JSON.stringify(testCase.expected)})`);
          failed++;
        }
      }
    } catch (error: any) {
      if (testCase.expected === 'Error') {
        console.log(`✅ ${testCase.description}: ${testCase.code} -> ERROR: ${error.message}`);
        passed++;
      } else {
        console.log(`❌ ${testCase.description}: ${testCase.code} -> Unexpected ERROR: ${error.message}`);
        failed++;
      }
    }
  }

  console.log('\n📊 Error Handling Test Results:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All error handling is working correctly!');
  } else {
    console.log('\n🔧 Some error handling needs fixes');
  }
  
  console.log('\n📋 Error Handling Tested:');
  console.log('✅ Syntax errors (malformed expressions)');
  console.log('✅ Runtime errors (undefined variables)');
  console.log('✅ Type errors (wrong argument types)');
  console.log('✅ Division by zero');
  console.log('✅ Function call errors');
  console.log('✅ Argument count errors');
  console.log('✅ List operation errors');
  console.log('✅ Complex number errors');
}

testErrorHandling(); 