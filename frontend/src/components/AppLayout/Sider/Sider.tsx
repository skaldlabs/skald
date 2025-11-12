import {
    MessageSquare,
    Files,
    LogOut,
    Hotel,
    Rocket,
    Sun,
    Moon,
    Settings,
    CreditCard,
    BookOpen,
    GlobeLock,
} from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { useAuthStore, UserDetails } from '@/stores/authStore'
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarHeader,
} from '@/components/ui/sidebar'
import { useTheme } from '@/components/ThemeProvider'
import { ProjectSwitcher } from '@/components/AppLayout/Sider/ProjectSwitcher'
import { useProjectStore } from '@/stores/projectStore'
import { UsageTracker } from '@/components/AppLayout/Sider/UsageTracker'
import { TalkToFounderModal } from '@/components/AppLayout/Sider/TalkToFounderModal'
import { isSelfHostedDeploy } from '@/config'

interface MenuItem {
    key: string
    icon: React.ReactNode
    label: string
    hasAccess: (user: UserDetails | null) => boolean
    onClick?: () => void
}

export const Sider = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const user = useAuthStore((state) => state.user)
    const logout = useAuthStore((state) => state.logout)
    const { theme, toggleTheme } = useTheme()
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

                            {/* Icon buttons row */}
                            <div className="flex justify-center gap-2 px-2 py-1 mt-1">
                                <SidebarMenuButton
                                    onClick={toggleTheme}
                                    className="h-8 w-8 p-0 cursor-pointer flex items-center justify-center"
                                    title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                                >
                                    {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                                </SidebarMenuButton>
                                <SidebarMenuButton
                                    onClick={logout}
                                    className="h-8 w-8 p-0 cursor-pointer flex items-center justify-center"
                                    title="Logout"
                                >
                                    <LogOut className="h-4 w-4" />
                                </SidebarMenuButton>
                            </div>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarFooter>
        </Sidebar>
    )
}
