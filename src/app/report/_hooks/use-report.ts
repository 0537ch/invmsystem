import { useState, useRef, useEffect, useMemo } from "react"
import { toast } from "sonner"

export type Invoice = {
  id: number
  invoice_num: string
  price: number | string
}

export type Person = {
  id: number
  name: string
  email: string
  invoices: Invoice[]
  total: number | string
}


export function useInvoiceData() {
  const [people, setPeople] = useState<Person[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [uploading, setUploading] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    


    useEffect(() => {
    fetchPeople()
  }, [])

  async function fetchPeople() {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/people')

      if (!response.ok) {
        throw new Error('Failed to fetch data')
      }

      const data = await response.json()
      setPeople(data.people)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }


    async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    const validExtensions = ['.csv', '.xlsx']
    const hasValidExtension = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext))

    if (!hasValidExtension) {
      toast.error('Please upload a CSV or XLSX file', {
        duration: 4000,
        className: 'border-red-500 bg-red-50'
      })
      return
    }

    setSelectedFile(file)
  }
   
  
  async function handleImport() {
    if (!selectedFile) return

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await fetch('/api/import', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to import CSV')
      }

      toast.success(data.message || 'Import successful!', {
        duration: 4000,
        className: 'border-green-500 bg-green-50'
      })

      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      fetchPeople()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to import file', {
        duration: 5000,
        className: 'border-red-500 bg-red-50'
      })
    } finally {
      setUploading(false)
    }
  }


return {
      people,
      loading,
      error,
      uploading,
      selectedFile,
      setSelectedFile,
      fileInputRef,
      fetchPeople,
      handleFileUpload,
      handleImport
    }
  }

export function useRowSelection(people: Person[]) {
    const [rowSelection, setRowSelection] = useState({})
    const selectedPeople = useMemo(() => {
    const selectedIndices = Object.keys(rowSelection).filter(key => rowSelection[key as keyof typeof rowSelection])
    return people.filter((_, index) => selectedIndices.includes(String(index)))
  }, [rowSelection, people])

    return {
      rowSelection,
      setRowSelection,
      selectedPeople
    }
  }

export function useNotifications(selectedPeople: Person[], setRowSelection: (val: Record<string, boolean>) => void) {
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false)
  const [sending, setSending] = useState(false)

  async function handleSendNotifications() {
    setSending(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))

      toast.success(`Notifications sent to ${selectedPeople.length} ${selectedPeople.length === 1 ? 'person' : 'people'}`, {
        style: {
          '--normal-bg': 'light-dark(var(--color-green-600), var(--color-green-400))',
          '--normal-text': 'var(--color-white)',
          '--normal-border': 'light-dark(var(--color-green-600), var(--color-green-400))'
        } as React.CSSProperties
      })
      setNotificationDialogOpen(false)
      setRowSelection({})
    } catch {
      toast.error('Failed to send notifications', {
        style: {
          '--normal-bg':
            'light-dark(var(--destructive), color-mix(in oklab, var(--destructive) 60%, var(--background)))',
          '--normal-text': 'var(--color-white)',
          '--normal-border': 'transparent'
        } as React.CSSProperties
      })
    } finally {
      setSending(false)
    }
  }

  return {
    notificationDialogOpen,
    setNotificationDialogOpen,
    sending,
    handleSendNotifications
  }
}

export function downloadTemplate() {
  const headers = 'name,email,invoice_number,price'
  const blob = new Blob([headers], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'invoice-template.csv'
  document.body.appendChild(a)
  a.click()
  window.URL.revokeObjectURL(url)
  document.body.removeChild(a)
}