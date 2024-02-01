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
    this.indentationLevel += 1;
    return this;
  }

  decrement(): Printer {
    this.indentationLevel -= 1;
    return this;
  }

  indent(): void {
    process.stdout.write(" ".repeat(this.indentationLevel * 0));
  }

  display(value: any): void {
    process.stdout.write(value);
  }
    // Atomic AST
    visitSequence(node: Atomic.Sequence): void {
        this.indent();
        const indentedPrinter = this.increment();
        node.expressions.forEach((expression) => {
            this.indent();
            expression.accept(indentedPrinter);
            this.display("\n");
        });
        this.decrement()
        this.indent();
    }

    visitNumericLiteral(node: Atomic.NumericLiteral): void {
    //   this.indent();
        this.display(node.value.toString());
    }
    visitBooleanLiteral(node: Atomic.BooleanLiteral): void {
    //   this.indent();
        this.display(node.value.toString());
    }
    visitStringLiteral(node: Atomic.StringLiteral): void {
    //   this.indent();
        this.display(node.value);
    }
    visitLambda(node: Atomic.Lambda): void {
    //   this.indent();
        this.display("( lambda ");
        this.display("( ");
        node.params.forEach((parameter) => {
            parameter.accept(this.increment());
            this.display(" ");
        });
        this.display(") ");
        node.body.accept(this.increment());
        this.decrement();
        this.indent();
        this.display(") ");
    }
    visitIdentifier(node: Atomic.Identifier): any {
        this.display(node.name);
    }
    visitDefinition(node: Atomic.Definition): any {
        // this.indent();
        this.display("( define ");
        node.name.accept(this.increment());
        this.display(" ");
        node.value.accept(this.increment());
        this.display(") ");
    }

    visitApplication(node: Atomic.Application): any {
        // this.indent();
        this.display("( ");
        node.operator.accept(this.increment());
        node.operands.forEach((operand) => {
            this.display(" ");
            operand.accept(this.increment());
        });
        this.display(") ");
    }
    visitConditional(node: Atomic.Conditional): any {
        // this.indent();
        this.display("( if ");
        node.test.accept(this.increment());
        this.display(" ");
        node.consequent.accept(this.increment());
        this.display(" ");
        node.alternate.accept(this.increment());
        this.display(")");
    }

    visitPair(node: Atomic.Pair): any
    {
        // this.indent();
        this.display("( cons ");
        node.car.accept(this.increment());
        this.display(" ");
        node.cdr.accept(this.increment());
        this.display(")");
    }
    visitNil(node: Atomic.Nil): any
    {
        // this.indent();
        this.display("()");
    }
    visitSymbol(node: Atomic.Symbol): any
    {
        // this.indent();
        this.display(node.value);
    }

    visitReassignment(node: Atomic.Reassignment): any {
        // this.indent();
        this.display("( set! ");
        node.name.accept(this.increment());
        node.value.accept(this.increment());
        this.display(")");
    }

    visitImport(node: Atomic.Import): any {
        throw new Error("Method not implemented.");
    }
    visitExport(node: Atomic.Export): any {
        throw new Error("Method not implemented.");
    }

    // Extended AST
    visitFunctionDefinition(node: Extended.FunctionDefinition): any {
        // this.indent();
        this.display("( define ");
        this.display("( ");
        node.name.accept(this);
        this.display(" ");
        node.params.forEach((parameter) => {
            parameter.accept(this.increment());
            this.display(" ");
        });
        this.display(") ");
        this.display("\n");
        node.body.accept(this.increment());
        this.display(") ");


    }
    visitLet(node: Extended.Let): any {
    throw new Error("Method not implemented.");
    }
    visitCond(node: Extended.Cond): any {
        throw new Error("Method not implemented.");
    }

    visitList(node: Extended.List): any
    {
        // this.indent();
        this.display("( list ");
        node.elements.forEach((value) => {
            this.display(" ");
            value.accept(this.increment());
        });
        this.display(") ");
    }
    visitQuote(node: Extended.Quote): any
    {
        // this.indent();
        this.display("( quote ");
        node.expression.accept(this.increment());
        this.display(") ");
    }
    visitUnquote(node: Extended.Unquote): any
    {
        // this.indent();
        this.display("( unquote ");
        node.expression.accept(this.increment());
        this.display(") ");
    }
    
    visitBegin(node: Extended.Begin): any
    {
        // this.indent();
        this.display("( begin ");
        node.expressions.forEach((expression) => {
            this.display(" ");
            expression.accept(this.increment());
        });
        this.display(") ");
    }

    visitDelay(node: Extended.Delay): any
    {
        // this.indent();
        this.display("( delay ");
        node.expression.accept(this.increment());
        this.display(") ");
    }

    visitForce(node: Extended.Force): any
    {
        // this.indent();
        this.display("( force ");
        node.expression.accept(this.increment());
        this.display(") ");
    }
}