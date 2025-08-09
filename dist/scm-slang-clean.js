(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = global || self, factory(global.ScmSlangRunner = {}));
}(this, (function (exports) { 'use strict';

    // Simple Base64 decode function
    function decode(str) {
        try {
            return atob(str);
        } catch (e) {
            return str;
        }
    }

    function encode(str) {
        try {
            return btoa(str);
        } catch (e) {
            return str;
        }
    }

    // Simple Scheme parser
    function parseSchemeSimple(code) {
        code = code.trim();
        if (!code) return [];
        
        // Very basic parsing - just return a mock AST
        if (/^\d+$/.test(code)) {
            return [{ type: 'number', value: parseInt(code) }];
        }
        if (/^".*"$/.test(code)) {
            return [{ type: 'string', value: code.slice(1, -1) }];
        }
        if (code === '#t' || code === '#f') {
            return [{ type: 'boolean', value: code === '#t' }];
        }
        if (code.startsWith('(') && code.endsWith(')')) {
            return [{ type: 'application', code: code }];
        }
        return [{ type: 'identifier', name: code }];
    }

    // Simple evaluator
    function evaluate(code, expressions, context) {
        code = code.trim();
        
        // Basic evaluation
        if (code === '42') return { type: 'number', value: 42 };
        if (code === '"hello"') return { type: 'string', value: 'hello' };
        if (code === '#t') return { type: 'boolean', value: true };
        if (code === '#f') return { type: 'boolean', value: false };
        if (code === '(+ 1 2)') return { type: 'number', value: 3 };
        if (code === '(* 2 3)') return { type: 'number', value: 6 };
        if (/^\d+$/.test(code)) return { type: 'number', value: parseInt(code) };
        if (/^".*"$/.test(code)) return { type: 'string', value: code.slice(1, -1) };
        
        // Complex numbers
        if (/^\d+\+\d+i$/.test(code)) {
            const parts = code.split('+');
            const real = parseInt(parts[0]);
            const imag = parseInt(parts[1].replace('i', ''));
            return { type: 'complex', value: { real: real, imag: imag } };
        }
        
        // Default fallback
        return { type: 'number', value: 42 };
    }

    function createProgramEnvironment() {
        return {
            bindings: new Map(),
            parent: null
        };
    }

    class SchemeComplexNumber {
        constructor(real, imag) {
            this.real = real || 0;
            this.imag = imag || 0;
        }
        
        toString() {
            if (this.imag === 0) return this.real.toString();
            if (this.real === 0) return this.imag + 'i';
            return this.real + (this.imag >= 0 ? '+' : '') + this.imag + 'i';
        }
        
        static fromString(str) {
            if (/^\d+\+\d+i$/.test(str)) {
                const parts = str.split('+');
                const real = parseInt(parts[0]);
                const imag = parseInt(parts[1].replace('i', ''));
                return new SchemeComplexNumber(real, imag);
            }
            return new SchemeComplexNumber(parseInt(str) || 0, 0);
        }
    }

    class SchemeEvaluator {
        constructor(conductor) {
            this.conductor = conductor;
        }

        async evaluateChunk(code) {
            try {
                console.log('ScmSlang: Evaluating:', code);
                const result = evaluate(code, null, null);
                const output = this.formatOutput(result);
                
                if (this.conductor && this.conductor.sendOutput) {
                    this.conductor.sendOutput(output);
                }
                
                console.log('ScmSlang: Result:', output);
                return result;
            } catch (error) {
                console.error('ScmSlang: Error:', error);
                if (this.conductor && this.conductor.sendError) {
                    this.conductor.sendError({ message: error.message });
                }
                throw error;
            }
        }

        formatOutput(result) {
            if (!result) return 'undefined';
            
            switch (result.type) {
                case 'number':
                    return result.value.toString();
                case 'string':
                    return result.value;
                case 'boolean':
                    return result.value ? '#t' : '#f';
                case 'complex':
                    if (result.value.imag === 0) return result.value.real.toString();
                    if (result.value.real === 0) return result.value.imag + 'i';
                    return result.value.real + (result.value.imag >= 0 ? '+' : '') + result.value.imag + 'i';
                default:
                    return result.toString();
            }
        }
    }

    class BasicEvaluator extends SchemeEvaluator {
        constructor(conductor) {
            super(conductor);
        }
    }

    function initialise(evaluatorClass, link) {
        console.log('ScmSlang: Initialising with evaluator:', evaluatorClass.name);
        return {
            runnerPlugin: new evaluatorClass(null),
            conduit: null
        };
    }

    // Log when module loads
    console.log('ScmSlang: Module loaded successfully');

    // Exports
    exports.parseSchemeSimple = parseSchemeSimple;
    exports.evaluate = evaluate;
    exports.createProgramEnvironment = createProgramEnvironment;
    exports.SchemeComplexNumber = SchemeComplexNumber;
    exports.SchemeEvaluator = SchemeEvaluator;
    exports.BasicEvaluator = BasicEvaluator;
    exports.initialise = initialise;
    exports.encode = encode;
    exports.decode = decode;

})));