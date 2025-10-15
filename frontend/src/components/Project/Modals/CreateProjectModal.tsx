import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProjectStore } from '@/stores/projectStore'
import { useOnboardingStore } from '@/stores/onboardingStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface CreateProjectModalProps {
    isOpen: boolean
    onClose: () => void
}

export const CreateProjectModal = ({ isOpen, onClose }: CreateProjectModalProps) => {
    const navigate = useNavigate()
    const createProject = useProjectStore((state) => state.createProject)
    const resetOnboarding = useOnboardingStore((state) => state.reset)
    const [newProjectName, setNewProjectName] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleCreateProject = async () => {
        if (!newProjectName.trim()) {
            return
        }

        setIsSubmitting(true)
        const newProject = await createProject(newProjectName.trim())
        setIsSubmitting(false)

        if (newProject) {
            resetOnboarding()
            onClose()
            setNewProjectName('')
            navigate(`/projects/${newProject.uuid}/get-started`)
        }
    }

    const handleClose = () => {
        onClose()
        setNewProjectName('')
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create New Project</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="project-name">Project Name</Label>
                        <Input
                            id="project-name"
                            placeholder="Enter project name"
                            value={newProjectName}
                            onChange={(e) => setNewProjectName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && newProjectName.trim()) {
                                    handleCreateProject()
                                }
                            }}
                            maxLength={255}
                            autoFocus
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleCreateProject} disabled={!newProjectName.trim() || isSubmitting}>
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            'Create'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
