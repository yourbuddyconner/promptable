import { SequentialChain } from "@chains/SequentialChain";
import { Prompt, PromptVariables } from "@prompts/Prompt";
import { Chain, OpenAI } from "dist";
import { ModelProvider } from "src/model-providers/ModelProvider";
import { z } from "zod";
import { Step, StepInput, StepOutput, RunStepArgs } from "./Step";

interface PromptStepInput extends StepInput {
  text: string;
  variables?: PromptVariables;
}

interface PromptStepOutput extends StepOutput {}

export class PromptStep<
  T extends PromptStepInput,
  J extends PromptStepOutput
> extends Step<T, J> {
  provider: ModelProvider;
  outputName: keyof J;

  calls: RunStepArgs<T, J>[] = [];

  constructor(provider: ModelProvider, outputName: keyof J, name = "Prompt") {
    super(name);
    this.provider = provider;
    this.outputName = outputName;
  }

  async _run(args: RunStepArgs<T, J>) {
    // TODO: just build a prompt with a function instead?
    // maybe pass in prompts?
    const prompt = new Prompt(args.inputs.text, args.inputs.variables || {});

    const completion = await this.provider.generate(prompt);

    const output = { [this.outputName]: completion };

    this.calls.push(args);

    // TODO: How do i remove this cast? this is probably not a good idea
    return output as J;
  }
}

const steps = [
  new PromptStep(new OpenAI(""), "voice")
    .inputs(
      z.object({
        text: z.string(),
        variables: z.any(),
      })
    )
    .outputs(z.object({ voice: z.string() })),
];

const chain = new SequentialChain("First");

chain.run({
  steps,
  inputs: {
    text: "hi",
    variables: {},
  },
  outputs: {},
});