// visitor class to convert scheme AST to JS estree
import { SchemeNode } from "./scheme-nodes"

export interface Visitor {
    visitIf(node: SchemeNode.IfNode): any;
    visitCall(node: SchemeNode.CallNode): any;
    visitList(node: SchemeNode.ListNode): any;
    visitRoot(node: SchemeNode.RootNode): any;
    visitBlock(node: SchemeNode.BlockNode): any;
    visitQuote(node: SchemeNode.QuoteNode): any;
    visitSymbol(node: SchemeNode.SymbolNode): any;
    visitLiteral(node: SchemeNode.LiteralNode): any;
    visitProcedure(node: SchemeNode.ProcedureNode): any;
    visitDefinition(node: SchemeNode.DefinitionNode): any;
    visitExpressionStatement(node: SchemeNode.ExpressionStatementNode): any;
}
