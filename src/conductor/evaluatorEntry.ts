import * as runner from "@sourceacademy/conductor/runner";
import SchemeEvaluator from "./SchemeEvaluator.js";

const { initialise } = runner as any;
const { runnerPlugin, conduit } = initialise(SchemeEvaluator);

declare const self: any;
self.scmSlangRunnerPlugin = runnerPlugin;
self.scmSlangConduit = conduit;
