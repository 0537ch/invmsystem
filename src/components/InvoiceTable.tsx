'use client'

import { Fragment, useEffect, useState, useMemo, useRef } from 'react'
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { flexRender, getCoreRowModel, getExpandedRowModel, useReactTable } from '@tanstack/react-table'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'

type Invoice = {
  id: number
  invoice_num: string
  price: number | string
}

type Person = {
  id: number
  name: string
  email: string
  invoices: Invoice[]
  total: number | string
}

export default function InvoiceTable() {
  const [people, setPeople] = useState<Person[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rowSelection, setRowSelection] = useState({})
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false)
  const [sending, setSending] = useState(false)
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

      // Refresh the table
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

  const selectedPeople = useMemo(() => {
    const selectedIndices = Object.keys(rowSelection).filter(key => rowSelection[key as keyof typeof rowSelection])
    return people.filter((_, index) => selectedIndices.includes(String(index)))
  }, [rowSelection, people])

  function handleDownloadTemplate() {
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

  async function handleSendNotifications() {
    setSending(true)
    try {
      // Simulate sending notifications
      await new Promise(resolve => setTimeout(resolve, 1000))

      toast.success(`Notifications sent to ${selectedPeople.length} ${selectedPeople.length === 1 ? 'person' : 'people'}`, {
        duration: 4000,
        className: 'border-green-500 bg-green-50'
      })
      setNotificationDialogOpen(false)
      setRowSelection({})
    } catch (err) {
      toast.error('Failed to send notifications', {
        duration: 4000,
        className: 'border-red-500 bg-red-50'
      })
    } finally {
      setSending(false)
    }
  }

  const columns = useMemo<ColumnDef<Person>[]>(() => [
    {
      id: 'select',
      size: 15,
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label='Select all'
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label='Select row'
        />
      )
    },
    {
      header: 'Name',
      accessorKey: 'name',
      cell: ({ row }) => <div className='font-medium'>{row.getValue('name')}</div>
    },
    {
      header: 'Email',
      accessorKey: 'email',
      cell: ({ row }) => row.getValue('email')
    },
    {
      header: 'Invoices',
      accessorKey: 'invoices',
      cell: ({ row }) => {
        const invoices = row.getValue('invoices') as Invoice[]
        const count = invoices.length
        return (
          <div className='flex items-center gap-2'>
            <Badge variant='secondary'>
              {count} {count === 1 ? 'invoice' : 'invoices'}
            </Badge>
            {row.getCanExpand() && (
              <Button
                {...{
                  className: 'size-7 text-muted-foreground',
                  onClick: row.getToggleExpandedHandler(),
                  'aria-expanded': row.getIsExpanded(),
                  'aria-label': row.getIsExpanded()
                    ? `Collapse invoices for ${row.original.name}`
                    : `Expand invoices for ${row.original.name}`,
                  size: 'icon',
                  variant: 'ghost'
                }}
              >
                {row.getIsExpanded() ? (
                  <ChevronUpIcon className='opacity-60' aria-hidden='true' />
                ) : (
                  <ChevronDownIcon className='opacity-60' aria-hidden='true' />
                )}
              </Button>
            )}
          </div>
        )
      }
    },
    {
      header: () => <div className='text-right'>Total</div>,
      accessorKey: 'total',
      cell: ({ row }) => {
        const total = row.getValue('total') as number | string
        const numTotal = typeof total === 'string' ? parseFloat(total) : total
        return (
          <div className='text-right font-semibold'>
            Rp {numTotal.toLocaleString('id-ID')}
          </div>
        )
      }
    }
  ], [])

  const table = useReactTable({
    data: people,
    columns,
    getRowCanExpand: row => Boolean(row.original.invoices && row.original.invoices.length > 0),
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      rowSelection
    }
  })

  if (loading) {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded">
        {error}
      </div>
    )
  }

  if (people.length === 0) {
    return (
      <div className="text-center p-12 text-gray-500">
        No data yet. Import a CSV or XLSX file to get started.
      </div>
    )
  }

  return (
    <div className="space-y-4">

          <div className="flex flex-col gap-4">

            <div className="flex items-center justify-between gap-3">
              {/* Left side - Send Notification button */}
              <Dialog open={notificationDialogOpen} onOpenChange={setNotificationDialogOpen}>
                <DialogTrigger asChild>
                  <Button disabled={selectedPeople.length === 0}>
                    Kirim {selectedPeople.length > 0 && `(${selectedPeople.length})`}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Send Notifications</DialogTitle>
                    <DialogDescription>
                      Kirim Notifikasi ke {selectedPeople.length} {selectedPeople.length === 1 ? 'orang' : 'orang'}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="mt-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedPeople.map((person) => {
                          const total = typeof person.total === 'string' ? parseFloat(person.total) : person.total
                          return (
                            <Fragment key={person.id}>
                              <TableRow>
                                <TableCell className="font-medium">{person.name}</TableCell>
                                <TableCell className="text-muted-foreground">{person.email}</TableCell>
                                <TableCell className="text-right">Rp {total.toLocaleString('id-ID')}</TableCell>
                              </TableRow>
                              {person.invoices.map((invoice) => {
                                const price = typeof invoice.price === 'string' ? parseFloat(invoice.price) : invoice.price
                                return (
                                  <TableRow key={invoice.id} className="bg-muted/50">
                                    <TableCell className="pl-8">{invoice.invoice_num}</TableCell>
                                    <TableCell></TableCell>
                                    <TableCell className="text-right">Rp {price.toLocaleString('id-ID')}</TableCell>
                                  </TableRow>
                                )
                              })}
                            </Fragment>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="flex justify-end gap-3 mt-4">
                    <Button variant="outline" onClick={() => setNotificationDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSendNotifications} disabled={sending}>
                      {sending ? 'Sending...' : 'Send Notifications'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Right side buttons */}
              <div className="flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                />

                {!selectedFile ? (
                  <>
                    <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                      Upload File
                    </Button>
                    <Button variant="outline" onClick={handleDownloadTemplate}>
                      Template
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="text-sm text-muted-foreground max-w-48 truncate hidden sm:block">
                      {selectedFile.name}
                    </div>
                    <Button onClick={handleImport} disabled={uploading}>
                      {uploading ? 'Importing...' : 'Import'}
                    </Button>
                    <Button variant="outline" onClick={() => setSelectedFile(null)} disabled={uploading}>
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>


      <div className='rounded-md border'>
        <Table className='table-fixed'>
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id} className='hover:bg-transparent'>
                {headerGroup.headers.map(header => (
                  <TableHead key={header.id} style={{ width: `${header.getSize()}px` }}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map(row => (
                <Fragment key={row.id}>
                  <TableRow data-state={row.getIsSelected() && 'selected'}>
                    {row.getVisibleCells().map(cell => (
                      <TableCell
                        key={cell.id}
                        className='[&:has([aria-expanded])]:[&:has([aria-expanded])]:w-px [&:has([aria-expanded])]:py-0'
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                  {row.getIsExpanded() && (
                    <TableRow className='hover:bg-transparent'>
                      <TableCell></TableCell>
                      <TableCell></TableCell>
                      <TableCell></TableCell>
                      <TableCell className='p-4'>
                        <div className='space-y-1'>
                          {row.original.invoices.map((invoice) => {
                            const price = typeof invoice.price === 'string' ? parseFloat(invoice.price) : invoice.price
                            return (
                              <div key={invoice.id} className='py-2 border-b last:border-0'>
                                <div className='text-sm'>{invoice.invoice_num}</div>
                                <div className='text-sm text-muted-foreground'>Rp {price.toLocaleString('id-ID')}</div>
                              </div>
                            )
                          })}
                        </div>
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  )}
                </Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className='h-24 text-center'>
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
