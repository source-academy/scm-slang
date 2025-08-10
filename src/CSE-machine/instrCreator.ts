// instrCreator.ts
import {
  Expression,
  Atomic,
  Extended,
} from "../transpiler/types/nodes/scheme-node-types";
import { Location, Position } from "../transpiler/types/location";
import { Environment } from "./environment";
import {
  Instr,
  InstrType,
  DefineInstr,
  SetInstr,
  CondInstr,
  LetInstr,
  BeginInstr,
  DelayInstr,
  PairInstr,
  ListInstr,
  VectorInstr,
  SymbolInstr,
  NilInstr,
  CarInstr,
  CdrInstr,
  ConsInstr,
  RestoreEnvInstr,
  AppInstr,
  BranchInstr,
} from "./types";

export function createDefineInstr(
  name: string,
  value: Expression
): DefineInstr {
  return {
    instrType: InstrType.DEFINE,
    srcNode: value,
    name,
    value,
  };
}

export function createSetInstr(name: string, value: Expression): SetInstr {
  return {
    instrType: InstrType.SET,
    srcNode: value,
    name,
    value,
  };
}

export function createCondInstr(
  predicates: Expression[],
  consequents: Expression[],
  catchall?: Expression
): CondInstr {
  return {
    instrType: InstrType.COND,
    srcNode: predicates[0] || consequents[0],
    predicates,
    consequents,
    catchall,
  };
}

export function createLetInstr(
  identifiers: string[],
  values: Expression[],
  body: Expression
): LetInstr {
  return {
    instrType: InstrType.LET,
    srcNode: body,
    identifiers,
    values,
    body,
  };
}

export function createBeginInstr(expressions: Expression[]): BeginInstr {
  return {
    instrType: InstrType.BEGIN,
    srcNode: expressions[0] || expressions[expressions.length - 1],
    expressions,
  };
}

export function createDelayInstr(expression: Expression): DelayInstr {
  return {
    instrType: InstrType.DELAY,
    srcNode: expression,
    expression,
  };
}

export function createPairInstr(car: Expression, cdr: Expression): PairInstr {
  return {
    instrType: InstrType.PAIR,
    srcNode: car,
    car,
    cdr,
  };
}

export function createListInstr(
  elements: Expression[],
  terminator?: Expression
): ListInstr {
  return {
    instrType: InstrType.LIST,
    srcNode: elements[0] || terminator,
    elements,
    terminator,
  };
}

export function createVectorInstr(elements: Expression[]): VectorInstr {
  return {
    instrType: InstrType.VECTOR,
    srcNode: elements[0],
    elements,
  };
}

export function createSymbolInstr(value: string): SymbolInstr {
  return {
    instrType: InstrType.SYMBOL,
    srcNode: new Atomic.Symbol(
      new Location(new Position(1, 1), new Position(1, 1)),
      value
    ),
    value,
  };
}

export function createNilInstr(): NilInstr {
  return {
    instrType: InstrType.NIL,
    srcNode: new Atomic.Nil(
      new Location(new Position(1, 1), new Position(1, 1))
    ),
  };
}

export function createCarInstr(pair: Expression): CarInstr {
  return {
    instrType: InstrType.CAR,
    srcNode: pair,
    pair,
  };
}

export function createCdrInstr(pair: Expression): CdrInstr {
  return {
    instrType: InstrType.CDR,
    srcNode: pair,
    pair,
  };
}

export function createConsInstr(car: Expression, cdr: Expression): ConsInstr {
  return {
    instrType: InstrType.CONS,
    srcNode: car,
    car,
    cdr,
  };
}

export function createAppInstr(
  numOfArgs: number,
  srcNode: Expression
): AppInstr {
  return {
    instrType: InstrType.APPLICATION,
    srcNode,
    numOfArgs,
  };
}

export function createBranchInstr(
  consequent: Expression,
  alternate: Expression | null | undefined
): BranchInstr {
  return {
    instrType: InstrType.BRANCH,
    srcNode: consequent,
    consequent,
    alternate,
  };
}

export function createRestoreEnvInstr(env: Environment): RestoreEnvInstr {
  return {
    instrType: InstrType.RESTORE_ENV,
    srcNode: {
      type: "StatementSequence",
      body: [],
      location: { start: { line: 0, column: 0 }, end: { line: 0, column: 0 } },
    },
    env,
  };
}
import { LiteralInstr, VariableInstr, LambdaInstr, IfInstr } from "./types";

// Literal instruction
export function createLiteralInstr(
  value: any,
  srcNode: Expression
): LiteralInstr {
  return {
    instrType: InstrType.LITERAL,
    srcNode,
    value,
  };
}

// Variable instruction
export function createVariableInstr(
  name: string,
  srcNode: Expression
): VariableInstr {
  return {
    instrType: InstrType.VARIABLE,
    srcNode,
    name,
  };
}

// Lambda instruction
export function createLambdaInstr(
  params: string[],
  body: Expression[],
  srcNode: Expression
): LambdaInstr {
  return {
    instrType: InstrType.LAMBDA,
    srcNode,
    params,
    body,
  };
}

// If instruction
export function createIfInstr(
  test: Expression,
  consequent: Expression,
  alternate: Expression,
  srcNode: Expression
): IfInstr {
  return {
    instrType: InstrType.IF,
    srcNode,
    test,
    consequent,
    alternate,
  };
}
