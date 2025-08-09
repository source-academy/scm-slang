(function (factory) {
    typeof define === 'function' && define.amd ? define(factory) :
    factory();
})((function () { 'use strict';

    Object.defineProperty(exports, "__esModule", { value: true });
    exports.schemeParse = exports.ParserError = exports.LexerError = exports.unparse = exports.initialise = exports.BasicEvaluator = exports.SchemeEvaluator = exports.SchemeComplexNumber = exports.createProgramEnvironment = exports.evaluate = exports.parseSchemeSimple = void 0;
    exports.encode = encode;
    exports.decode = decode;
    const tslib_1 = require("tslib");
    const js_base64_1 = require("js-base64");
    // Export CSE Machine functionality
    var simple_parser_1 = require("./CSE-machine/simple-parser");
    Object.defineProperty(exports, "parseSchemeSimple", { enumerable: true, get: function () { return simple_parser_1.parseSchemeSimple; } });
    var interpreter_1 = require("./CSE-machine/interpreter");
    Object.defineProperty(exports, "evaluate", { enumerable: true, get: function () { return interpreter_1.evaluate; } });
    var environment_1 = require("./CSE-machine/environment");
    Object.defineProperty(exports, "createProgramEnvironment", { enumerable: true, get: function () { return environment_1.createProgramEnvironment; } });
    var complex_1 = require("./CSE-machine/complex");
    Object.defineProperty(exports, "SchemeComplexNumber", { enumerable: true, get: function () { return complex_1.SchemeComplexNumber; } });
    // Export Conductor integration
    var SchemeEvaluator_1 = require("./conductor/runner/SchemeEvaluator");
    Object.defineProperty(exports, "SchemeEvaluator", { enumerable: true, get: function () { return SchemeEvaluator_1.SchemeEvaluator; } });
    var BasicEvaluator_1 = require("./conductor/runner/BasicEvaluator");
    Object.defineProperty(exports, "BasicEvaluator", { enumerable: true, get: function () { return BasicEvaluator_1.BasicEvaluator; } });
    var initialise_1 = require("./conductor/runner/util/initialise");
    Object.defineProperty(exports, "initialise", { enumerable: true, get: function () { return initialise_1.initialise; } });
    // Export types
    tslib_1.__exportStar(require("./conductor/runner/types"), exports);
    tslib_1.__exportStar(require("./conductor/types"), exports);
    tslib_1.__exportStar(require("./conduit/types"), exports);
    tslib_1.__exportStar(require("./common/errors"), exports);
    // Export transpiler functionality (for compatibility)
    tslib_1.__exportStar(require("./utils/encoder-visitor"), exports);
    var reverse_parser_1 = require("./utils/reverse_parser");
    Object.defineProperty(exports, "unparse", { enumerable: true, get: function () { return reverse_parser_1.unparse; } });
    var transpiler_1 = require("./transpiler");
    Object.defineProperty(exports, "LexerError", { enumerable: true, get: function () { return transpiler_1.LexerError; } });
    var transpiler_2 = require("./transpiler");
    Object.defineProperty(exports, "ParserError", { enumerable: true, get: function () { return transpiler_2.ParserError; } });
    var transpiler_3 = require("./transpiler");
    Object.defineProperty(exports, "schemeParse", { enumerable: true, get: function () { return transpiler_3.schemeParse; } });
    const JS_KEYWORDS = [
        "break",
        "case",
        "catch",
        "class",
        "const",
        "continue",
        "debugger",
        "default",
        "delete",
        "do",
        "else",
        "eval",
        "export",
        "extends",
        "false",
        "finally",
        "for",
        "function",
        "if",
        "import",
        "in",
        "instanceof",
        "new",
        "return",
        "super",
        "switch",
        "this",
        "throw",
        "true",
        "try",
        "typeof",
        "var",
        "void",
        "while",
        "with",
        "yield",
        "enum",
        "await",
        "implements",
        "package",
        "protected",
        "static",
        "interface",
        "private",
        "public",
    ];
    /**
     * Takes a Scheme identifier and encodes it to follow JS naming conventions.
     *
     * @param identifier An identifier name.
     * @returns An encoded identifier that follows JS naming conventions.
     */
    function encode(identifier) {
        if (JS_KEYWORDS.includes(identifier) || identifier.startsWith("$scheme_")) {
            return ("$scheme_" +
                (0, js_base64_1.encode)(identifier).replace(/([^a-zA-Z0-9_])/g, (match) => `\$${match.charCodeAt(0)}\$`));
        }
        else {
            return identifier.replace(/([^a-zA-Z0-9_])/g, (match) => `\$${match.charCodeAt(0)}\$`);
        }
    }
    /**
     * Takes a JS identifier and decodes it to follow Scheme naming conventions.
     *
     * @param identifier An encoded identifier name.
     * @returns A decoded identifier that follows Scheme naming conventions.
     */
    function decode(identifier) {
        if (identifier.startsWith("$scheme_")) {
            return (0, js_base64_1.decode)(identifier
                .slice(8)
                .replace(/\$([0-9]+)\$/g, (_, code) => String.fromCharCode(parseInt(code))));
        }
        else {
            return identifier.replace(/\$([0-9]+)\$/g, (_, code) => String.fromCharCode(parseInt(code)));
        }
    }
    // Initialize conductor (following py-slang pattern)
    // Note: This will be executed when the module is loaded
    // const {runnerPlugin, conduit} = initialise(SchemeEvaluator);

}));
//# sourceMappingURL=index.js.map
