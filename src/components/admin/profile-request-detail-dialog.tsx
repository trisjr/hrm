import { useState } from 'react'
import { format } from 'date-fns'
import { Loader2 } from 'lucide-react'
import { useRouter } from '@tanstack/react-router'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/auth.store'
import {
  approveProfileUpdateRequestFn,
  rejectProfileUpdateRequestFn,
} from '@/server/profile-request.server'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

interface ProfileUpdateRequest {
  id: number
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | null
  user: {
    profile: any
  }
  dataChanges: Record<string, any>
  previousData?: Record<string, any> | null
}

interface ProfileRequestDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  request: ProfileUpdateRequest | null
}

export function ProfileRequestDetailDialog({
  open,
  onOpenChange,
  request,
}: ProfileRequestDetailDialogProps) {
  const router = useRouter()
  const token = useAuthStore((state) => state.token)
  const [isProcessing, setIsProcessing] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)

  if (!request) return null

  const handleApprove = async () => {
    if (!token) return
    try {
      setIsProcessing(true)
      await approveProfileUpdateRequestFn({
        data: { token, data: { requestId: request.id } },
      })
      toast.success('Request Approved', {
        description: 'Profile has been updated successfully.',
      })
      onOpenChange(false)
      router.invalidate()
    } catch (error) {
      toast.error('Failed to Approve', {
        description:
          error instanceof Error ? error.message : 'Unknown error occurred',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!token) return
    if (!rejectionReason.trim()) {
      toast.error('Rejection reason is required')
      return
    }
    try {
      setIsProcessing(true)
      await rejectProfileUpdateRequestFn({
        data: {
          token,
          data: { requestId: request.id, rejectionReason },
        },
      })
      toast.success('Request Rejected', {
        description: 'The request has been rejected.',
      })
      onOpenChange(false)
      router.invalidate()
    } catch (error) {
      toast.error('Failed to Reject', {
        description:
          error instanceof Error ? error.message : 'Unknown error occurred',
      })
    } finally {
      setIsProcessing(false)
      setShowRejectForm(false)
      setRejectionReason('')
    }
  }

  // Helper to format values for display
  const formatValue = (key: string, value: any) => {
    if (value === null || value === undefined) return <span className="text-muted-foreground italic">Empty</span>
    if (key.toLowerCase().includes('date') && value) {
        try {
            return format(new Date(value), 'PPP')
        } catch {
            return String(value)
        }
    }
    return String(value)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Review Profile Update</DialogTitle>
          <DialogDescription>
            Review the changes requested by the user.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="grid grid-cols-2 gap-4 font-semibold text-sm border-b pb-2">
            <div>Field</div>
            <div className="grid grid-cols-2 gap-2">
                <span>Old Value</span>
                <span className="text-blue-600">New Value</span>
            </div>
          </div>
          
          {Object.entries(request.dataChanges).map(([key, newValue]) => {
            // Priority: previousData (snapshot) > user.profile (current DB)
            // Even if previousData is present but key is missing, it means it was null/undefined before.
            const oldValue = request.previousData 
                ? request.previousData[key] 
                : request.user.profile?.[key]
            
            // Skip showing if values are basically same
            if (String(oldValue) === String(newValue)) return null

            return (
              <div key={key} className="grid grid-cols-2 gap-4 text-sm items-center">
                <div className="font-medium capitalize text-muted-foreground">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </div>
                <div className="grid grid-cols-2 gap-2">
                   <div className="break-words bg-muted/50 p-2 rounded line-through text-muted-foreground decoration-red-500/50">
                       {formatValue(key, oldValue)}
                   </div>
                   <div className="break-words bg-blue-50 dark:bg-blue-900/20 p-2 rounded text-blue-700 dark:text-blue-300 font-medium">
                       {formatValue(key, newValue)}
                   </div>
                </div>
              </div>
            )
          })}
        </div>
        
        {showRejectForm && (
            <div className="space-y-2 pt-4 border-t">
                <Label>Reason for Rejection</Label>
                <Textarea 
                    placeholder="Please explain why this request is being rejected..."
                    value={rejectionReason}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRejectionReason(e.target.value)}
                />
            </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          {!showRejectForm ? (
            <>
                <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                {request.status === 'PENDING' && (
                    <div className="flex gap-2 w-full sm:w-auto sm:ml-auto">
                        <Button 
                            variant="destructive" 
                            onClick={() => setShowRejectForm(true)}
                        >
                            Reject
                        </Button>
                        <Button 
                            onClick={handleApprove} 
                            disabled={isProcessing}
                        >
                            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Approve Changes
                        </Button>
                    </div>
                )}
            </>
          ) : (
            <>
                <Button variant="secondary" onClick={() => setShowRejectForm(false)}>Back</Button>
                <div className="flex gap-2 w-full sm:w-auto sm:ml-auto">
                    <Button 
                        variant="destructive" 
                        onClick={handleReject} 
                        disabled={isProcessing || !rejectionReason.trim()}
                    >
                        Confirm Reject
                    </Button>
                </div>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
