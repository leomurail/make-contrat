interface Step {
  title: string
  shortTitle?: string
  description?: string
}

interface Props {
  steps: Step[]
  currentStep: number
  onSelectStep: (index: number) => void
}

export function StepWizard({ steps, currentStep, onSelectStep }: Props) {
  const progressPercent = Math.round(((currentStep + 1) / steps.length) * 100)

  return (
    <div className="stepper-wrapper">
      <div className="stepper-track-bg">
        <div
          className="stepper-track-fill"
          style={{ width: `${progressPercent}%` }}
          aria-hidden="true"
        />
      </div>

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
              title={step.title}
            >
              <span className="step-indicator">
                {isPassed ? (
                  <svg
                    className="step-check-icon"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="3.5 8.5 6.5 11.5 12.5 4.5" />
                  </svg>
                ) : (
                  idx + 1
                )}
              </span>
              <span className="step-label">
                <span className="step-index-label">Étape {idx + 1}</span>
                <span className="step-title">{step.shortTitle || step.title}</span>
              </span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}

