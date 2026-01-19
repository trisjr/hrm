'use client'

import type { Icon } from '@tabler/icons-react'
import {
  IconChartBar,
  IconClipboardList,
  IconClock,
  IconDashboard,
  IconFileText,
  IconMail,
  IconTarget,
  IconUserEdit,
  IconUsers,
  IconUsersGroup,
  IconNotes,
  IconCertificate,
  IconInbox,
} from '@tabler/icons-react'
import { useLocation, useNavigate } from '@tanstack/react-router'
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
    title: 'My Assessment',
    url: '/competencies/my-assessment',
    icon: IconTarget,
    roles: ['ADMIN', 'HR', 'LEADER', 'DEV'],
  },
  {
    title: 'Assessment History',
    url: '/competencies/assessments',
    icon: IconFileText,
    roles: ['ADMIN', 'HR', 'LEADER', 'DEV'],
  },
  {
    title: 'My IDP',
    url: '/competencies/idp',
    icon: IconChartBar,
    roles: ['ADMIN', 'HR', 'LEADER', 'DEV'],
  },
  {
    title: 'My Skills',
    url: '/competencies/my-skills',
    icon: IconCertificate,
    roles: ['ADMIN', 'HR', 'LEADER', 'DEV'],
  },
  {
    title: 'My CV',
    url: '/my-cv',
    icon: IconFileText,
    roles: ['ADMIN', 'HR', 'LEADER', 'DEV'],
  },
  {
    title: 'Competency Mgmt',
    url: '/admin/competencies',
    icon: IconTarget,
    roles: ['ADMIN', 'HR'],
  },
  {
    title: 'Competency Analytics',
    url: '/admin/competencies/analytics',
    icon: IconChartBar,
    roles: ['ADMIN', 'HR'],
  },
  {
    title: 'Team Competency Analytics', // This is the existing item for LEADER
    url: '/team/competencies/analytics',
    icon: IconChartBar,
    roles: ['LEADER'],
  },
  {
    title: 'Dev Plans (IDP)',
    url: '/team/idp',
    icon: IconNotes,
    roles: ['LEADER'],
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
  {
    title: 'Team Assessments',
    url: '/team/assessments',
    icon: IconTarget,
    roles: ['LEADER'],
  },
  {
    title: 'Team Competency Analytics',
    url: '/team/competencies/analytics',
    icon: IconChartBar,
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
    title: 'Team Management',
    url: '/admin/teams',
    icon: IconUsersGroup,
    roles: ['ADMIN', 'HR'],
  },
  {
    title: 'Team Analytics',
    url: '/admin/teams/analytics',
    icon: IconChartBar,
    roles: ['ADMIN', 'HR'],
  },
  {
    title: 'Request Management',
    url: '/admin/requests',
    icon: IconClipboardList,
    roles: ['ADMIN', 'HR'],
  },
  {
    title: 'Profile Requests',
    url: '/admin/profile-requests',
    icon: IconUserEdit,
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
    url: '/admin/emails',
    icon: IconMail,
    roles: ['ADMIN', 'HR'],
  },
  {
    title: 'Mailbox Tracker',
    url: '/mailbox',
    icon: IconInbox,
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
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const handleClick = async (url: string) => {
    await navigate({ to: url })
  }

  const isActive = (url: string) => {
    return location.pathname === url
  }

  // Filter menu items based on user role
  const getFilteredMenuItems = (): Array<MenuItem> => {
    const userRole = user?.roleName as RoleName | undefined

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
