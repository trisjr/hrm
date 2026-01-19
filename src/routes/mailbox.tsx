import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getMailboxLogsFn } from '@/server/mailbox.server'
import { useDebounce } from '@/hooks/use-debounce'
import { Input } from '@/components/ui/input'
import { format } from 'date-fns'
import { 
  Search, 
  Mail, 
  Inbox, 
  Clock, 
  User, 
  Loader2,
  MailOpen
} from 'lucide-react'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/mailbox')({
  component: MailboxTrackerPage,
})

function MailboxTrackerPage() {
  const [searchEmail, setSearchEmail] = useState('')
  const [selectedMailId, setSelectedMailId] = useState<number | null>(null)
  
  // Proper debounce for network request
  const debouncedEmail = useDebounce(searchEmail, 500)

  const { data: emails, isLoading } = useQuery({
    queryKey: ['mailbox-logs', debouncedEmail],
    queryFn: () => getMailboxLogsFn({ data: { recipientEmail: debouncedEmail } }),
    // Luôn luôn enabled để hiện full log khi mới vào trang
  })

  const selectedMail = emails?.find(m => m.id === selectedMailId)

  return (
    <div className="flex flex-col h-screen p-4 lg:p-6 gap-6 overflow-hidden bg-slate-50/50">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
            <Inbox className="w-8 h-8 text-primary" />
            Mailbox Tracker
          </h1>
          <p className="text-muted-foreground mt-1">
            Debug and track emails sent to specific recipients.
          </p>
        </div>

        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search recipient email..."
            className="pl-9 h-11 bg-white"
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
          />
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-0 min-h-0 bg-white rounded-xl border shadow-lg overflow-hidden">
        
        {/* Left: Email List (4/12) */}
        <div className="md:col-span-4 border-r flex flex-col h-full bg-slate-50/30">
          <div className="p-4 border-b bg-white/80 backdrop-blur-sm shrink-0">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              Inbox {emails ? `(${emails.length})` : ''}
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center p-12 text-muted-foreground gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm font-medium">Fetching logs...</p>
              </div>
            ) : !emails || emails.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-muted-foreground text-center gap-4">
                <div className="p-4 bg-slate-100 rounded-full">
                  <Mail className="w-10 h-10 opacity-20" />
                </div>
                <div>
                   <p className="font-medium text-gray-900">No emails found</p>
                   <p className="text-sm px-4">Wait for system to send emails or search specifically.</p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {emails.map((mail) => (
                  <button
                    key={mail.id}
                    onClick={() => setSelectedMailId(mail.id)}
                    className={cn(
                      "w-full text-left p-4 transition-all hover:bg-white group relative border-l-4 border-transparent",
                      selectedMailId === mail.id && "bg-white border-l-primary shadow-sm z-10"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={cn(
                        "text-[10px] font-bold px-1.5 py-0.5 rounded",
                        mail.status === 'SENT' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      )}>
                        {mail.status}
                      </span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {mail.sentAt ? format(new Date(mail.sentAt), 'HH:mm dd/MM') : 'N/A'}
                      </span>
                    </div>
                    <div className="font-bold text-sm text-gray-900 line-clamp-1 pr-4">
                      {mail.subject}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 line-clamp-1 italic">
                      {mail.recipientEmail}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Detail View (8/12) */}
        <div className="md:col-span-8 flex flex-col h-full bg-white relative">
          {!selectedMail ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-6">
               <div className="p-8 bg-slate-50 rounded-full border border-dashed animate-pulse">
                <MailOpen className="w-16 h-16 opacity-10" />
               </div>
               <p className="text-lg font-medium opacity-50">Select an email to view content</p>
            </div>
          ) : (
            <div className="flex flex-col h-full overflow-hidden">
               {/* Detail Header */}
               <div className="p-6 border-b shrink-0 bg-white z-10 shadow-sm">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <h2 className="text-2xl font-bold text-gray-900 leading-tight">
                        {selectedMail.subject}
                    </h2>
                  </div>

                  <div className="flex flex-wrap gap-y-3 gap-x-6 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <User className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase text-gray-400 font-bold leading-none mb-1">Recipient</p>
                            <p className="font-medium text-gray-900">{selectedMail.recipientEmail}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                            <Clock className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase text-gray-400 font-bold leading-none mb-1">Date Sent</p>
                            <p className="font-medium text-gray-900">
                                {selectedMail.sentAt ? format(new Date(selectedMail.sentAt), 'MMM dd, yyyy HH:mm:ss') : 'N/A'}
                            </p>
                        </div>
                    </div>
                  </div>
               </div>

               {/* Detail Body (HTML) */}
               <div className="flex-1 overflow-y-auto p-6 lg:p-10 bg-slate-50 cursor-default">
                  <div className="max-w-4xl mx-auto">
                    {selectedMail.body ? (
                       <div 
                         className="prose prose-slate max-w-none bg-white p-8 lg:p-12 rounded-xl shadow-md border border-slate-100"
                         dangerouslySetInnerHTML={{ __html: selectedMail.body }}
                       />
                    ) : (
                       <div className="italic text-muted-foreground text-center py-12">
                         No HTML body content found.
                       </div>
                    )}
                    
                    {selectedMail.errorMessage && (
                        <div className="mt-8 p-4 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm">
                            <p className="font-bold flex items-center gap-2 mb-1">
                                <AlertCircle className="w-4 h-4" /> Error Log:
                            </p>
                            {selectedMail.errorMessage}
                        </div>
                    )}
                  </div>
               </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

function AlertCircle({ className }: { className?: string }) {
    return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
}
