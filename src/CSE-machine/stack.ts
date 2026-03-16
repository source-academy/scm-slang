// stack.ts

export interface IStack<T> {
  push(...items: T[]): void;
  pop(): T | undefined;
  peek(): T | undefined;
  size(): number;
  isEmpty(): boolean;
  getStack(): T[];
}

export class Stack<T> {
  private items: T[] = [];

  push(...items: T[]): void {
    this.items.push(...items);
  }

  pop(): T | undefined {
    return this.items.pop();
  }

  peek(): T | undefined {
    return this.items[this.items.length - 1];
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  size(): number {
    return this.items.length;
  }

  clear(): void {
    this.items = [];
  }

  getStack(): T[] {
    return [...this.items];
  }
}
//Checking
const s = new Stack<number>();
s.push(1, 2, 3);
console.log(s.pop()); // 3
console.log(s.peek()); // 2
console.log(s.toString());
