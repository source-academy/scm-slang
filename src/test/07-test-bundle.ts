// Test script to verify bundle exports work correctly
import { parseSchemeSimple, evaluate, createProgramEnvironment, SchemeEvaluator, initialise } from '../index';

console.log('🧪 Testing Bundle Exports');
console.log('=========================\n');

// Test basic exports
console.log('1. Testing parseSchemeSimple export:');
try {
  const result = parseSchemeSimple('(+ 1 2)');
  console.log('✅ parseSchemeSimple works:', result.length > 0);
} catch (error: any) {
  console.log('❌ parseSchemeSimple failed:', error.message);
}

console.log('\n2. Testing evaluate export:');
try {
  const expressions = parseSchemeSimple('42');
  const context = {
    control: new (require('../CSE-machine/control').Control)(),
    stash: new (require('../CSE-machine/stash').Stash)(),
    environment: createProgramEnvironment(),
    runtime: { isRunning: true }
  };
  const result = evaluate('42', expressions, context);
  console.log('✅ evaluate works:', result.type === 'number' && result.value === 42);
} catch (error: any) {
  console.log('❌ evaluate failed:', error.message);
}

console.log('\n3. Testing SchemeEvaluator export:');
try {
  const mockConductor = {
    sendOutput: (output: string) => console.log('Mock output:', output),
    sendError: (error: any) => console.log('Mock error:', error.message),
    requestFile: async () => undefined,
    requestChunk: async () => { throw new Error('Mock chunk request'); }
  };
  const evaluator = new SchemeEvaluator(mockConductor as any);
  console.log('✅ SchemeEvaluator constructor works');
} catch (error: any) {
  console.log('❌ SchemeEvaluator failed:', error.message);
}

console.log('\n4. Testing initialise export:');
try {
  const {runnerPlugin, conduit} = initialise(SchemeEvaluator);
  console.log('✅ initialise works:', !!runnerPlugin && !!conduit);
} catch (error: any) {
  console.log('❌ initialise failed:', error.message);
}

console.log('\n🎉 Bundle export tests completed!');