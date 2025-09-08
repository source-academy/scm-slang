import { parseSchemeSimple } from "../CSE-machine/simple-parser";

// Simple stepper implementation
function createSimpleStepperNode(node: any): any {
  const nodeType = node.constructor.name;

  switch (nodeType) {
    case "NumericLiteral":
    case "BooleanLiteral":
    case "StringLiteral":
      return {
        type: "Literal",
        value: node.value,
        raw: String(node.value),
        toString: () => String(node.value),
        isContractible: () => true,
        isOneStepPossible: () => false,
        contract: function () {
          return this;
        },
        oneStep: function () {
          return this;
        },
      };
    case "Identifier":
      return {
        type: "Identifier",
        name: node.name,
        toString: () => node.name,
        isContractible: () => true,
        isOneStepPossible: () => false,
        contract: function () {
          return this;
        },
        oneStep: function () {
          return this;
        },
      };
    case "Application": {
      const opNode = createSimpleStepperNode(node.operator);
      const ops = node.operands.map(createSimpleStepperNode);
      // No JS BinaryExpression mapping; keep Scheme prefix application
      // General application (lambda etc.)
      const operator = opNode;
      const operands = ops;

      // Helper: deep substitute identifiers by name with provided values, respecting shadowing in nested lambdas
      function substitute(nodeAny: any, env: Record<string, any>): any {
        if (!nodeAny) return nodeAny;
        switch (nodeAny.type) {
          case "Identifier": {
            const name = nodeAny.name;
            return env.hasOwnProperty(name) ? env[name] : nodeAny;
          }
          case "Literal":
            return nodeAny;
          case "FunctionApplication":
            return {
              ...nodeAny,
              operator: substitute(nodeAny.operator, env),
              operands: nodeAny.operands.map((o: any) => substitute(o, env)),
            };
          case "LambdaExpression": {
            // Avoid capturing: do not substitute parameters that are newly bound here
            const shadowed = Object.keys(env).reduce(
              (acc: Record<string, any>, key) => {
                const params: any[] = nodeAny.params || [];
                const has = params.some(p => (p && p.name) === key);
                if (!has) acc[key] = env[key];
                return acc;
              },
              {} as Record<string, any>
            );
            return { ...nodeAny, body: substitute(nodeAny.body, shadowed) };
          }
          case "Program":
            return {
              ...nodeAny,
              body: nodeAny.body.map((b: any) => substitute(b, env)),
            };
          default:
            return nodeAny;
        }
      }
      return {
        type: "FunctionApplication",
        operator,
        operands,
        toString: function () {
          return `(${this.operator.toString()} ${this.operands.map((n: any) => n.toString()).join(" ")})`;
        },
        isContractible: function () {
          const isPrim =
            this.operator.type === "Identifier" &&
            ["+", "-", "*", "/"].includes(this.operator.name);
          const allLit = this.operands.every(
            (op: any) =>
              op.type === "Literal" ||
              (op.isContractible && op.isContractible())
          );
          const allContractible = this.operands.every((op: any) =>
            op.isContractible ? op.isContractible() : true
          );
          return (
            (this.operator.type === "LambdaExpression" && allContractible) ||
            (isPrim && this.operands.every((op: any) => op.type === "Literal"))
          );
        },
        isOneStepPossible: function () {
          return (
            this.operands.some((op: any) => op.isOneStepPossible()) ||
            this.isContractible()
          );
        },
        contract: function () {
          return this;
        },
        oneStep: function () {
          // Step only the first reducible operand
          for (let i = 0; i < this.operands.length; i++) {
            const op = this.operands[i];
            if (op.isOneStepPossible && op.isOneStepPossible()) {
              const newOperands = [...this.operands];
              newOperands[i] = op.oneStep();
              return { ...this, operands: newOperands };
            }
          }
          // No operand stepped; try to contract the application itself
          const isPrim =
            this.operator.type === "Identifier" &&
            ["+", "-", "*", "/"].includes(this.operator.name);
          if (
            isPrim &&
            this.operands.every((op: any) => op.type === "Literal")
          ) {
            const a = Number(this.operands[0].value);
            const b = Number(this.operands[1].value);
            let result = 0;
            switch (this.operator.name) {
              case "+":
                result = a + b;
                break;
              case "-":
                result = a - b;
                break;
              case "*":
                result = a * b;
                break;
              case "/":
                result = a / b;
                break;
            }
            return {
              type: "Literal",
              value: result,
              raw: String(result),
              toString: () => String(result),
              isContractible: () => true,
              isOneStepPossible: () => false,
              contract: function () {
                return this;
              },
              oneStep: function () {
                return this;
              },
            };
          }
          if (
            this.operator.type === "LambdaExpression" &&
            this.operands.every((op: any) =>
              op.isContractible ? op.isContractible() : true
            )
          ) {
            const params: any[] = this.operator.params || [];
            const env: Record<string, any> = {};
            for (
              let i = 0;
              i < Math.min(params.length, this.operands.length);
              i++
            ) {
              const param = params[i];
              const name = param && param.name ? param.name : undefined;
              if (name) env[name] = this.operands[i];
            }
            const reduced = substitute(this.operator.body, env);
            return reduced;
          }
          return this;
        },
      };
    }
    case "Lambda":
      const body = createSimpleStepperNode(node.body);
      return {
        type: "LambdaExpression",
        params: node.params || [],
        body,
        toString: () =>
          `(lambda (${(node.params || []).map((p: any) => p.name).join(" ")}) ${body.toString()})`,
        isContractible: () => true,
        isOneStepPossible: () => false,
        contract: function () {
          return this;
        },
        oneStep: function () {
          return this;
        },
      };
    case "Sequence":
      const bodyNodes = node.expressions.map(createSimpleStepperNode);
      return {
        type: "Program",
        body: bodyNodes,
        toString: function () {
          return this.body.map((n: any) => n.toString()).join("\n");
        },
        isContractible: function () {
          return this.body.every((expr: any) => expr.isContractible());
        },
        isOneStepPossible: function () {
          return this.body.some((expr: any) => expr.isOneStepPossible());
        },
        contract: function () {
          if (!this.isContractible()) {
            throw new Error("Cannot contract non-contractible program");
          }
          const contractedBody = this.body.map((expr: any) => expr.contract());
          if (contractedBody.length === 1) {
            return contractedBody[0];
          }
          return { ...this, body: contractedBody };
        },
        oneStep: function () {
          for (let i = 0; i < this.body.length; i++) {
            const expr = this.body[i];
            if (expr.isOneStepPossible()) {
              const newBody = [...this.body];
              newBody[i] = expr.oneStep();
              return { ...this, body: newBody };
            }
          }
          if (this.isContractible()) {
            return this.contract();
          }
          return this;
        },
      };
    default:
      return {
        type: "Literal",
        value: "undefined",
        raw: "undefined",
        toString: () => "undefined",
        isContractible: () => true,
        isOneStepPossible: () => false,
        contract: function () {
          return this;
        },
        oneStep: function () {
          return this;
        },
      };
  }
}

