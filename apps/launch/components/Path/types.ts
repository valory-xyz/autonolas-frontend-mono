export type SetPrevStep = () => void;
export type SetNextStep = () => void;

export type StepComponentProps = { onPrev: SetPrevStep; onNext: SetNextStep; isLastStep: boolean };
