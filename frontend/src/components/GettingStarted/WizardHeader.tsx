import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useProjectStore } from '@/stores/projectStore'

interface WizardHeaderProps {
    currentStep: number
}

export const WizardHeader = ({ currentStep }: WizardHeaderProps) => {
    const navigate = useNavigate()
    const currentProject = useProjectStore((state) => state.currentProject)

    const skipToEnd = () => {
        if (currentProject) {
            navigate(`/projects/${currentProject.uuid}/memos`)
        }
    }

    return (
        <div className="wizard-header">
            <div className="step-dots">
                {[1, 2, 3, 4].map((step) => (
                    <div
                        key={step}
                        className={`dot ${step === currentStep ? 'active' : ''} ${step < currentStep ? 'complete' : ''}`}
                    />
                ))}
            </div>

            <Button variant="ghost" size="sm" onClick={skipToEnd} className="skip-button">
                Skip <X className="ml-1 h-4 w-4" />
            </Button>
        </div>
    )
}
