import { Check } from 'lucide-react'
import './GettingStarted.scss'

interface ProgressBarProps {
    currentStep: number // 1, 2, or 3
    stepsCompleted: {
        apiKey: boolean
        memo: boolean
        chat: boolean
    }
}

const steps = [
    { number: 1, label: 'Generate API Key', key: 'apiKey' as const },
    { number: 2, label: 'Create a Memo', key: 'memo' as const },
    { number: 3, label: 'Chat with Memo', key: 'chat' as const },
]

export function ProgressBar({ currentStep, stepsCompleted }: ProgressBarProps) {
    return (
        <div className="progress-bar">
            <div className="progress-bar__content">
                {steps.map((step, index) => {
                    const isCompleted = stepsCompleted[step.key]
                    const isCurrent = step.number === currentStep
                    const isPast = step.number < currentStep

                    return (
                        <div key={step.number} className="progress-bar__step-container">
                            <div className="progress-bar__step-row">
                                {/* Step indicator */}
                                <div
                                    className={`progress-bar__step ${
                                        isCompleted
                                            ? 'progress-bar__step--completed'
                                            : isCurrent
                                              ? 'progress-bar__step--current'
                                              : isPast
                                                ? 'progress-bar__step--past'
                                                : 'progress-bar__step--upcoming'
                                    }`}
                                >
                                    {isCompleted ? (
                                        <Check className="progress-bar__check" size={16} />
                                    ) : (
                                        <span className="progress-bar__number">{step.number}</span>
                                    )}
                                </div>

                                {/* Step label */}
                                <div className="progress-bar__label">
                                    <span
                                        className={`progress-bar__label-text ${
                                            isCompleted || isCurrent ? 'progress-bar__label-text--active' : ''
                                        }`}
                                    >
                                        {step.label}
                                    </span>
                                </div>
                            </div>

                            {/* Connector line (don't show after last step) */}
                            {index < steps.length - 1 && (
                                <div
                                    className={`progress-bar__connector ${
                                        isCompleted ? 'progress-bar__connector--completed' : ''
                                    }`}
                                />
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
