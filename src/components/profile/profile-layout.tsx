import React from 'react'
import { cn } from '@/lib/utils'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb.tsx'
import { Link } from '@tanstack/react-router'

interface ProfileLayoutProps {
  sidebar: React.ReactNode
  content: React.ReactNode
  className?: string
}

export function ProfileLayout({
  sidebar,
  content,
  className,
}: ProfileLayoutProps) {
  return (
    <div className={cn('container mx-auto space-y-6', className)}>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <Link to="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Profile</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Sidebar - Takes up 4/12 columns on medium screens and up */}
        <div className="md:col-span-4 lg:col-span-4 space-y-6">{sidebar}</div>

        {/* Main Content - Takes up 8/12 columns on medium screens and up */}
        <div className="md:col-span-8 lg:col-span-8 space-y-6">{content}</div>
      </div>
    </div>
  )
}
