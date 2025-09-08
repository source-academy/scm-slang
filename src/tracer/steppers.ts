import { StepperBaseNode } from "./interface";
import { explain } from "./generator";
import { IStepperPropContents, Marker, redex } from "./index";

export function getSteps(
  inputNode: any,
  context: any,
  { stepLimit }: { stepLimit: number }
): IStepperPropContents[] {
  const node: StepperBaseNode = inputNode;
  const steps: IStepperPropContents[] = [];
  const limit =
    stepLimit === undefined
      ? 1000
      : stepLimit % 2 === 0
        ? stepLimit
        : stepLimit + 1;
  let hasError = false;

  let numSteps = 0;
  function evaluate(node: StepperBaseNode): StepperBaseNode {
    numSteps += 1;
    if (numSteps >= limit) {
      return node;
    }

    try {
      const isOneStepPossible = node.isOneStepPossible();
      if (isOneStepPossible) {
        const oldNode = node;
        let newNode: StepperBaseNode;
        newNode = node.oneStep();

        if (redex) {
          const explanations: string[] = redex.preRedex.map(explain);
          const beforeMarkers: Marker[] = redex.preRedex.map(
            (redex, index) => ({
              redex: redex,
              redexType: "beforeMarker",
              explanation: explanations[index],
            })
          );
          steps.push({
            ast: oldNode,
            markers: beforeMarkers,
          });
          const afterMarkers: Marker[] =
            redex.postRedex.length > 0
              ? redex.postRedex.map((redex, index) => ({
                  redex: redex,
                  redexType: "afterMarker",
                  explanation: explanations[index],
                }))
              : [
                  {
                    redexType: "afterMarker",
                    explanation: explanations[0], // use explanation based on preRedex
                  },
                ];
          steps.push({
            ast: newNode,
            markers: afterMarkers,
          });
        }
        // reset
        redex.preRedex = [];
        redex.postRedex = [];
        return evaluate(newNode);
      } else {
        return node;
      }
    } catch (error) {
      // Handle error during step evaluation
      hasError = true;
      steps.push({
        ast: node,
        markers: [
          {
            redexType: "beforeMarker",
            explanation: error instanceof Error ? error.message : String(error),
          },
        ],
      });
      return node;
    }
  }

  // First node
  steps.push({
    ast: node,
    markers: [
      {
        explanation: "Start of evaluation",
      },
    ],
  });

  // Start evaluation
  evaluate(node);

  return steps;
}
