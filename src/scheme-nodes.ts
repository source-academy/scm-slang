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
    export class StatementNode implements BasicSCMNode {
        expression: BasicSCMNode;
        constructor(expression: BasicSCMNode) {
            this.expression = expression;
        }
        accept(visitor: Visitor): Node {
            return visitor.visitStatement(this);
        }
    }

    // A node representing a block of statements.
    // Used in the body of a procedure, for example.
    // Analogous to BlockStatement in estree.
    export class BlockNode implements BasicSCMNode {
        body: StatementNode[];
        constructor(body: StatementNode[]) {
            this.body = body;
        }
        accept(visitor: Visitor): Node {
            return visitor.visitBlock(this);
        }
    }    

    // A node representing a symbol. 
    // Analogous to Identifier in estree.
    export class SymbolNode implements BasicSCMNode {
        name: string;
        constructor(name: string) {
            this.name = name;
        }
        accept(visitor: Visitor): Node {
            return visitor.visitSymbol(this);
        }
    }

    // A node representing a literal value.
    export class LiteralNode implements BasicSCMNode {
        value: any;
        constructor(value: any) {
            this.value = value;
        }
        accept(visitor: Visitor): Node {
            return visitor.visitLiteral(this);
        }
    }

    // A node representing a procedure.
    // Analogous to Arrow Function expression in estree.
    export class ProcedureNode implements BasicSCMNode {
        args: SymbolNode[];
        body: BasicSCMNode[];
        constructor(args: SymbolNode[], body: BasicSCMNode[]) {
            this.args = args;
            this.body = body;
        }
        accept(visitor: Visitor): Node {
            return visitor.visitProcedure(this);
        }
    }

    // A node representing a procedure call.
    export class CallNode implements BasicSCMNode {
        name: SymbolNode;
        args: BasicSCMNode[];
        constructor(name: SymbolNode, args: BasicSCMNode[]) {
            this.name = name;
            this.args = args;
        }
        accept(visitor: Visitor): Node {
            return visitor.visitCall(this);
        }
    }

    // A node representing a definition.
    // Analogous to VariableDeclarator in estree.
    export class DefinitionNode implements BasicSCMNode {
        name: SymbolNode;
        value: BasicSCMNode;
        constructor(name: SymbolNode, value: BasicSCMNode) {
            this.name = name;
            this.value = value;
        }
        accept(visitor: Visitor): Node {
            return visitor.visitDefinition(this);
        }
    }

    // A node representing an if statement.
    export class IfNode implements BasicSCMNode {
        condition: BasicSCMNode;
        then: BasicSCMNode;
        else: BasicSCMNode;
        constructor(condition: BasicSCMNode, then: BasicSCMNode, else_: BasicSCMNode) {
            this.condition = condition;
            this.then = then;
            this.else = else_;
        }
        accept(visitor: Visitor): Node {
            return visitor.visitIf(this);
        }
    }

    //TODO: polish nodes below

    // A node representing a list.
    // This is required as a list is not a type in JavaScript.
    // Instead, we will promise that the list will exist at runtime, 
    // using a preexisting _list() function that is immutable.
    export class ListNode implements BasicSCMNode {
        elements: BasicSCMNode[];
        constructor(elements: BasicSCMNode[]) {
            this.elements = elements;
        }
        accept(visitor: Visitor): Node {
            return visitor.visitList(this);
        }
    }

    // A node representing a quote.
    // This is required as symbol names are not easily 
    // accessible in JavaScript.
    export class QuoteNode implements BasicSCMNode {
        symbol: BasicSCMNode;
        constructor(symbol: BasicSCMNode) {
            this.symbol = symbol;
        }
        accept(visitor: Visitor): Node {
            return visitor.visitQuote(this);
        }
    }
}