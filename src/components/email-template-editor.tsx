'use client'

import { useState, useMemo, useRef } from 'react'
import { getEmailTemplate, getInvoiceTableHelperHTML, findTotalVariables, calculateTotalFromRows, hasInvoiceColumns, formatCurrency, extractTBodyTemplate, generateTableRowFromTemplate, tbodyHasVariable, renderTemplateWithTotals } from '@/lib/email-template'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {  Table, List, Type, Image } from 'lucide-react'

interface RecipientData {
  groupKey: string
  email: string
  sampleData: Record<string, any>
  sampleRows: any[]
  invoiceCount: number
}

interface EmailTemplateEditorProps {
  variables: string[]
  onSave?: (template: string) => void
  defaultTemplate?: string
  sampleData?: Record<string, any>
  sampleRows?: any[]
  recipients?: RecipientData[]
  subject?: string
  onSubjectChange?: (subject: string) => void
  ccEmails?: string
  onCcEmailsChange?: (emails: string) => void
  attachments?: string[]
  onAttachmentsChange?: (paths: string[]) => void
}

export function EmailTemplateEditor({ variables, onSave, defaultTemplate, sampleData, sampleRows = [], recipients = [], subject = '', onSubjectChange, ccEmails = '', onCcEmailsChange, attachments = [], onAttachmentsChange }: EmailTemplateEditorProps) {
  const [attachmentInput, setAttachmentInput] = useState<string>('')

  function handleAddAttachment() {
    const trimmedPath = attachmentInput.trim()
    if (trimmedPath && onAttachmentsChange) {
      onAttachmentsChange([...attachments, trimmedPath])
      setAttachmentInput('')
    }
  }

  function handleRemoveAttachment(index: number) {
    if (onAttachmentsChange) {
      const newAttachments = attachments.filter((_, i) => i !== index)
      onAttachmentsChange(newAttachments)
    }
  }

  function handleAttachmentKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddAttachment()
    }
  }
  const [template, setTemplate] = useState(defaultTemplate || getDefaultTemplate())
  const [showHelpers, setShowHelpers] = useState(true)
  const [selectedRecipientIndex, setSelectedRecipientIndex] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Determine if we're using multi-recipient mode or legacy mode
  const isMultiRecipient = recipients.length > 0
  const currentSampleData = isMultiRecipient ? recipients[selectedRecipientIndex]?.sampleData : sampleData
  const currentSampleRows = isMultiRecipient ? recipients[selectedRecipientIndex]?.sampleRows : sampleRows

  const preview = useMemo(() => {
    let result = template

    const findValue = (row: any, possibleKeys: string[]) => {
      for (const key of possibleKeys) {
        if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
          return row[key]
        }
      }
      return ''
    }

    const findNumericValue = (row: any, possibleKeys: string[]) => {
      const value = findValue(row, possibleKeys)
      if (typeof value === 'number') return value
      if (typeof value === 'string') {
        return parseFloat(value.replace(/[^\d]/g, '')) || 0
      }
      return 0
    }

    let tbodyTemplate: ReturnType<typeof extractTBodyTemplate> = null

    if (currentSampleRows.length > 0) {
      tbodyTemplate = extractTBodyTemplate(template)

      if (tbodyTemplate && tbodyTemplate.cells.length > 0) {
        const tableRows = currentSampleRows.map((row, idx) => {
          return generateTableRowFromTemplate(row, tbodyTemplate!, idx + 1)
        }).join('')

        result = result.replace(/<tbody>[\s\S]*?<\/tbody>/, `<tbody>${tableRows}</tbody>`)
      }
    }

    // Use renderTemplateWithTotals for all variable replacements (including {total{{variable}}})
    result = renderTemplateWithTotals(result, currentSampleRows, variables)

    return result
  }, [template, variables, currentSampleData, currentSampleRows, selectedRecipientIndex])

  function insertAtCursor(text: string) {
    const textarea = textareaRef.current
    if (!textarea) {
      setTemplate(prev => prev + text)
      return
    }

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newValue = template.substring(0, start) + text + template.substring(end)

    setTemplate(newValue)

    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + text.length, start + text.length)
    }, 0)
  }

  function insertVariable(variable: string) {
    insertAtCursor(variable)
  }

  function insertHTML(html: string) {
    insertAtCursor(html)
  }

  const helpers = [
    {
      label: 'Tabel Invoice',
      icon: Table,
      html: getInvoiceTableHelperHTML()
    },
    {
      label: 'Bold Text',
      icon: Type,
      html: `<strong>Teks bold</strong>`
    },
    {
      label: 'Italic Text',
      icon: Type,
      html: `<em>Teks italic</em>`
    },
    {
      label: 'List',
      icon: List,
      html: `<ul>
  <li>Item 1</li>
  <li>Item 2</li>
  <li>Item 3</li>
</ul>`
    },
    {
      label: 'Paragraph',
      icon: Type,
      html: `<p>Paragraph baru...</p>`
    },
    {
      label: 'Gambar',
      icon: Image,
      html: `<img src="" alt="Gambar" style="max-width: 200px;" />`
    }
  ]

  function handleSave() {
    onSave?.(template)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Editor */}
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle>Email Template</CardTitle>
          <CardDescription>
            Tulis template surat email. Gunakan {'{{variabel}}'} untuk menyisipkan data dari CSV.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 flex-1">
          {/* Available Variables */}
          <div>
            <p className="text-sm font-medium mb-3">Available Variables:</p>
            <div className="flex flex-wrap gap-2">
              {variables.map(variable => (
                <Button
                  key={variable}
                  variant="outline"
                  size="sm"
                  onClick={() => insertVariable(`{{${variable}}}`)}
                  className="font-mono text-xs"
                >
                  {`{{${variable}}}`}
                </Button>
              ))}
            </div>
            {variables.length === 0 && (
              <p className="text-sm text-muted-foreground italic">
                Upload CSV dulu untuk melihat variabel yang tersedia
              </p>
            )}
          </div>

          {/* Subject Input */}
          {onSubjectChange && (
            <div>
              <label className="text-sm font-medium mb-2 block">
                Subject Email:
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => onSubjectChange(e.target.value)}
                placeholder="Subject email..."
                className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              />
            </div>
          )}

          {/* CC Email Input */}
          {onCcEmailsChange && (
            <div>
              <label className="text-sm font-medium mb-2 block">
                CC Emails (optional):
              </label>
              <input
                type="text"
                value={ccEmails}
                onChange={(e) => onCcEmailsChange(e.target.value)}
                placeholder="email1@example.com, email2@example.com"
                className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Pisahkan email dengan koma. Email ini akan menerima CC untuk semua email yang dikirim.
              </p>
            </div>
          )}

          {/* Attachments Input */}
          {onAttachmentsChange && (
            <div>
              <label className="text-sm font-medium mb-2 block">
                Lampiran (optional):
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={attachmentInput}
                  onChange={(e) => setAttachmentInput(e.target.value)}
                  onKeyDown={handleAttachmentKeyDown}
                  placeholder="/home/adminapp/files/Format Restitusi.docx"
                  className="flex-1 px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                />
                <Button
                  type="button"
                  onClick={handleAddAttachment}
                  size="sm"
                  variant="outline"
                  className="px-3"
                >
                  +
                </Button>
              </div>
              {attachments.length > 0 && (
                <div className="mt-2 space-y-1">
                  <p className="text-xs font-medium">Lampiran yang ditambahkan:</p>
                  {attachments.map((path, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="flex-1">• {path}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Masukkan path file dan klik + untuk menambahkan. Lampiran akan dikirim untuk semua email.
              </p>
            </div>
          )}

          {/* HTML Helper Buttons */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Insert HTML Cepat:</label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHelpers(!showHelpers)}
                className="text-xs"
              >
                {showHelpers ? 'Sembunyikan' : 'Tampilkan'}
              </Button>
            </div>
            {showHelpers && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-3 bg-muted/30 rounded-md border">
                {helpers.map((helper) => (
                  <Button
                    key={helper.label}
                    variant="outline"
                    size="sm"
                    onClick={() => insertHTML(helper.html)}
                    className="text-xs h-auto py-2 flex flex-col items-start gap-1"
                  >
                    <helper.icon className="h-4 w-4" />
                    <span>{helper.label}</span>
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Template Editor */}
          <div className="flex-1 flex flex-col">
            <label className="text-sm font-medium mb-2 block">
              Template (HTML):
            </label>
            <textarea
              ref={textareaRef}
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              placeholder="Tulis template HTML di sini... Gunakan tombol di atas untuk menyisipkan variabel"
              className="flex-1 w-full min-h-[500px] px-3 py-2 text-sm font-mono border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-y"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end pt-2">
            <Button onClick={handleSave}>
              Save Template
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle>Preview</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 space-y-4">
          {/* Recipient Summary */}
          {isMultiRecipient && (
            <div className="p-4 bg-muted/50 rounded-lg border">
              <p className="text-sm font-medium mb-2">
                ✅ Email akan dikirim ke {recipients.length} penerima:
              </p>
              <ul className="text-sm space-y-1 text-muted-foreground">
                {recipients.map((r, idx) => (
                  <li
                    key={idx}
                    className={idx === selectedRecipientIndex ? 'text-foreground font-medium' : ''}
                  >
                    • {r.groupKey} ({r.invoiceCount} {r.invoiceCount === 1 ? 'invoice' : 'invoices'})
                    {r.email && <span className="text-xs ml-2">({r.email})</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recipient Selector Dropdown */}
          {isMultiRecipient && recipients.length > 1 && (
            <div>
              <label className="text-sm font-medium mb-2 block">
                Pilih Recipient untuk Preview:
              </label>
              <select
                value={selectedRecipientIndex}
                onChange={(e) => setSelectedRecipientIndex(parseInt(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                {recipients.map((r, idx) => (
                  <option key={idx} value={idx}>
                    {r.groupKey} {r.invoiceCount > 0 ? `(${r.invoiceCount} invoices)` : ''}
                  </option>
                ))}
              </select>
              {recipients[selectedRecipientIndex]?.email && (
                <p className="text-xs text-muted-foreground mt-1">
                  Email: {recipients[selectedRecipientIndex].email}
                </p>
              )}
            </div>
          )}

          {/* Email Preview */}
          <div
            className="border rounded-lg p-8 prose prose-sm max-w-none overflow-auto bg-white"
            dangerouslySetInnerHTML={{ __html: preview }}
          />
        </CardContent>
      </Card>
    </div>
  )
}

function getDefaultTemplate(): string {
  return getEmailTemplate()
}

function getPlaceholder(variable: string): string {
  const placeholders: Record<string, string> = {
    'NamaPerusahaan': 'PT Semoga Banyak Duit',
    'NoRekening': '1234567890',
    'NamaBank': 'Bank Mandiri',
    'NamaPemegangRek': 'Surya Ganm',
    'Email': 'rio@example.com',
    'Invoice': 'INV-001',
    'Nilai': 'Rp 1.000.000',
    'NilaiDiskon': 'Rp 100.000',
    'TotalNilai': 'Rp 3.000.000',
    'TotalDiskon': 'Rp 300.000'
  }

  return placeholders[variable] || `[${variable}]`
}
