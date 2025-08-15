import { type InjectionKey, type Ref } from "vue";

export const STEPPER_INJECTION_KEY = Symbol("stepper") as InjectionKey<{
  steps: number;
  currentStep: Ref<number>;
  isStepActive: (step: number) => boolean;
  isStepCompleted: (step: number) => boolean;
}>;
