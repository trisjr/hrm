'use client'

import {
  IconChartBar,
  IconClipboardList,
  IconClock,
  IconDashboard,
  IconFileText,
  IconMail,
  IconTarget,
  IconUsers,
} from '@tabler/icons-react'
import { useNavigate, useRouter } from '@tanstack/react-router'
import type { Icon } from '@tabler/icons-react'
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { useAuthStore } from '@/store/auth.store'

type RoleName = 'ADMIN' | 'HR' | 'LEADER' | 'DEV'

interface MenuItem {
  title: string
  url: string
  icon?: Icon
  roles: Array<RoleName> // Which roles can see this item
}

// Define all menu items with their role permissions
const ALL_MENU_ITEMS: Array<MenuItem> = [
  // Common items for all authenticated users
  {
    title: 'Dashboard',
    url: '/',
    icon: IconDashboard,
    roles: ['ADMIN', 'HR', 'LEADER', 'DEV'],
  },

  // DEV and above: Timesheet & Requests
  {
    title: 'Timesheet',
    url: '/timesheet',
    icon: IconClock,
    roles: ['ADMIN', 'HR', 'LEADER', 'DEV'],
  },
  {
    title: 'My Requests',
    url: '/requests',
    icon: IconClipboardList,
    roles: ['LEADER', 'DEV'],
  },
  {
    title: 'Competency',
    url: '/competency',
    icon: IconTarget,
    roles: ['ADMIN', 'HR', 'LEADER', 'DEV'],
  },

  // LEADER and above: Team management
  {
    title: 'My Team',
    url: '/team',
    icon: IconUsers,
    roles: ['LEADER'],
  },
  {
    title: 'Team Requests',
    url: '/team/requests',
    icon: IconFileText,
    roles: ['LEADER'],
  },

  // ADMIN/HR only: Full admin features
  {
    title: 'User Management',
    url: '/admin/users',
    icon: IconUsers,
    roles: ['ADMIN', 'HR'],
  },
  {
    title: 'Analytics',
    url: '/admin/analytics',
    icon: IconChartBar,
    roles: ['ADMIN', 'HR'],
  },
  {
    title: 'Email Templates',
    url: '/admin/email-templates',
    icon: IconMail,
    roles: ['ADMIN', 'HR'],
  },
  {
    title: 'Reports',
    url: '/admin/reports',
    icon: IconFileText,
    roles: ['ADMIN', 'HR'],
  },
]

export function NavMain() {
  const router = useRouter()
  const navigate = useNavigate()
  const route = router.state.location
  const { user } = useAuthStore()

  const handleClick = async (url: string) => {
    await navigate({ to: url })
  }

  const isActive = (url: string) => {
    return route.pathname === url
  }

  // Filter menu items based on user role
  const getFilteredMenuItems = (): Array<MenuItem> => {
    const userRole = user?.roleName as RoleName | undefined

    console.log(userRole)

    if (!userRole) {
      // If no role, show minimal menu
      return ALL_MENU_ITEMS.filter((item) => item.url === '/')
    }

    return ALL_MENU_ITEMS.filter((item) => item.roles.includes(userRole))
  }

  const visibleItems = getFilteredMenuItems()

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {visibleItems.map((item) => (
            <SidebarMenuItem key={item.url}>
              <SidebarMenuButton
                className="cursor-pointer"
                isActive={isActive(item.url)}
                tooltip={item.title}
                onClick={() => handleClick(item.url)}
              >
                {item.icon && <item.icon />}
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
