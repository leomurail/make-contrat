interface Step {
  title: string
  shortTitle?: string
}

interface Props {
  steps: Step[]
  currentStep: number
  onSelectStep: (index: number) => void
}

export function StepWizard({ steps, currentStep, onSelectStep }: Props) {
  return (
    <nav className="stepper" aria-label="Étapes du contrat">
      {steps.map((step, idx) => {
        const isCurrent = idx === currentStep
        const isPassed = idx < currentStep
        return (
          <button
            key={idx}
            type="button"
            className={`step-btn ${isCurrent ? 'active' : ''} ${isPassed ? 'completed' : ''}`}
            onClick={() => onSelectStep(idx)}
            aria-current={isCurrent ? 'step' : undefined}
          >
            <span className="step-num">{isPassed ? '✓' : idx + 1}</span>
            <span className="step-title">{step.shortTitle || step.title}</span>
          </button>
        )
      })}
    </nav>
  )
}
