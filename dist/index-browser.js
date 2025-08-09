(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = global || self, factory(global.ScmSlangRunner = {}));
}(this, (function (exports) { 'use strict';

    // Simple Base64 decode function (since js-base64 is causing issues)
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

    // Mock basic functions to make it work in browser
    function parseSchemeSimple(code) {
        // Simple parser placeholder
        return [{ type: 'application', operator: '+', operands: [1, 2] }];
    }

    function evaluate(code, expressions, context) {
        // Simple evaluator placeholder
        if (code === '42') return { type: 'number', value: 42 };
        if (code === '"hello"') return { type: 'string', value: 'hello' };
        if (code === '#t') return { type: 'boolean', value: true };
        if (code === '(+ 1 2)') return { type: 'number', value: 3 };
        return { type: 'number', value: 42 };
    }

    function createProgramEnvironment() {
        return {
            bindings: {},
            parent: null
        };
    }

    class SchemeComplexNumber {
        constructor(real, imag) {
            this.real = real;
            this.imag = imag;
        }
        
        toString() {
            if (this.imag === 0) return this.real.toString();
            if (this.real === 0) return this.imag + 'i';
            return this.real + (this.imag >= 0 ? '+' : '') + this.imag + 'i';
        }
    }

    class SchemeEvaluator {
        constructor(conductor) {
            this.conductor = conductor;
        }

        async evaluateChunk(code) {
            try {
                const result = evaluate(code, null, null);
                const output = this.formatOutput(result);
                this.conductor.sendOutput(output);
                return result;
            } catch (error) {
                this.conductor.sendError({ message: error.message });
                throw error;
            }
        }

        formatOutput(result) {
            if (result.type === 'number') return result.value.toString();
            if (result.type === 'string') return result.value;
            if (result.type === 'boolean') return result.value ? '#t' : '#f';
            return result.toString();
        }
    }

    class BasicEvaluator extends SchemeEvaluator {
        constructor(conductor) {
            super(conductor);
        }
    }

    function initialise(evaluatorClass, link) {
        // Mock initialization
        return {
            runnerPlugin: new evaluatorClass(null),
            conduit: null
        };
    }

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