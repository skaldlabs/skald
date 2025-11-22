import { useTheme } from '@/components/ThemeProvider'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SidebarMenuItem, useSidebar } from '@/components/ui/sidebar'
import { isSelfHostedDeploy } from '@/config'
import { useAuthStore } from '@/stores/authStore'
import { ChevronsUpDown, CreditCard, Hotel, GlobeLock, LogOut, Moon, Sun } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export const UserMenu = () => {
    const user = useAuthStore((state) => state.user)
    const logout = useAuthStore((state) => state.logout)
    const { theme, toggleTheme } = useTheme()
    const { isMobile } = useSidebar()

    const navigate = useNavigate()
    const userMenuItems: { key: string; icon: React.ReactNode; label: string; hasAccess: () => boolean }[] = [
        {
            key: '/organization/subscription',
            icon: <CreditCard className="size-4" />,
            label: 'Plan & Billing',
            hasAccess: () => !isSelfHostedDeploy,
        },
        {
            key: '/organization',
            icon: <Hotel className="size-4" />,
            label: 'Organization',
            hasAccess: () => true,
        },
        {
            key: '/admin',
            icon: <GlobeLock className="size-4" />,
            label: 'Admin Area',
            hasAccess: () => user?.is_superuser || false,
        },
    ]

    return (
        <SidebarMenuItem>
            <DropdownMenu modal={false}>
                <DropdownMenuTrigger className="flex items-center gap-2 justify-between w-full my-2 px-2 hover:bg-sidebar-accent rounded-md py-2">
                    <div className="grid flex-1 text-left text-sm leading-tight">
                        {user?.name && <span className="truncate font-medium">{user.name}</span>}
                        {user?.email && <span className="truncate text-xs">{user.email}</span>}
                    </div>
                    <ChevronsUpDown className="ml-auto size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                    side={isMobile ? 'bottom' : 'right'}
                    align="end"
                    sideOffset={4}
                >
                    <DropdownMenuLabel className="p-0 font-normal">
                        <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                {user?.name && <span className="truncate font-medium">{user.name}</span>}
                                {user?.email && <span className="truncate text-xs">{user.email}</span>}
                            </div>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuGroup>
                        {userMenuItems
                            .filter((item) => item.hasAccess())
                            .map((item) => (
                                <DropdownMenuItem className="gap-x-2" key={item.key} onClick={() => navigate(item.key)}>
                                    <span>{item.icon}</span>
                                    {item.label}
                                </DropdownMenuItem>
                            ))}
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                        <DropdownMenuItem onSelect={toggleTheme} className="gap-x-2">
                            {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
                            Toggle theme
                        </DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={logout} className="gap-x-2">
                        <LogOut className="size-4" />
                        Log out
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </SidebarMenuItem>
    )
}
