/**
 * Mailbox Tracking Implementation
 */
import { desc, ilike } from 'drizzle-orm'
import { db } from '@/db'
import { emailLogs } from '@/db/schema'

/**
 * Lấy danh sách email đã gửi cho một địa chỉ cụ thể
 */
export const getMailboxLogsImpl = async (data: { recipientEmail: string }) => {
  const emailQuery = data.recipientEmail?.trim()
  
  const logs = await db.query.emailLogs.findMany({
    where: emailQuery ? ilike(emailLogs.recipientEmail, `%${emailQuery}%`) : undefined,
    orderBy: [desc(emailLogs.sentAt), desc(emailLogs.createdAt)],
    limit: 50,
  })

  return logs
}
