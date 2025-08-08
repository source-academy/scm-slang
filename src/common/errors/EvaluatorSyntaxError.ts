// This file is adapted from:
// https://github.com/source-academy/conductor
// Original author(s): Source Academy Team

import { ErrorType } from "./ErrorType";
import { EvaluatorError } from "./EvaluatorError";

/**
 * Evaluator syntax error - the user code does not follow the evaluator's prescribed syntax.
 */
export class EvaluatorSyntaxError extends EvaluatorError {
    override name = "EvaluatorSyntaxError";
    override readonly errorType: ErrorType | string = ErrorType.EVALUATOR_SYNTAX;
}
