import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { ArrowRight } from 'lucide-react'
import { useProjectStore } from '@/stores/projectStore'
import { Link } from 'react-router-dom'

interface ReferenceLinkProps {
    index: number
    memo_uuid: string
    memo_title: string
}

export const ReferenceLink = ({ index, memo_uuid, memo_title }: ReferenceLinkProps) => {
    const { currentProject } = useProjectStore()

    if (!currentProject) {
        return <span className="reference-link-fallback">[{index}]</span>
    }

    const memoUrl = `/projects/${currentProject.uuid}/memos/${memo_uuid}`

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <span className="reference-link">
                    <span className="reference-link-text">[{index}]</span>
                </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs p-3 bg-gray-900 border border-gray-700">
                <div className="space-y-2">
                    <div className="text-sm font-semibold text-gray-100">{memo_title}</div>
                    <div className="border-t border-gray-700 pt-2">
                        <Link
                            to={memoUrl}
                            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-200 transition-colors hover:underline"
                        >
                            <span className="font-mono">{memo_uuid.slice(0, 13)}</span>
                            <ArrowRight className="h-3 w-3 flex-shrink-0" />
                        </Link>
                    </div>
                </div>
            </TooltipContent>
        </Tooltip>
    )
}
