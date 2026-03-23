import * as stdlib from "../stdlib/base";
import { decode, encode } from "../index";
import { evalSchemeExpression } from "./evaluator";

export interface Environment {
  values: Map<string, any>;
  parent: Environment | null;
}

export function createEnvironment(parent: Environment | null): Environment {
  return {
    values: new Map(),
    parent,
  };
}

export function createGlobalEnvironment(): Environment {
  const env = createEnvironment(null);

  for (const [encodedKey, value] of Object.entries(stdlib)) {
    env.values.set(encodedKey, value);
    const decodedKey = decode(encodedKey);
    if (decodedKey !== encodedKey) {
      env.values.set(decodedKey, value);
    }
  }

  if ((stdlib as any).make_number) {
    env.values.set("make_number", (stdlib as any).make_number);
  }

  if (!env.values.has("make_number")) {
    const coreImport = require("../stdlib/core-math");
    if (coreImport.make_number) {
      env.values.set("make_number", coreImport.make_number);
    }
  }

  env.values.set("eval", (schemeExpr: any, currentEnv?: Environment) => {
    const envToUse = currentEnv ?? env;
    return evalSchemeExpression(schemeExpr, envToUse);
  });

  return env;
}

function lookupInEnv(
  env: Environment,
  name: string
): { found: boolean; value?: any } {
  let current: Environment | null = env;
  while (current !== null) {
    if (current.values.has(name)) {
      return { found: true, value: current.values.get(name) };
    }
    current = current.parent;
  }
  return { found: false };
}

function getNameVariants(name: string): string[] {
  const variants = [name, encode(name), decode(name)];
  const unique: string[] = [];
  for (const variant of variants) {
    if (!unique.includes(variant)) {
      unique.push(variant);
    }
  }
  return unique;
}

export function lookupVariable(name: string, env: Environment): any {
  const variants = getNameVariants(name);
  let current: Environment | null = env;

  while (current !== null) {
    let foundInFrame = false;
    let frameValue: any = undefined;
    for (const variant of variants) {
      if (current.values.has(variant)) {
        const value = current.values.get(variant);
        if (!foundInFrame) {
          foundInFrame = true;
          frameValue = value;
        } else if (frameValue !== value) {
          // Invariant: all name variants for a binding are defined together and
          // always updated together (see defineVariable/setVariable), so they
          // should never diverge. If this fires, it indicates a bug.
          throw new Error(`Conflicting bindings for ${name}`);
        }
      }
    }
    if (foundInFrame) {
      return frameValue;
    }
    current = current.parent;
  }

  throw new Error(`Undefined variable: ${name}`);
}

export function defineVariable(
  name: string,
  value: any,
  env: Environment
): void {
  for (const variant of getNameVariants(name)) {
    env.values.set(variant, value);
  }
}

function findEnvWithName(env: Environment, name: string): Environment | null {
  let current: Environment | null = env;
  while (current !== null) {
    if (current.values.has(name)) {
      return current;
    }
    current = current.parent;
  }
  return null;
}

export function setVariable(name: string, value: any, env: Environment): any {
  for (const variant of getNameVariants(name)) {
    const targetEnv = findEnvWithName(env, variant);
    if (targetEnv) {
      for (const other of getNameVariants(name)) {
        targetEnv.values.set(other, value);
      }
      return value;
    }
  }

  throw new Error(`Undefined variable: ${name}`);
}
