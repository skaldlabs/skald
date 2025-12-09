import { ProjectSwitcher } from '@/components/AppLayout/Sider/ProjectSwitcher'
import { UsageTracker } from '@/components/AppLayout/Sider/UsageTracker'
import { UserMenu } from '@/components/AppLayout/Sider/UserMenu'

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from '@/components/ui/sidebar'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { isSelfHostedDeploy } from '@/config'
import { useAuthStore, UserDetails } from '@/stores/authStore'
import { useProjectStore } from '@/stores/projectStore'
import { BookOpen, File, FlaskConical, List, MessageSquare, Search, Settings, Zap, GraduationCap } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'

interface MenuItem {
    key: string
    icon: React.ReactNode
    label: string
    hasAccess: (user: UserDetails | null) => boolean
    onClick?: () => void
    children?: MenuItem[]
    isParent?: boolean
}

export const Sider = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const user = useAuthStore((state) => state.user)
    const currentProject = useProjectStore((state) => state.currentProject)
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false)

    const mainMenuItems: Record<string, MenuItem[]> = {
        Project: [
            {
                key: '/projects/get-started',
                icon: <GraduationCap className="h-4 w-4" />,
                label: 'API Getting Started',
                hasAccess: () => true,
            },
            {
                key: `/projects/${currentProject?.uuid}/memos`,
                icon: <File className="h-4 w-4" />,
                label: 'Ingestion',
                hasAccess: () => true,
            },
            {
                key: 'retrieval',
                icon: <Zap className="h-4 w-4" />,
                label: 'Retrieval',
                hasAccess: () => true,
                isParent: true,
                children: [
                    {
                        key: `/projects/${currentProject?.uuid}/playground/chat`,
                        icon: <MessageSquare className="h-4 w-4" />,
                        label: 'Chat',
                        hasAccess: () => true,
                    },
                    {
                        key: `/projects/${currentProject?.uuid}/playground/search`,
                        icon: <Search className="h-4 w-4" />,
                        label: 'Search',
                        hasAccess: () => true,
                    },
                ],
            },
            {
                key: 'evaluate',
                icon: <FlaskConical className="h-4 w-4" />,
                label: 'Evaluate (Alpha)',
                hasAccess: () => true,
                isParent: true,
                children: [
                    {
                        key: `/projects/${currentProject?.uuid}/evaluate/experiments`,
                        icon: <FlaskConical className="h-4 w-4" />,
                        label: 'Experiments',
                        hasAccess: () => true,
                    },
                    {
                        key: `/projects/${currentProject?.uuid}/evaluate/datasets`,
                        icon: <FlaskConical className="h-4 w-4" />,
                        label: 'Datasets',
                        hasAccess: () => true,
                    },
                ],
            },
            {
                key: `/projects/${currentProject?.uuid}/chats`,
                icon: <List className="h-4 w-4" />,
                label: 'Agent chats',
                hasAccess: () => true,
            },
            {
                key: `/projects/${currentProject?.uuid}/settings`,
                icon: <Settings className="h-4 w-4" />,
                label: 'Settings',
                hasAccess: () => true,
            },
            {
                key: 'https://docs.useskald.com',
                icon: <BookOpen className="h-4 w-4" />,
                label: 'Documentation ↗',
                hasAccess: () => true,
                onClick: () => window.open('https://docs.useskald.com', '_blank', 'noopener,noreferrer'),
            },
        ],
    }

    const handleMenuClick = (key: string, onClick?: () => void) => {
        if (onClick) {
            onClick()
            return
        }

        navigate(key)
    }

    return (
        <Sidebar className="border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <SidebarHeader className="border-b p-2">
                <ProjectSwitcher />
            </SidebarHeader>
            <SidebarContent className="px-2 py-2">
                {Object.entries(mainMenuItems).map(([groupName, items]) => {
                    const accessibleItems = items.filter((item) => item.hasAccess(user))

                    if (accessibleItems.length === 0) return null

                    return (
                        <SidebarGroup key={groupName}>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    {accessibleItems.map((item) => (
                                        <div key={item.key}>
                                            <SidebarMenuItem>
                                                <SidebarMenuButton
                                                    isActive={!item.isParent && location.pathname === item.key}
                                                    onClick={() =>
                                                        !item.isParent && handleMenuClick(item.key, item.onClick)
                                                    }
                                                    className={`w-full justify-start ${item.isParent ? 'cursor-default' : 'cursor-pointer'}`}
                                                >
                                                    {item.icon}
                                                    <span className="ml-2">{item.label}</span>
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>
                                            {item.children && (
                                                <SidebarMenuSub>
                                                    {item.children
                                                        .filter((child) => child.hasAccess(user))
                                                        .map((child) => (
                                                            <SidebarMenuSubItem key={child.key} className="ml-1.75">
                                                                <SidebarMenuSubButton
                                                                    isActive={location.pathname === child.key}
                                                                    onClick={() =>
                                                                        handleMenuClick(child.key, child.onClick)
                                                                    }
                                                                    className="w-full justify-start cursor-pointer"
                                                                >
                                                                    {child.label}
                                                                </SidebarMenuSubButton>
                                                            </SidebarMenuSubItem>
                                                        ))}
                                                </SidebarMenuSub>
                                            )}
                                        </div>
                                    ))}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>
                    )
                })}
            </SidebarContent>

            <div className="px-4 py-2 text-xs text-muted-foreground text-center">
                <a href="https://pedrique.useskald.com" target="_blank" className="hover:underline cursor-pointer">
                    Talk to a founder
                </a>
            </div>

            <SidebarFooter className="border-t p-0">
                <SidebarGroup>
                    <SidebarGroupContent className="flex flex-col gap-2">
                        {isSelfHostedDeploy ? (
                            <div className="p-2">
                                <Button
                                    onClick={() => setIsUpgradeModalOpen(true)}
                                    size="sm"
                                    className="w-full"
                                    variant="default"
                                >
                                    Upgrade
                                </Button>
                            </div>
                        ) : (
                            <div className="p-2">
                                <UsageTracker />
                            </div>
                        )}

                        <SidebarMenu>
                            <UserMenu />
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarFooter>

            <Dialog open={isUpgradeModalOpen} onOpenChange={setIsUpgradeModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Upgrade to the Enterprise Edition</DialogTitle>
                        <DialogDescription>
                            You're currently running the MIT-licensed version of Skald. If you need advanced features or
                            a more scalable deployment our Enterprise Edition plan might be a good fit for you.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsUpgradeModalOpen(false)}>
                            Close
                        </Button>
                        <Button
                            onClick={() => {
                                setIsUpgradeModalOpen(false)
                                window.open('https://useskald.com/pricing#on-prem', '_blank')
                            }}
                        >
                            Read more
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Sidebar>
    )
}
