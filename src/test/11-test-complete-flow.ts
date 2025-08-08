import { parseSchemeSimple } from '../CSE-machine/simple-parser';
import { evaluate, Context } from '../CSE-machine/interpreter';
import { createProgramEnvironment } from '../CSE-machine/environment';
import { Stash } from '../CSE-machine/stash';
import { Control } from '../CSE-machine/control';

function testCompleteFlow() {
  console.log('🧪 Testing Complete Evaluation Flow');
  console.log('===================================\n');

  const testCases = [
    { code: '42', expected: { type: 'number', value: 42 }, description: 'Number literal' },
    { code: '"hello"', expected: { type: 'string', value: 'hello' }, description: 'String literal' },
    { code: '#t', expected: { type: 'boolean', value: true }, description: 'Boolean true' },
    { code: '#f', expected: { type: 'boolean', value: false }, description: 'Boolean false' },
    { code: '()', expected: { type: 'nil' }, description: 'Empty list' },
    { code: '(+ 1 2)', expected: { type: 'number', value: 3 }, description: 'Addition' },
    { code: '(* 3 4)', expected: { type: 'number', value: 12 }, description: 'Multiplication' },
    { code: '(> 5 3)', expected: { type: 'boolean', value: true }, description: 'Greater than' },
    { code: '3+4i', expected: { type: 'complex', value: { real: 3, imag: 4 } }, description: 'Complex number' },
    { code: '(+ 3+4i 1+2i)', expected: { type: 'complex', value: { real: 4, imag: 6 } }, description: 'Complex addition' }
  ];

  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    try {
      const context: Context = {
        control: new Control(),
        stash: new Stash(),
        environment: createProgramEnvironment(),
        runtime: { isRunning: true }
      };

      const expressions = parseSchemeSimple(testCase.code);
      const result = evaluate(testCase.code, expressions, context);
      
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

  console.log('\n📊 Complete Flow Test Results:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 Complete evaluation flow is working correctly!');
  } else {
    console.log('\n🔧 Complete evaluation flow needs fixes');
  }
}

testCompleteFlow(); 