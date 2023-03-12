// visitor class to convert scheme AST to JS estree
import { SchemeNode } from "./scheme-nodes";
import {     
    Literal, 
    Program,
    Statement,
    Identifier,
    BlockStatement,
    CallExpression,
    FunctionExpression,
    VariableDeclaration,
} from "estree";

/*

to do
export class SchemeToEstreeVisitor implements Visitor{
    visitIf(node: SchemeNode.IfNode);
    visitCall(node: SchemeNode.CallNode);
    visitList(node: SchemeNode.ListNode);
    visitRoot(node: SchemeNode.RootNode);
    visitBlock(node: SchemeNode.BlockNode);
    visitQuote(node: SchemeNode.QuoteNode);
    visitSymbol(node: SchemeNode.SymbolNode);
    visitLiteral(node: SchemeNode.LiteralNode);
    visitProcedure(node: SchemeNode.ProcedureNode);
    visitDefinition(node: SchemeNode.DefinitionNode);
    visitExpressionStatement(node: SchemeNode.ExpressionStatementNode);
}

*/