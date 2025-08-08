// types.ts
import { Expression } from '../transpiler/types/nodes/scheme-node-types';
import { Environment } from './environment';

export type Node = { isEnvDependent?: boolean } & (
    | Expression
    | StatementSequence
);

export interface StatementSequence {
    type: 'StatementSequence';
    body: Expression[];
    location: any;
}

export enum InstrType {
    RESET = 'Reset',
    WHILE = 'While',
    FOR = 'For',
    ASSIGNMENT = 'Assignment',
    APPLICATION = 'Application',
    UNARY_OP = 'UnaryOperation',
    BINARY_OP = 'BinaryOperation',
    BOOL_OP = 'BoolOperation',
    COMPARE = 'Compare',
    CALL = 'Call',
    RETURN = 'Return',
    BREAK = 'Break',
    CONTINUE = 'Continue',
    IF = 'If',
    FUNCTION_DEF = 'FunctionDef',
    LAMBDA = 'Lambda',
    MULTI_LAMBDA = 'MultiLambda',
    GROUPING = 'Grouping',
    LITERAL = 'Literal',
    VARIABLE = 'Variable',
    TERNARY = 'Ternary',
    PASS = 'Pass',
    ASSERT = 'Assert',
    IMPORT = 'Import',
    GLOBAL = 'Global',
    NONLOCAL = 'NonLocal',
    Program = 'Program',
    BRANCH = 'Branch',
    POP = 'Pop',
    ENVIRONMENT = 'environment',
    MARKER = 'marker',
    // Scheme-specific instructions
    DEFINE = 'Define',
    SET = 'Set',
    COND = 'Cond',
    LET = 'Let',
    BEGIN = 'Begin',
    DELAY = 'Delay',
    PAIR = 'Pair',
    LIST = 'List',
    VECTOR = 'Vector',
    SYMBOL = 'Symbol',
    NIL = 'Nil',
    CAR = 'Car',
    CDR = 'Cdr',
    CONS = 'Cons',
}

interface BaseInstr {
  instrType: InstrType
  srcNode: Node
  isEnvDependent?: boolean
}

export interface WhileInstr extends BaseInstr {
  test: Expression
  body: Expression
}

export interface ForInstr extends BaseInstr {
  init: Expression
  test: Expression
  update: Expression
  body: Expression
}

export interface AssmtInstr extends BaseInstr {
  symbol: string
  constant: boolean
  declaration: boolean
}

export interface UnOpInstr extends BaseInstr {
  symbol: string
}

export interface BinOpInstr extends BaseInstr {
  symbol: string
}

export interface AppInstr extends BaseInstr {
  numOfArgs: number
  srcNode: Expression
}

export interface BranchInstr extends BaseInstr {
  consequent: Expression
  alternate: Expression | null | undefined
}

export interface EnvInstr extends BaseInstr {
  env: Environment
}

export interface ArrLitInstr extends BaseInstr {
  arity: number
}

export interface DefineInstr extends BaseInstr {
  name: string
  value: Expression
}

export interface SetInstr extends BaseInstr {
  name: string
  value: Expression
}

export interface CondInstr extends BaseInstr {
  predicates: Expression[]
  consequents: Expression[]
  catchall?: Expression
}

export interface LetInstr extends BaseInstr {
  identifiers: string[]
  values: Expression[]
  body: Expression
}

export interface BeginInstr extends BaseInstr {
  expressions: Expression[]
}

export interface DelayInstr extends BaseInstr {
  expression: Expression
}

export interface PairInstr extends BaseInstr {
  car: Expression
  cdr: Expression
}

export interface ListInstr extends BaseInstr {
  elements: Expression[]
  terminator?: Expression
}

export interface VectorInstr extends BaseInstr {
  elements: Expression[]
}

export interface SymbolInstr extends BaseInstr {
  value: string
}

export interface NilInstr extends BaseInstr {
}

export interface CarInstr extends BaseInstr {
  pair: Expression
}

export interface CdrInstr extends BaseInstr {
  pair: Expression
}

export interface ConsInstr extends BaseInstr {
  car: Expression
  cdr: Expression
}

// ...existing code...

export interface LiteralInstr extends BaseInstr {
  value: any
}

export interface VariableInstr extends BaseInstr {
  name: string
}

export interface LambdaInstr extends BaseInstr {
  params: string[]
  body: Expression[]
}

export interface IfInstr extends BaseInstr {
  test: Expression
  consequent: Expression
  alternate: Expression
}

// Thêm các type này vào union Instr:
export type Instr =
  | BaseInstr
  | WhileInstr
  | AssmtInstr
  | AppInstr
  | BranchInstr
  | EnvInstr
  | ArrLitInstr
  | DefineInstr
  | SetInstr
  | CondInstr
  | LetInstr
  | BeginInstr
  | DelayInstr
  | PairInstr
  | ListInstr
  | VectorInstr
  | SymbolInstr
  | NilInstr
  | CarInstr
  | CdrInstr
  | ConsInstr
  | UnOpInstr
  | BinOpInstr
  | LiteralInstr
  | VariableInstr
  | LambdaInstr
  | IfInstr;