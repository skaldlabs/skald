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
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { isSelfHostedDeploy } from '@/config'
import { useAuthStore } from '@/stores/authStore'
import { CreditCard, Hotel, GlobeLock, LogOut, Moon, Sun, EllipsisVertical, Rocket } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export const UserMenu = () => {
    const user = useAuthStore((state) => state.user)
    const logout = useAuthStore((state) => state.logout)
    const { theme, toggleTheme } = useTheme()
    const { isMobile } = useSidebar()

    const navigate = useNavigate()

    const getUserInitials = () => {
        if (user?.name) {
            const names = user.name.split(' ')
            if (names.length >= 2) {
                return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
            }
            return user.name.substring(0, 2).toUpperCase()
        }
        if (user?.email) {
            return user.email.substring(0, 2).toUpperCase()
        }
        return 'U'
    }
    const userMenuItems: { key: string; icon: React.ReactNode; label: string; hasAccess: () => boolean }[] = [
        {
            key: '/projects/get-started',
            icon: <Rocket className="size-4" />,
            label: 'Onboarding',
            hasAccess: () => true,
        },
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
                <DropdownMenuTrigger className="flex items-center gap-2 justify-between w-full px-2 hover:bg-sidebar-accent rounded-md py-2">
                    <Avatar className="h-8 w-8 rounded-lg">
                        <AvatarImage src={user?.profile_picture || ''} alt={user?.name || user?.email || ''} />
                        <AvatarFallback className="rounded-lg">{getUserInitials()}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col gap-1 text-left text-sm leading-tight">
                        {user?.name && <span className="truncate font-medium">{user.name}</span>}
                        {user?.email && <span className="truncate text-xs text-muted-foreground">{user.email}</span>}
                    </div>
                    <EllipsisVertical className="ml-auto size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                    side={isMobile ? 'bottom' : 'right'}
                    align="end"
                    sideOffset={4}
                >
                    <DropdownMenuLabel className="p-0 font-normal">
                        <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                            <Avatar className="h-8 w-8 rounded-lg">
                                <AvatarImage src={user?.profile_picture || ''} alt={user?.name || user?.email || ''} />
                                <AvatarFallback className="rounded-lg">{getUserInitials()}</AvatarFallback>
                            </Avatar>

                            <div className="flex flex-col gap-0.5 text-left text-sm leading-tight px-1">
                                {user?.name && <span className="truncate font-medium">{user.name}</span>}
                                {user?.email && (
                                    <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                                )}
                            </div>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
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