export interface IStepperPropContents {
  ast: any;
  markers: any[];
}

export function stepExpression(
  code: string,
  stepLimit: number = 1000
): IStepperPropContents[] {
  try {
    // Utilities to emulate js-slang stepper behaviour: find the next reducible
    // sub-expression and produce before/after markers and human-readable messages.
    type PathSegment = {
      key: "left" | "right" | "body" | "operands";
      index?: number;
    };
    const isOneStepPossibleSafe = (n: any) =>
      !!n && typeof n.isOneStepPossible === "function" && n.isOneStepPossible();
    const isContractibleSafe = (n: any) =>
      !!n && typeof n.isContractible === "function" && n.isContractible();
    const getNodeAtPath = (node: any, path: PathSegment[]) => {
      let cur = node;
      for (const seg of path) {
        if (cur == null) return cur;
        if (seg.key === "left" || seg.key === "right") {
          cur = cur[seg.key];
        } else if (seg.key === "body" || seg.key === "operands") {
          const arr = cur[seg.key];
          cur = Array.isArray(arr) ? arr[seg.index as number] : undefined;
        }
      }
      return cur;
    };
    const findReduciblePath = (node: any): PathSegment[] | null => {
      if (!node) return null;
      switch (node.type) {
        case "Program": {
          const body = node.body || [];
          for (let i = 0; i < body.length; i++) {
            const sub = body[i];
            const subPath = findReduciblePath(sub);
            if (subPath) return [{ key: "body", index: i }, ...subPath];
          }
          return isContractibleSafe(node) ? [] : null;
        }
        case "BinaryExpression": {
          const left = node.left;
          const right = node.right;
          if (isOneStepPossibleSafe(left))
            return [{ key: "left" }, ...(findReduciblePath(left) || [])];
          if (isOneStepPossibleSafe(right))
            return [{ key: "right" }, ...(findReduciblePath(right) || [])];
          return isContractibleSafe(node) ? [] : null;
        }
        case "FunctionApplication": {
          const ops = node.operands || [];
          for (let i = 0; i < ops.length; i++) {
            const sub = ops[i];
            if (isOneStepPossibleSafe(sub))
              return [
                { key: "operands", index: i },
                ...(findReduciblePath(sub) || []),
              ];
          }
          return isContractibleSafe(node) ? [] : null;
        }
        default:
          return null;
      }
    };
    const explainRedex = (node: any): string => {
      // Arithmetic in prefix form: (+ a b)
      if (
        node &&
        node.type === "FunctionApplication" &&
        node.operator &&
        node.operator.type === "Identifier" &&
        ["+", "-", "*", "/"].includes(node.operator.name)
      ) {
        const ops = node.operands || [];
        if (ops.length >= 2) {
          const l =
            ops[0].raw !== undefined
              ? ops[0].raw
              : ops[0].value !== undefined
                ? String(ops[0].value)
                : "";
          const r =
            ops[1].raw !== undefined
              ? ops[1].raw
              : ops[1].value !== undefined
                ? String(ops[1].value)
                : "";
          if (l !== "" && r !== "")
            return `Binary expression ${l} ${node.operator.name} ${r} evaluated`;
        }
      }
      return "Step";
    };
    const canReduce = (node: any): boolean => {
      if (!node || typeof node !== "object") return false;
      switch (node.type) {
        case "Literal":
        case "Identifier":
          return false;
        case "LambdaExpression":
          return canReduce(node.body);
        case "Program":
          return (node.body || []).some((b: any) => canReduce(b));
        case "FunctionApplication": {
          const ops = node.operands || [];
          if (ops.some((o: any) => canReduce(o))) return true;
          const isPrim =
            node.operator &&
            node.operator.type === "Identifier" &&
            ["+", "-", "*", "/"].includes(node.operator.name);
          const allLit =
            ops.length >= 2 && ops.every((o: any) => o.type === "Literal");
          const allContractible = ops.every((o: any) =>
            o.isContractible ? o.isContractible() : true
          );
          return (
            (isPrim && allLit) ||
            (node.operator &&
              node.operator.type === "LambdaExpression" &&
              allContractible)
          );
        }
        default:
          return false;
      }
    };

    // Parse the Scheme code into AST
    const expressions = parseSchemeSimple(code);
    if (!expressions || expressions.length === 0) {
      return [
        {
          ast: { type: "Literal", value: "error", raw: "error" },
          markers: [{ explanation: "Error parsing code" }],
        },
      ];
    }

    // Convert to stepper nodes
    let stepperNode;
    if (expressions.length === 1) {
      stepperNode = createSimpleStepperNode(expressions[0]);
    } else {
      // Create a program node for multiple expressions
      stepperNode = createSimpleStepperNode({
        constructor: { name: "Sequence" },
        expressions,
      });
    }

    // Generate steps manually
    const steps: IStepperPropContents[] = [];

    // Add initial step
    steps.push({
      ast: stepperNode,
      markers: [{ explanation: "Start of evaluation" }],
    });

    // Generate steps until no more steps possible or limit reached
    let currentStep = 0;
    let currentNode = stepperNode;

    while (currentStep < stepLimit && canReduce(currentNode)) {
      currentStep++;

      try {
        const oldNode = currentNode;
        // Determine redex to mimic js-slang tracer
        const path = findReduciblePath(oldNode) || [];
        const beforeRedex = getNodeAtPath(oldNode, path) ?? oldNode;
        const explanation = explainRedex(beforeRedex);

        const nextNode = (currentNode as any).oneStep();

        // No-change guard
        const unchanged = JSON.stringify(nextNode) === JSON.stringify(oldNode);
        currentNode = nextNode;

        steps.push({
          ast: oldNode,
          markers: [
            { redex: beforeRedex, redexType: "beforeMarker", explanation },
          ],
        });

        const afterRedex = getNodeAtPath(currentNode, path) ?? currentNode;
        steps.push({
          ast: currentNode,
          markers: [
            { redex: afterRedex, redexType: "afterMarker", explanation },
          ],
        });

        if (unchanged) {
          break;
        }
      } catch (error) {
        steps.push({
          ast: currentNode,
          markers: [{ explanation: `Step ${currentStep}: Error - ${error}` }],
        });
        break;
      }
    }

    // Fallback: if for some reason no reduction steps were generated but the node supports oneStep,
    // attempt a single reduction to provide at least one step pair for the UI.
    if (
      steps.length === 1 &&
      typeof (currentNode as any).oneStep === "function"
    ) {
      try {
        const oldNode = currentNode;
        const path: any[] = findReduciblePath(oldNode) || [];
        const beforeRedex = getNodeAtPath(oldNode, path) ?? oldNode;
        const explanation = explainRedex(beforeRedex);
        currentNode = (currentNode as any).oneStep();
        steps.push({
          ast: oldNode,
          markers: [
            { redex: beforeRedex, redexType: "beforeMarker", explanation },
          ],
        });
        const afterRedex = getNodeAtPath(currentNode, path) ?? currentNode;
        steps.push({
          ast: currentNode,
          markers: [
            { redex: afterRedex, redexType: "afterMarker", explanation },
          ],
        });
      } catch {}
    }

    // Mark the last step as complete if any steps exist
    if (steps.length > 1) {
      const last = steps[steps.length - 1];
      last.markers = [{ explanation: "Evaluation complete" }];
    }
    return steps;
  } catch (error) {
    return [
      {
        ast: { type: "Literal", value: "error", raw: "error" },
        markers: [{ explanation: `Error parsing code: ${error}` }],
      },
    ];
  }
}
