// basic scheme node types to generate a scheme AST.
import { Visitor } from "./scheme-visitor";
import { Node } from "estree";

// TODO: refactor? possibly split nodes into more
// node types, eg expressions and statements

// however for us this set of nodes is most likely sufficient

export namespace SCMNode {
    interface BasicSCMNode {
        accept(visitor: Visitor): Node;
    }

    // The root node of the AST. 
    // Analogous to Program node in estree.
    export class RootNode implements BasicSCMNode {
        body: StatementNode[];
        constructor(body: StatementNode[]) {
            this.body = body;
        }
        accept(visitor: Visitor): Node {
            return visitor.visitRoot(this);
        }
    }

    // A node representing a statement.
    // Analogous to Statement in estree.
    export interface StatementNode extends BasicSCMNode {
    }

    // STATEMENTS GO HERE

    // A node representing a block of statements.
    // Used in the body of a procedure, for example.
    // Analogous to BlockStatement in estree.
    export class BlockNode implements StatementNode {
        body: StatementNode[];
        constructor(body: StatementNode[]) {
            this.body = body;
        }
        accept(visitor: Visitor): Node {
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
        accept(visitor: Visitor): Node {
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
        accept(visitor: Visitor): Node {
            return visitor.visitDefinition(this);
        }
    }

    // A node representing an if statement.
    // Analogous to IfStatement in estree.
    export class IfNode implements StatementNode {
        test: ExpressionNode;
        consequent: StatementNode;
        alternate: StatementNode;
        constructor(test: ExpressionNode, consequent: StatementNode, alternate: StatementNode) {
            this.test = test;
            this.consequent = consequent;
            this.alternate = alternate;
        }
        accept(visitor: Visitor): Node {
            return visitor.visitIf(this);
        }
    }

    // A node representing an expression.
    // Analogous to Expression in estree.
    export interface ExpressionNode extends BasicSCMNode {
    }

    // EXPRESSIONS GO HERE

    // A node representing a literal value.
    // Analogous to Literal in estree.
    export class LiteralNode implements ExpressionNode {
        value: any;
        constructor(value: any) {
            this.value = value;
        }
        accept(visitor: Visitor): Node {
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
        accept(visitor: Visitor): Node {
            return visitor.visitSymbol(this);
        }
    }

    // A node representing a procedure.
    // Analogous to FunctionExpression in estree.
    export class ProcedureNode implements BasicSCMNode {
        args: ExpressionNode[];
        body: StatementNode[];
        constructor(args: ExpressionNode[], body: StatementNode[]) {
            this.args = args;
            this.body = body;
        }
        accept(visitor: Visitor): Node {
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
        accept(visitor: Visitor): Node {
            return visitor.visitCall(this);
        }
    }

    // A node representing a list.
    // This is required as a list is not a type in JavaScript.
    // Instead, we will promise that the list will exist at runtime, 
    // using a preexisting _list() function that is immutable.
    export class ListNode implements ExpressionNode {
        elements: ExpressionNode[];
        constructor(elements: ExpressionNode[]) {
            this.elements = elements;
        }
        accept(visitor: Visitor): Node {
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
        accept(visitor: Visitor): Node {
            return visitor.visitQuote(this);
        }
    }
}