import * as React from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { format } from 'date-fns'
import type { UpdateUserInput } from '@/lib/user.schemas'
import { updateUserSchema } from '@/lib/user.schemas'
import { updateUserFn } from '@/server/users.server'
import type { UserResponse } from '@/lib/user.types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/common/date-picker'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface EditUserDialogProps {
  user: UserResponse | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function EditUserDialog({
  user,
  open,
  onOpenChange,
  onSuccess,
}: EditUserDialogProps) {
  const form = useForm<UpdateUserInput>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      email: '',
      phone: '',
      status: 'ACTIVE',
      profile: {
        fullName: '',
        dob: undefined,
        gender: undefined,
        idCardNumber: undefined,
        address: undefined,
        joinDate: undefined,
        unionJoinDate: undefined,
        unionPosition: undefined,
        avatarUrl: undefined,
      },
    },
  })

  // Reset form when user changes
  React.useEffect(() => {
    if (user && open) {
      form.reset({
        email: user.email,
        phone: user.phone || '',
        status: user.status as any,
        profile: {
          fullName: user.profile?.fullName || '',
          dob: user.profile?.dob || undefined,
          gender: user.profile?.gender || undefined,
          idCardNumber: user.profile?.idCardNumber || undefined,
          address: user.profile?.address || undefined,
          joinDate: user.profile?.joinDate || undefined,
          unionJoinDate: user.profile?.unionJoinDate || undefined,
          unionPosition: user.profile?.unionPosition || undefined,
          avatarUrl: user.profile?.avatarUrl || undefined,
        },
      })
    }
  }, [user, open, form])

  async function onSubmit(values: UpdateUserInput) {
    if (!user) return

    try {
      await updateUserFn({ data: { id: user.id.toString(), ...values } })
      toast.success('User updated successfully')
      onOpenChange(false)
      onSuccess?.()
    } catch (error: any) {
      toast.error('Failed to update user', {
        description: error.message || 'An error occurred',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-150">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user information and profile details.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Account Information Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Account Information</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <FormLabel>Employee Code</FormLabel>
                  <Input value={user?.employeeCode} disabled className="bg-muted" />
                </div>

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ACTIVE">Active</SelectItem>
                          <SelectItem value="INACTIVE">Inactive</SelectItem>
                          <SelectItem value="ON_LEAVED">On Leave</SelectItem>
                          <SelectItem value="RETIRED">Retired</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Email <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="user@example.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder="+84 123 456 789"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Profile Information Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Profile Information</h3>
              <FormField
                control={form.control}
                name="profile.fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Full Name <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="profile.dob"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Birth</FormLabel>
                      <FormControl>
                        <DatePicker
                          value={
                            field.value ? new Date(field.value) : undefined
                          }
                          onChange={(date) =>
                            field.onChange(
                              date ? format(date, 'yyyy-MM-dd') : undefined,
                            )
                          }
                          placeholder="Select date of birth"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="profile.gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Male/Female/Other"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="profile.idCardNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ID Card Number</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="123456789"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="profile.address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="123 Main St, City, Country"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="profile.joinDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Join Date</FormLabel>
                    <FormControl>
                      <DatePicker
                        value={field.value ? new Date(field.value) : undefined}
                        onChange={(date) =>
                          field.onChange(
                            date ? format(date, 'yyyy-MM-dd') : undefined,
                          )
                        }
                        placeholder="Select join date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
