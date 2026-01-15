import React from 'react'
import { cn } from '@/lib/utils'

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
    <div className={cn('container mx-auto', className)}>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Sidebar - Takes up 4/12 columns on medium screens and up */}
        <div className="md:col-span-4 lg:col-span-4 space-y-6">{sidebar}</div>

        {/* Main Content - Takes up 8/12 columns on medium screens and up */}
        <div className="md:col-span-8 lg:col-span-8 space-y-6">{content}</div>
      </div>
    </div>
  )
}
