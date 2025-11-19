import { ProjectSwitcher } from '@/components/AppLayout/Sider/ProjectSwitcher'
import { TalkToFounderModal } from '@/components/AppLayout/Sider/TalkToFounderModal'
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
} from '@/components/ui/sidebar'
import { isSelfHostedDeploy } from '@/config'
import { useAuthStore, UserDetails } from '@/stores/authStore'
import { useProjectStore } from '@/stores/projectStore'
import {
    BookOpen,
    CreditCard,
    Files,
    FlaskConical,
    GlobeLock,
    Hotel,
    List,
    MessageSquare,
    Rocket,
    Settings,
} from 'lucide-react'
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

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
    const [talkToFounderModalOpen, setTalkToFounderModalOpen] = useState(false)

    const mainMenuItems: Record<string, MenuItem[]> = {
        Project: [
            {
                key: `/projects/${currentProject?.uuid}/get-started`,
                icon: <Rocket className="h-4 w-4" />,
                label: 'Get Started',
                hasAccess: () => true,
            },
            {
                key: `/projects/${currentProject?.uuid}/memos`,
                icon: <Files className="h-4 w-4" />,
                label: 'Memos',
                hasAccess: () => true,
            },
            {
                key: `/projects/${currentProject?.uuid}/playground`,
                icon: <MessageSquare className="h-4 w-4" />,
                label: 'Playground',
                hasAccess: () => true,
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
        ],
    }

    const defaultConfigMenuItems: MenuItem[] = [
        {
            key: '/organization',
            icon: <Hotel className="h-4 w-4" />,
            label: 'Organization',
            hasAccess: () => true,
        },
        {
            key: 'https://docs.useskald.com',
            icon: <BookOpen className="h-4 w-4" />,
            label: 'Documentation ↗',
            hasAccess: () => true,
            onClick: () => window.open('https://docs.useskald.com', '_blank', 'noopener,noreferrer'),
        },
    ]

    const cloudConfigMenuItems: MenuItem[] = [
        {
            key: '/organization/subscription',
            icon: <CreditCard className="h-4 w-4" />,
            label: 'Plan & Billing',
            hasAccess: () => true,
        },
    ]

    const adminConfigMenuItems: MenuItem[] = isSelfHostedDeploy
        ? []
        : [
              {
                  key: '/admin',
                  icon: <GlobeLock className="h-4 w-4" />,
                  label: 'Admin Area',
                  hasAccess: (user) => user?.is_superuser || false,
              },
          ]

    const configMenuItems: MenuItem[] = isSelfHostedDeploy
        ? defaultConfigMenuItems
        : [...defaultConfigMenuItems, ...cloudConfigMenuItems, ...adminConfigMenuItems]

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
            <SidebarContent className="px-3 py-2">
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
                                                <div className="bg-muted/30">
                                                    {item.children
                                                        .filter((child) => child.hasAccess(user))
                                                        .map((child) => (
                                                            <SidebarMenuItem key={child.key}>
                                                                <SidebarMenuButton
                                                                    isActive={location.pathname === child.key}
                                                                    onClick={() =>
                                                                        handleMenuClick(child.key, child.onClick)
                                                                    }
                                                                    className="w-full justify-start cursor-pointer pl-8"
                                                                >
                                                                    {child.label}
                                                                </SidebarMenuButton>
                                                            </SidebarMenuItem>
                                                        ))}
                                                </div>
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
                <button onClick={() => setTalkToFounderModalOpen(true)} className="hover:underline cursor-pointer">
                    Talk to a founder
                </button>
            </div>

            <TalkToFounderModal open={talkToFounderModalOpen} onOpenChange={setTalkToFounderModalOpen} />

            <SidebarFooter className="border-t px-3 py-2">
                <SidebarGroup>
                    <SidebarGroupContent>
                        <div className="mb-3">{!isSelfHostedDeploy && <UsageTracker />}</div>

                        <SidebarMenu>
                            {configMenuItems
                                .filter((item) => item.hasAccess(user))
                                .map((item) => (
                                    <SidebarMenuItem key={item.key}>
                                        <SidebarMenuButton
                                            isActive={location.pathname === item.key}
                                            onClick={() => handleMenuClick(item.key, item.onClick)}
                                            className="w-full justify-start cursor-pointer"
                                        >
                                            {item.icon}
                                            <span className="ml-2">{item.label}</span>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}

                            <UserMenu />
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarFooter>
        </Sidebar>
    )
}
