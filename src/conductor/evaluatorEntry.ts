import { initialise } from "@sourceacademy/conductor/runner";
import SchemeEvaluator from "./SchemeEvaluator";

const { runnerPlugin, conduit } = initialise(SchemeEvaluator);

declare const self: any;
self.scmSlangRunnerPlugin = runnerPlugin;
self.scmSlangConduit = conduit;
