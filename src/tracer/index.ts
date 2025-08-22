import { StepperBaseNode } from './interface';

export let redex: { preRedex: StepperBaseNode[]; postRedex: StepperBaseNode[] } = {
  preRedex: [],
  postRedex: []
};

export interface Marker {
  redex?: StepperBaseNode | null;
  redexType?: 'beforeMarker' | 'afterMarker';
  explanation?: string;
}

export interface IStepperPropContents {
  ast: StepperBaseNode;
  markers: Marker[];
}

// Export all modules
export * from './generator';
export * from './steppers';
export * from './stepper';
export * from './nodes';
