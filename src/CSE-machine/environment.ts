import { Expression } from '../transpiler/types/nodes/scheme-node-types';

export interface Environment {
  parent: Environment | null;
  frame: Map<string, any>;
  name: string;
  get(name: string): any;
  set(name: string, value: any): void;
  define(name: string, value: any): void;
  has(name: string): boolean;
  clone(): Environment;
}

export function createEnvironment(name: string, parent: Environment | null = null): Environment {
  return {
    parent,
    frame: new Map(),
    name,
    get(name: string): any {
      if (this.frame.has(name)) {
        return this.frame.get(name);
      }
      if (this.parent) {
        return this.parent.get(name);
      }
      throw new Error(`Undefined variable: ${name}`);
    },
    set(name: string, value: any): void {
      if (this.frame.has(name)) {
        this.frame.set(name, value);
        return;
      }
      if (this.parent) {
        this.parent.set(name, value);
        return;
      }
      throw new Error(`Cannot set undefined variable: ${name}`);
    },
    define(name: string, value: any): void {
      this.frame.set(name, value);
    },
    has(name: string): boolean {
      if (this.frame.has(name)) {
        return true;
      }
      if (this.parent) {
        return this.parent.has(name);
      }
      return false;
    },
    clone(): Environment {
      const clonedFrame = new Map(this.frame);
      const clonedParent = this.parent ? this.parent.clone() : null;
      const clonedEnv = createEnvironment(this.name, clonedParent);
      clonedEnv.frame = clonedFrame;
      return clonedEnv;
    }
  };
}

export function createProgramEnvironment(): Environment {
  return createEnvironment('program');
}

export function createBlockEnvironment(parent: Environment): Environment {
  return createEnvironment('block', parent);
}

export function currentEnvironment(env: Environment): Environment {
  return env;
}

export function pushEnvironment(env: Environment): Environment {
  return createBlockEnvironment(env);
}

export function popEnvironment(env: Environment): Environment {
  if (!env.parent) {
    throw new Error('Cannot pop root environment');
  }
  return env.parent;
}