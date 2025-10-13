import { useEffect, useState } from 'react'
import { ChevronsUpDown, Plus } from 'lucide-react'
import { useProjectStore } from '@/stores/projectStore'
import { useNavigate } from 'react-router-dom'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getProjectInitials } from '@/components/utils/stringUtils'
import { CreateProjectModal } from '@/components/Project/Modals/CreateProjectModal'

export const ProjectSwitcher = () => {
    const navigate = useNavigate()
    const projects = useProjectStore((state) => state.projects)
    const currentProject = useProjectStore((state) => state.currentProject)
    const setCurrentProject = useProjectStore((state) => state.setCurrentProject)
    const fetchProjects = useProjectStore((state) => state.fetchProjects)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

    useEffect(() => {
        fetchProjects()
    }, [fetchProjects])

    const handleProjectChange = (projectUuid: string) => {
        const project = projects.find((p) => p.uuid === projectUuid)
        if (project) {
            setCurrentProject(project)
            navigate(`/projects/${project.uuid}/memos`)
        }
    }

    const handleAddProject = () => {
        setIsCreateModalOpen(true)
    }

    return (
        <DropdownMenu>
            <CreateProjectModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
            <DropdownMenuTrigger asChild>
                <button className="flex w-full items-center gap-2 rounded-lg p-2 text-left hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                        {getProjectInitials(currentProject?.name || 'Project')}
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold">{currentProject?.name || 'Project'}</span>
                    </div>
                    <ChevronsUpDown className="ml-auto size-4" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                align="start"
                side="bottom"
                sideOffset={4}
            >
                <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">Projects</DropdownMenuLabel>
                {projects.map((project) => (
                    <DropdownMenuItem
                        key={project.uuid}
                        onClick={() => handleProjectChange(project.uuid)}
                        className="gap-2 p-2"
                    >
                        <div className="flex size-6 items-center justify-center rounded-sm border bg-background">
                            {getProjectInitials(project.name)}
                        </div>
                        <span className="flex-1 truncate">{project.name}</span>
                    </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleAddProject} className="gap-2 p-2">
                    <div className="flex size-6 items-center justify-center rounded-md border border-dashed bg-background">
                        <Plus className="size-4" />
                    </div>
                    <span className="text-muted-foreground">Add project</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
