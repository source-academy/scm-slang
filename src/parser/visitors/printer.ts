import { Visitor } from "./visitor";
import { Atomic, Extended } from '../types/node-types';

/**
 * Visitor implementation that prints the AST.
 */
export class Printer implements Visitor {
  indentationLevel: number;

  constructor(indentationLevel: number) {
    this.indentationLevel = indentationLevel;
  }

  // Factory method for creating a new Printer instance.
  public static create(): Printer {
    // Since the entire AST is wrapped in a sequence node, we start with an indentation level of 0.
    // Sequences increment the indentation level by 1.
    return new Printer(0);
  }

  increment(): Printer {
    return new Printer(this.indentationLevel + 1);
  }

  display(value: any): void {
    process.stdout.write(" ".repeat(this.indentationLevel * 4) + value);
  }

  write(value: any): void {
    process.stdout.write(value);
  }

    // Atomic AST
    visitSequence(node: Atomic.Sequence): void {
        this.display("(\n");
        const indentedPrinter = this.increment();
        node.expressions.forEach((expression) => {
            expression.accept(indentedPrinter);
            this.display("\n");
        });
        this.display(")\n");
    }

    visitNumericLiteral(node: Atomic.NumericLiteral): void {
        this.display(node.value);
    }
    visitBooleanLiteral(node: Atomic.BooleanLiteral): void {
        this.display(node.value);
    }
    visitStringLiteral(node: Atomic.StringLiteral): void {
        this.display(node.value);
    }
    visitLambda(node: Atomic.Lambda): void {
        this.display("(lambda ");
        node.params.forEach((parameter) => {
            this.write(parameter);
            this.write(" ");
        });
        this.write("\n");
        node.body.accept(this.increment());
        this.display(")");
    }
    visitIdentifier(node: Atomic.Identifier): any {
        this.display(node.name);
    }
    visitDefinition(node: Atomic.Definition): any {
        this.display("(define ");
        this.write(node.name);
        this.write(" ");
        node.value.accept(this.increment());
        this.display(")");
    }

    visitApplication(node: Atomic.Application): any;
    visitConditional(node: Atomic.Conditional): any;

    visitPair(node: Atomic.Pair): any;
    visitNil(node: Atomic.Nil): any;
    visitSymbol(node: Atomic.Symbol): any;

    visitReassignment(node: Atomic.Reassignment): any;

    visitImport(node: Atomic.Import): any;
    visitExport(node: Atomic.Export): any;

    // Extended AST
    visitFunctionDefinition(node: Extended.FunctionDefinition): any;
    visitLet(node: Extended.Let): any;
    visitCond(node: Extended.Cond): any;

    visitList(node: Extended.List): any;
    visitQuote(node: Extended.Quote): any;
    visitUnquote(node: Extended.Unquote): any;
    
    visitBegin(node: Extended.Begin): any;
    visitDelay(node: Extended.Delay): any;
    visitForce(node: Extended.Force): any;
}