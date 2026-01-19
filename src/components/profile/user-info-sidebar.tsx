import {
  AlertTriangle,
  Briefcase,
  Calendar,
  Edit2,
  Hash,
  Mail,
  MapPin,
  Phone,
} from 'lucide-react'
import { format } from 'date-fns'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge.tsx'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ProfileEditDialog } from './profile-edit-dialog'
import { useState } from 'react'

interface UserInfoSidebarProps {
  user: {
    employeeCode: string
    email: string
    phone?: string | null
    role?: { roleName: string } | null
    profile?: {
      fullName: string
      avatarUrl?: string | null
      address?: string | null
      dob?: string | null
      gender?: string | null
      joinDate?: string | null
      unionJoinDate?: string | null
      unionPosition?: string | null
      idCardNumber?: string | null
    } | null
    careerBand?: {
      title: string
    } | null
  }
  pendingRequest?: {
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | null
  } | null
}

export function UserInfoSidebar({
  user,
  pendingRequest,
}: UserInfoSidebarProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const { profile, employeeCode, email, phone, careerBand } = user
  const initials =
    profile?.fullName
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'VN'

  return (
    <div className="flex flex-col gap-6 rounded-lg p-6 border">
      {/* Header Profile Card */}
      <div className="flex flex-col items-center text-center">
        <Avatar className="h-32 w-32 border-4 border-background shadow-lg mb-4">
          <AvatarImage
            src={profile?.avatarUrl || ''}
            alt={profile?.fullName}
            className="object-cover"
          />
          <AvatarFallback className="text-3xl">{initials}</AvatarFallback>
        </Avatar>
        <h2 className="text-2xl font-bold tracking-tight">
          {profile?.fullName}
        </h2>
        <p className="text-muted-foreground font-medium">#{employeeCode}</p>
        <Badge
          variant="secondary"
          className="bg-blue-500 text-white dark:bg-blue-600 mb-4"
        >
          {careerBand?.title ||
            user.role?.roleName
              .toLowerCase()
              .replace(/\b\w/g, (l) => l.toUpperCase())}
        </Badge>

        {pendingRequest ? (
          <Alert className="border-yellow-500/50 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">
            <AlertTriangle className="h-4 w-4 stroke-yellow-600 dark:stroke-yellow-400" />
            <AlertTitle>Update Pending</AlertTitle>
            <AlertDescription>
              Your profile update request is waiting for approval.
            </AlertDescription>
          </Alert>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => setIsEditDialogOpen(true)}
          >
            <Edit2 className="mr-2 h-4 w-4" />
            Edit Profile
          </Button>
        )}
      </div>

      <ProfileEditDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        currentUser={{
          fullName: profile?.fullName || '',
          dob: profile?.dob,
          gender: profile?.gender,
          idCardNumber: profile?.idCardNumber,
          address: profile?.address,
          joinDate: profile?.joinDate,
          unionJoinDate: profile?.unionJoinDate,
          unionPosition: profile?.unionPosition,
          avatarUrl: profile?.avatarUrl,
        }}
      />

      <Separator />

      {/* About Section */}
      <div className="space-y-3">
        <h3 className="font-semibold text-lg">About</h3>
        <div className="space-y-3 text-sm">
          {phone && (
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{phone}</span>
            </div>
          )}
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="truncate" title={email}>
              {email}
            </span>
          </div>
        </div>
      </div>

      <Separator />

      {/* Address Section */}
      {profile?.address && (
        <div className="space-y-3">
          <h3 className="font-semibold text-lg">Address</h3>
          <div className="flex items-start gap-3 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
            <span>{profile.address}</span>
          </div>
        </div>
      )}

      <Separator />

      {/* Employee Details Section */}
      <div className="space-y-3">
        <h3 className="font-semibold text-lg">Employee details</h3>
        <div className="space-y-3 text-sm">
          {profile?.dob && (
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                Date of birth: {format(new Date(profile.dob), 'MMM dd, yyyy')}
              </span>
            </div>
          )}
          {profile?.idCardNumber && (
            <div className="flex items-center gap-3">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <span>National ID: {profile.idCardNumber}</span>
            </div>
          )}
          {careerBand?.title && (
            <div className="flex items-center gap-3">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <span>Title: {careerBand.title}</span>
            </div>
          )}
          {profile?.joinDate && (
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                Hire date: {format(new Date(profile.joinDate), 'MMM dd, yyyy')}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
