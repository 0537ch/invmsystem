import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import { hasInvoiceColumns, extractTBodyTemplate, generateTableRowFromTemplate, tbodyHasVariable, renderTemplateWithTotals } from '@/lib/email-template'

const MAX_ROWS_PER_SEND = 1000
const MAX_EMAILS_PER_BATCH = 100

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

interface EmailData {
  sender: string
  to: string[]
  cc?: string[]
  subject: string
  message: string
  attachments?: string[]
}

export function useEmailTemplate(people: Array<any>, columnKeys: string[], groupByColumn: string) {
  const [sending, setSending] = useState(false)
  const [templateModalOpen, setTemplateModalOpen] = useState(false)
  const [hasSent, setHasSent] = useState(false)

  const groupedByEmail = useMemo(() => {
    const groups = new Map<string, any[]>()

    if (!people || people.length === 0) {
      return groups
    }

    const emailColumn = columnKeys.find(key =>
      people.some(person => {
        const data = person.data || person
        const val = data[key]
        return typeof val === 'string' && val.includes('@') && val.trim() !== ''
      })
    )

    if (!emailColumn) {
      console.error('❌ No email column found in CSV data')
      console.error('Available columns:', columnKeys)
      return groups
    }

    if (!groupByColumn) {
      console.error('❌ No group by column specified')
      return groups
    }

    people.forEach(person => {
      if (person._childRows && person._childRows.length > 0) {
        const data = person as any
        const emailColumn = columnKeys.find(key =>
          String(data[key]).includes('@')
        )

        if (emailColumn) {
          const email = data[emailColumn] as string
          if (!email || !email.includes('@') || email.trim() === '') {
            console.warn('⚠️ Skipping invalid email:', email)
            return
          }
          if (!groups.has(email)) {
            groups.set(email, data._childRows)
          }
        }
      } else {
        const data = person.data || person
        const emailColumn = columnKeys.find(key =>
          String(data[key]).includes('@')
        )

        if (emailColumn) {
          const email = data[emailColumn] as string
          if (!email || !email.includes('@') || email.trim() === '') {
            console.warn('⚠️ Skipping invalid email:', email)
            return
          }

          if (!groups.has(email)) {
            groups.set(email, [])
          }

          groups.get(email)!.push(data)
        }
      }
    })

    return groups
  }, [people, columnKeys, groupByColumn])

  async function sendEmails(template: string, subjectTemplate: string, ccEmailsString?: string, attachments?: string[]) {
    if (!template || template.trim() === '') {
      toast.error('Template tidak boleh kosong')
      return
    }

    if (!subjectTemplate || subjectTemplate.trim() === '') {
      toast.error('Subject tidak boleh kosong')
      return
    }

    if (groupedByEmail.size === 0) {
      toast.error('Tidak ada email yang bisa dikirim', {
        description: 'CSV tidak punya kolom email atau tidak ada data valid'
      })
      return
    }

    if (sending) {
      toast.warning('Email sedang dikirim', {
        description: 'Mohon tunggu proses selesai'
      })
      return
    }

    const alreadySentRows = people.filter(p => p.notification_status === 'success')
    if (alreadySentRows.length > 0) {
      toast.warning('Beberapa data sudah pernah dikirim', {
        description: `${alreadySentRows.length} rows sudah status 'Success'. Kirim ulang?`
      })
    }

    if (people.length > MAX_ROWS_PER_SEND) {
      toast.error('Terlalu banyak rows untuk dikirim', {
        description: `Maksimal ${MAX_ROWS_PER_SEND} rows per kirim. Current: ${people.length} rows`
      })
      return
    }

    if (groupedByEmail.size > MAX_EMAILS_PER_BATCH) {
      toast.error('Terlalu banyak email untuk dikirim', {
        description: `Maksimal ${MAX_EMAILS_PER_BATCH} email per batch. Current: ${groupedByEmail.size} email`
      })
      return
    }

    setSending(true)
    setHasSent(false)

    try {
      const emailPromises = Array.from(groupedByEmail.entries()).map(
        async ([email, rows]) => {
          const rowIds = rows.map((r: any) => r.id)

          const firstRow = rows[0]

          let emailContent = template

          if (hasInvoiceColumns(columnKeys) && tbodyHasVariable(template, /nilai/i) && tbodyHasVariable(template, /diskon/i)) {
            const tbodyTemplate = extractTBodyTemplate(template)

            if (tbodyTemplate && tbodyTemplate.cells.length > 0) {
              const tableRows = rows.map((row: any, idx: number) => {
                return generateTableRowFromTemplate(row, tbodyTemplate, idx + 1)
              }).join('')

              emailContent = emailContent.replace(
                /<tbody>[\s\S]*?<\/tbody>/,
                `<tbody>${tableRows}</tbody>`
              )
            }
          }

          // Use renderTemplateWithTotals for all variable replacements (including {total{{variable}}})
          emailContent = renderTemplateWithTotals(emailContent, rows, columnKeys)

          let emailSubject = subjectTemplate
          columnKeys.forEach(key => {
            const value = firstRow[key] || ''
            const safeValue = escapeHtml(String(value))
            emailSubject = emailSubject.replace(
              new RegExp(`{{${key}}}`, 'g'),
              safeValue
            )
          })


          const emailData: EmailData = {
            sender: process.env.NEXT_PUBLIC_EMAIL_SENDER!,
            to: [email],
            cc: ccEmailsString && ccEmailsString.trim() !== '' ? [ccEmailsString] : undefined,
            subject: emailSubject,
            message: emailContent,
            attachments
          }

          try {
            const response = await fetch('/api/email/send', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(emailData)
            })

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
              console.error(`❌ Failed to send to ${email}:`, errorData)

              try {
                await fetch('/api/notifications', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    rowIds,
                    status: 'failed',
                    error: errorData.error || 'Failed to send email'
                  })
                })
              } catch (statusErr) {
                console.error('⚠️ Failed to update failed status:', statusErr)
              }

              throw new Error(errorData.error || `Failed to send to ${email}`)
            }

            const responseData = await response.json()

            try {
              await fetch('/api/notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  rowIds,
                  status: 'success'
                })
              })
            } catch (statusErr) {
              console.error('⚠️ INCONSISTENCY: Email sent but status update failed!', statusErr)
              console.error(`⚠️ Rows affected: ${rowIds.join(', ')}`)
              console.error('⚠️ Please manually update these rows to status: success')

              return { email, success: true, statusUpdateFailed: true }
            }

            return { email, success: true }
          } catch (err: any) {
            try {
              await fetch('/api/notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  rowIds,
                  status: 'failed',
                  error: err.message
                })
              })
            } catch (statusErr) {
              console.error('⚠️ Failed to update failed status:', statusErr)
            }
            throw err
          }
        }
      )

      const results = await Promise.all(emailPromises)

      const successCount = results.filter(r => r.success).length

      toast.success(`Email berhasil dikirim ke ${successCount} penerima`, {
        description: `Total: ${groupedByEmail.size} alamat email`,
        duration: 5000
      })

      setTemplateModalOpen(false)
    } catch (error) {
      console.error('❌ Error sending emails:', error)
      toast.error(error instanceof Error ? error.message : 'Gagal mengirim email. Silakan coba lagi.', {
        duration: 5000
      })
    } finally {
      setSending(false)
    }
  }

  return {
    sending,
    templateModalOpen,
    setTemplateModalOpen,
    groupedByEmail,
    sendEmails
  }
}
