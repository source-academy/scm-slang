// visitor class to convert scheme AST to JS estree
import { SCMNode } from "./scheme-nodes";
import {     
    Literal, 
    Program,
    Statement,
    Identifier,
    BlockStatement,
    CallExpression,
    FunctionExpression,
    VariableDeclarator,
} from "estree";


export interface Visitor {
    visitIf(node: SCMNode.IfNode): CallExpression;
    visitCall(node: SCMNode.CallNode): CallExpression;
    visitList(node: SCMNode.ListNode): CallExpression; // this calls _list()
    visitRoot(node: SCMNode.RootNode): Program;
    visitBlock(node: SCMNode.BlockNode): BlockStatement;
    visitQuote(node: SCMNode.QuoteNode); // to define behaviour later
    visitSymbol(node: SCMNode.SymbolNode): Identifier;
    visitLiteral(node: SCMNode.LiteralNode): Literal;
    visitProcedure(node: SCMNode.ProcedureNode): FunctionExpression;
    visitStatement(node: SCMNode.StatementNode): Statement;
    visitDefinition(node: SCMNode.DefinitionNode): VariableDeclarator;
}