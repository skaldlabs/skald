import { useOnboardingStore } from '@/stores/onboardingStore'
import { WizardHeader } from '@/components/GettingStarted/WizardHeader'
import { MemoCreationStep } from '@/components/GettingStarted/MemoCreationStep'
import { ProcessingExplanationStep } from '@/components/GettingStarted/ProcessingExplanationStep'
import { ChatWithSuggestionsStep } from '@/components/GettingStarted/ChatWithSuggestionsStep'
import '@/components/GettingStarted/OnboardingWizard.scss'

export const OnboardingWizard = () => {
    const currentStep = useOnboardingStore((state) => state.currentStep)

    return (
        <div className="onboarding-wizard-fullpage">
            <WizardHeader currentStep={currentStep} />

            <div className="wizard-content">
                {currentStep === 1 && <MemoCreationStep />}
                {currentStep === 2 && <ProcessingExplanationStep />}
                {currentStep === 3 && <ChatWithSuggestionsStep />}
            </div>
        </div>
    )
}
