'use client'

import { type Icon } from '@tabler/icons-react'
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { useNavigate, useRouter } from '@tanstack/react-router'

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: Icon
  }[]
}) {
  const router = useRouter()
  const navigate = useNavigate()
  const route = router.state.location

  const handleClick = async (url: string) => {
    await navigate({ to: url })
  }

  const isActive = (url: string) => {
    return route.pathname === url
  }

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item) => (
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
