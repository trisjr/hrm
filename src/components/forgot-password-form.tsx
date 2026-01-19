import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Link } from '@tanstack/react-router'
import type { RequestPasswordResetInput } from '@/lib/auth.schemas'
import { requestPasswordResetSchema } from '@/lib/auth.schemas'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { requestPasswordResetFn } from '@/server/auth.server'
import React from 'react'

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  // const router = useRouter() // Unused
  const form = useForm<RequestPasswordResetInput>({
    resolver: zodResolver(requestPasswordResetSchema),
    defaultValues: {
      email: '',
    },
  })

  async function onSubmit(values: RequestPasswordResetInput) {
    try {
      const result = await requestPasswordResetFn({ data: values })
      toast.success(result.message)
      // Optional: Navigate to login after success or keep them here to check email
      // Acknowledging the spec saying just show message.
      form.reset()
    } catch (error: any) {
      toast.error(error.message || 'Something went wrong')
    }
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Forgot Password</CardTitle>
          <CardDescription>
            Enter your email to reset your password
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="m@example.com"
                        type="email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? 'Sending...' : 'Send Reset Link'}
              </Button>
              <div className="text-center text-sm">
                <Link to="/login" className="underline underline-offset-4">
                  Back to Login
                </Link>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
