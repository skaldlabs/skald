import { MessageSquare, BarChart3, LogOut, Hotel, Search, Sun, Moon, Puzzle } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { OrganizationAccessLevel, useAuthStore, UserDetails } from '@/stores/authStore'
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarHeader,
} from '@/components/ui/sidebar'
import { useTheme } from '@/components/ThemeProvider'
import { ProjectSelector } from '@/components/AppLayout/ProjectSelector'

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

    const mainMenuItems: Record<string, MenuItem[]> = {
        Project: [
            {
                key: '/get-started',
                icon: <BarChart3 className="h-4 w-4" />,
                label: 'Get Started',
                hasAccess: () => true,
            },
            {
                key: '/settings',
                icon: <Puzzle className="h-4 w-4" />,
                label: 'Settings',
                hasAccess: () => true,
            },
        ],
        Playground: [
            {
                key: '/chat',
                icon: <MessageSquare className="h-4 w-4" />,
                label: 'Chat',
                hasAccess: () => true,
            },
            {
                key: '/search',
                icon: <Search className="h-4 w-4" />,
                label: 'Search',
                hasAccess: () => true,
            },
        ],
    }

    const configMenuItems: MenuItem[] = [
        {
            key: '/organization',
            icon: <Hotel className="h-4 w-4" />,
            label: 'Organization',
            hasAccess: () =>
                !!user &&
                user?.access_levels.organization_access_levels[user?.current_organization_uuid] >=
                    OrganizationAccessLevel.SUPER_ADMIN,
        },
    ]

    const handleMenuClick = (key: string, onClick?: () => void) => {
        if (onClick) {
            onClick()
            return
        }

        navigate(key)
    }

    return (
        <Sidebar className="border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <SidebarHeader className="border-b">
                <ProjectSelector />
            </SidebarHeader>
            <SidebarContent className="px-3 py-2">
                {Object.entries(mainMenuItems).map(([groupName, items]) => {
                    const accessibleItems = items.filter((item) => item.hasAccess(user))

                    if (accessibleItems.length === 0) return null

                    return (
                        <SidebarGroup key={groupName}>
                            <SidebarGroupLabel className="text-xs font-medium text-muted-foreground px-2 py-1">
                                {groupName}
                            </SidebarGroupLabel>
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

            <SidebarFooter className="border-t px-3 py-2">
                <SidebarGroup>
                    <SidebarGroupLabel className="text-xs font-medium text-muted-foreground px-2 py-1">
                        Configuration
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
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
