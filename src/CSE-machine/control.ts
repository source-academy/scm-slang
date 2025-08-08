// src/CSE-machine/control.ts
import { Expression } from '../transpiler/types/nodes/scheme-node-types';
import { Stack } from './stack';
import { Node, StatementSequence, Instr } from './types';

export type ControlItem = (Node | Instr) & {
  isEnvDependent?: boolean;
  skipEnv?: boolean;
};

export class Control extends Stack<ControlItem> {
  private numEnvDependentItems: number;
  
  public constructor(program?: Expression[] | StatementSequence) {
    super();
    this.numEnvDependentItems = 0;
    // Load program into control stack
    if (program) {
      if (Array.isArray(program)) {
        // If it's an array of expressions, create a sequence
        const seq: StatementSequence = {
          type: 'StatementSequence',
          body: program,
          location: program[0]?.location || { start: { line: 1, column: 1 }, end: { line: 1, column: 1 } }
        };
        this.push(seq);
      } else {
        this.push(program);
      }
    }
  }

  public canAvoidEnvInstr(): boolean {
    return this.numEnvDependentItems === 0;
  }

  // For testing purposes
  public getNumEnvDependentItems(): number {
    return this.numEnvDependentItems;
  }

  public pop(): ControlItem | undefined {
    const item = super.pop();
    if (item !== undefined && this.isEnvDependent(item)) {
      this.numEnvDependentItems--;
    }
    return item;
  }

  public push(...items: ControlItem[]): void {
    const itemsNew: ControlItem[] = Control.simplifyBlocksWithoutDeclarations(...items);
    itemsNew.forEach((item: ControlItem) => {
      if (this.isEnvDependent(item)) {
        this.numEnvDependentItems++;
      }
    });
    super.push(...itemsNew);
  }

  private isEnvDependent(item: ControlItem): boolean {
    return item.isEnvDependent === true;
  }

  /**
   * Before pushing block statements on the control stack, we check if the block statement has any declarations.
   * If not, the block is converted to a StatementSequence.
   * @param items The items being pushed on the control.
   * @returns The same set of control items, but with block statements without declarations converted to StatementSequences.
   */
  private static simplifyBlocksWithoutDeclarations(...items: ControlItem[]): ControlItem[] {
    const itemsNew: ControlItem[] = [];
    items.forEach(item => {
      // For Scheme, we don't have block statements like Python, so we just pass through
      itemsNew.push(item);
    });
    return itemsNew;
  }

  public copy(): Control {
    const newControl = new Control();
    const stackCopy = super.getStack();
    newControl.push(...stackCopy);
    return newControl;
  }
}
