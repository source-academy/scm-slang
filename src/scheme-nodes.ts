// Basic scheme node types to generate a scheme AST.
import { Visitor } from "./scheme-visitor";

// For us this set of nodes is sufficient

export namespace SchemeNode {
    interface BasicSchemeNode {
        accept(visitor: Visitor): any;
    }

    // The root node of the AST. 
    // Analogous to Program node in estree.
    export class RootNode implements BasicSchemeNode {
        body: StatementNode[];
        constructor(body: StatementNode[]) {
            this.body = body;
        }
        accept(visitor: Visitor): any {
            return visitor.visitRoot(this);
        }
    }

    /**
     * STATEMENTS
     * Statements represent executable objects.
     */

    // A node representing a statement.
    // Analogous to Statement in estree.
    export interface StatementNode extends BasicSchemeNode {}

    // A node representing a block of statements.
    // Used in the body of a procedure, for example.
    // Analogous to BlockStatement in estree.
    export class BlockNode implements StatementNode {
        body: StatementNode[];
        constructor(body: StatementNode[]) {
            this.body = body;
        }
        accept(visitor: Visitor): any {
            return visitor.visitBlock(this);
        }
    }

    // A node representing an expression statement.
    // Analogous to ExpressionStatement in estree.
    export class ExpressionStatementNode implements StatementNode {
        expression: ExpressionNode;
        constructor(expression: ExpressionNode) {
            this.expression = expression;
        }
        accept(visitor: Visitor): any {
            return visitor.visitExpressionStatement(this);
        }
    }

    // A node representing a definition.
    // Analogous to VariableDeclaration in estree.
    export class DefinitionNode implements StatementNode {
        name: SymbolNode;
        value: ExpressionNode;
        constructor(name: SymbolNode, value: ExpressionNode) {
            this.name = name;
            this.value = value;
        }
        accept(visitor: Visitor): any {
            return visitor.visitDefinition(this);
        }
    }

    // A node representing an if statement.
    // Slightly special case: if implicitly returns
    // the value of the consequent or alternate.
    // Hence this is an expression.
    // Almost analogous to IfStatement in estree.
    export class IfNode implements StatementNode {
        test: ExpressionNode;
        consequent: StatementNode;
        alternate: StatementNode;
        constructor(test: ExpressionNode, consequent: StatementNode, alternate: StatementNode) {
            this.test = test;
            this.consequent = consequent;
            this.alternate = alternate;
        }
        accept(visitor: Visitor): any {
            return visitor.visitIf(this);
        }
    }

    /**
     * EXPRESSIONS
     * Expressions represent evaluable objects.
     */

    // A node representing an expression.
    // Analogous to Expression in estree.
    export interface ExpressionNode extends BasicSchemeNode {}

    // A node representing a literal value.
    // Analogous to Literal in estree.
    export class LiteralNode implements ExpressionNode {
        value: any;
        constructor(value: any) {
            this.value = value;
        }
        accept(visitor: Visitor): any {
            return visitor.visitLiteral(this);
        }
    }

    // A node representing a symbol.
    // Analogous to Identifier in estree.
    export class SymbolNode implements ExpressionNode {
        name: string;
        constructor(name: string) {
            this.name = name;
        }
        accept(visitor: Visitor): any {
            return visitor.visitSymbol(this);
        }
    }

    // A node representing a procedure.
    // Analogous to FunctionExpression in estree.
    export class ProcedureNode implements BasicSchemeNode {
        args: ExpressionNode[];
        body: StatementNode[];
        constructor(args: ExpressionNode[], body: StatementNode[]) {
            this.args = args;
            this.body = body;
        }
        accept(visitor: Visitor): any {
            return visitor.visitProcedure(this);
        }
    }

    // A node representing a procedure call.
    export class CallNode implements ExpressionNode {
        callee: ExpressionNode;
        args: ExpressionNode[];
        constructor(callee: ExpressionNode, args: ExpressionNode[]) {
            this.callee = callee;
            this.args = args;
        }
        accept(visitor: Visitor): any {
            return visitor.visitCall(this);
        }
    }

    // A node representing a vector.
    // Analogous to ArrayExpression in estree.
    /*
    TODO
    export class VectorNode implements ExpressionNode {
        elements: ExpressionNode[];
        constructor(elements: ExpressionNode[]) {
            this.elements = elements;
        }
        accept(visitor: Visitor): any {
            return visitor.visitVector(this);
        }
    }
    */

    // A node representing a list.
    // This is required as a list is not a type in JavaScript.
    // Instead, we "promise" that the list will exist at runtime, 
    // using a preexisting _list() function that is immutable.
    // Preformatting of the list by quotes will be done 
    // before conversion to JS.
    export class ListNode implements ExpressionNode {
        elements: ExpressionNode[];
        constructor(elements: ExpressionNode[]) {
            this.elements = elements;
        }
        accept(visitor: Visitor): any {
            return visitor.visitList(this);
        }
    }

    // A node representing a quote.
    // This is required as symbol names are not easily 
    // accessible in JavaScript.
    export class QuoteNode implements ExpressionNode {
        symbol: ExpressionNode;
        constructor(symbol: ExpressionNode) {
            this.symbol = symbol;
        }
        accept(visitor: Visitor): any {
            return visitor.visitQuote(this);
        }
    }
}