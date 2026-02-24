'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'
import { EmailTemplateEditor } from '@/components/email-template-editor'
import { Spinner } from '@/components/ui/spinner'
import { X } from 'lucide-react'

interface RecipientData {
  groupKey: string
  email: string
  sampleData: Record<string, any>
  sampleRows: any[]
  invoiceCount: number
}

interface EmailTemplateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  variables: string[]
  sampleData?: Record<string, any>
  sampleRows?: any[]
  recipients?: RecipientData[]
  onSend: (template: string, subject: string, ccEmails?: string, attachments?: string[]) => Promise<void>
  sending?: boolean
  defaultSubject?: string
}

export function EmailTemplateModal({
  open,
  onOpenChange,
  variables,
  sampleData,
  sampleRows,
  recipients = [],
  onSend,
  sending = false,
  defaultSubject = ''
}: EmailTemplateModalProps) {
  const [template, setTemplate] = useState<string>('')
  const [subject, setSubject] = useState<string>(defaultSubject)
  const [ccEmails, setCcEmails] = useState<string>('')
  const [attachments, setAttachments] = useState<string[]>([])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open && !sending) {
        onOpenChange(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [open, sending, onOpenChange])

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  async function handleSend() {
    await onSend(template, subject, ccEmails, attachments)
  }

  if (!open) return null

  const modalContent = (
    <div className="fixed inset-0 z-9999 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => !sending && onOpenChange(false)}
      />

      {/* Modal */}
      <div className="relative w-[95vw] h-[95vh] bg-background shadow-2xl flex flex-col rounded-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-6 pb-4 border-b shrink-0">
          <h2 className="text-2xl font-semibold">Kirim Email Notifikasi</h2>
          <button
            onClick={() => !sending && onOpenChange(false)}
            disabled={sending}
            className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary"
          >
            <X className="h-6 w-6" />
            <span className="sr-only">Close</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto px-8 py-6">
          <EmailTemplateEditor
            variables={variables}
            sampleData={sampleData}
            sampleRows={sampleRows}
            recipients={recipients}
            onSave={setTemplate}
            subject={subject}
            onSubjectChange={setSubject}
            ccEmails={ccEmails}
            onCcEmailsChange={setCcEmails}
            attachments={attachments}
            onAttachmentsChange={setAttachments}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-8 pb-6 pt-4 border-t shrink-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={sending}
          >
            Batal
          </Button>
          <Button
            onClick={handleSend}
            disabled={sending || !template}
          >
            {sending && <Spinner className="mr-2" />}
            {sending ? 'Mengirim...' : 'Kirim Email'}
          </Button>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
