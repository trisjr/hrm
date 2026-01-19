/**
 * Mailbox Server API
 */
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

const getMailboxSchema = z.object({
  recipientEmail: z.string(),
})

export const getMailboxLogsFn = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => getMailboxSchema.parse(data))
  .handler(async (ctx) => {
    const { getMailboxLogsImpl } = await import('./mailbox.impl')
    return getMailboxLogsImpl(ctx.data)
  })
