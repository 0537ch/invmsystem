'use client'

import { useMemo, useState, useEffect } from 'react'
import type { ColumnDef, VisibilityState, SortingState } from '@tanstack/react-table'
import { flexRender, getCoreRowModel, useReactTable, getPaginationRowModel, getExpandedRowModel, getSortedRowModel, PaginationState } from '@tanstack/react-table'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { ButtonGroup } from '@/components/ui/button-group'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from '@/components/ui/combobox'
import { FileText, Calendar, Upload, Trash2, Send, FileSpreadsheet, Inbox, ChevronDownIcon, ChevronUpIcon, Columns3, Search, RefreshCcw, Clock, CheckCircle2, XCircle } from 'lucide-react'
import { EmailTemplateModal } from './EmailTemplateModal'
import { Fragment } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { useInvoiceData, downloadTemplate, type Row } from '../_hooks/use-report'
import { useEmailTemplate } from '../_hooks/use-email-template'

export default function InvoiceTable() {
  const invoiceData = useInvoiceData()

  const { people, imports, selectedImportId, setSelectedImportId, loading, error, uploading, selectedFile, setSelectedFile, fileInputRef, handleFileUpload, handleImport, handleDeleteImport } = invoiceData

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})
  const [sorting, setSorting] = useState<SortingState>([])
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10
  })
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [columnSearchQuery, setColumnSearchQuery] = useState<string>('')
  const [groupByColumn, setGroupByColumn] = useState<string>('')

  const columnKeys = useMemo(() => {
    if (people.length === 0) return []
    const firstPersonData = people[0]?.data || {}
    return Object.keys(firstPersonData)
  }, [people])

  const autoDetectGroupByColumn = useMemo(() => {
    if (columnKeys.length === 0) return ''

    const sampleData = people[0]?.data || {}

    const customerMasterCol = columnKeys.find(key =>
      /customer.*master|customer.*id|customer/i.test(key)
    )

    const emailCol = columnKeys.find(key =>
      typeof sampleData[key] === 'string' && (sampleData[key] as string).includes('@')
    )

    return customerMasterCol || emailCol || columnKeys[0]
  }, [columnKeys, people])

  useEffect(() => {
    if (autoDetectGroupByColumn && !groupByColumn) {
      setGroupByColumn(autoDetectGroupByColumn)
    }
  }, [autoDetectGroupByColumn, groupByColumn])

  // Set default column visibility: only first n CSV columns visible
  const defaultColumnVisibility = useMemo(() => {
    const visibility: VisibilityState = {}
    columnKeys.forEach((key, index) => {
      if (index >= 3) {
        visibility[key] = false
      }
    })
    return visibility
  }, [columnKeys])

  // Apply default column visibility when columnKeys change
  useEffect(() => {
    if (columnKeys.length > 0) {
      setColumnVisibility(defaultColumnVisibility)
    }
  }, [defaultColumnVisibility, columnKeys.length])

  const flattenedData = useMemo(() => {
    const flat = people.map(person => ({
      id: person.id,
      created_at: person.created_at,
      notification_status: person.notification_status,
      notification_sent_at: person.notification_sent_at,
      notification_error: person.notification_error,
      ...person.data
    })) as Array<{ id: number; created_at: Date; notification_status?: string; notification_sent_at?: Date; notification_error?: string; [key: string]: any }>

    if (!groupByColumn || !columnKeys.includes(groupByColumn)) return flat

    const groups = new Map<string, any>()
    flat.forEach(row => {
      const groupValue = String(row[groupByColumn] || '')
      if (!groups.has(groupValue)) {
        groups.set(groupValue, { ...row, _childRows: [] })
      }
      groups.get(groupValue)!._childRows.push(row)
    })

    return Array.from(groups.values())
  }, [people, columnKeys, groupByColumn])

  const selectedFlattenedData = useMemo(() => {
    const selectedIndices = Object.keys(rowSelection).filter(key => rowSelection[key])
    return selectedIndices.map(idx => flattenedData[parseInt(idx)])
  }, [rowSelection, flattenedData])

  const emailTemplate = useEmailTemplate(selectedFlattenedData, columnKeys, groupByColumn)
  const { templateModalOpen, setTemplateModalOpen, sending: sendingEmails, sendEmails } = emailTemplate

  const sampleData = useMemo(() => {
    const selectedIndices = Object.keys(rowSelection).filter(key => rowSelection[key])

    if (selectedIndices.length === 0) return {}

    const firstSelectedIndex = parseInt(selectedIndices[0])
    const firstSelectedRow = flattenedData[firstSelectedIndex]

    if (!firstSelectedRow) return {}

    const { _childRows, id, created_at, ...rowData } = firstSelectedRow
    return rowData
  }, [rowSelection, flattenedData])

  const sampleRows = useMemo(() => {
    const selectedIndices = Object.keys(rowSelection).filter(key => rowSelection[key])

    if (selectedIndices.length === 0) return []

    const firstSelectedIndex = parseInt(selectedIndices[0])
    const firstSelectedRow = flattenedData[firstSelectedIndex]

    if (!firstSelectedRow || !firstSelectedRow._childRows) return []

    return firstSelectedRow._childRows
  }, [rowSelection, flattenedData])

  const recipients = useMemo(() => {
    const selectedIndices = Object.keys(rowSelection).filter(key => rowSelection[key])

    if (selectedIndices.length === 0) return []

    return selectedIndices.map(idx => {
      const rowIndex = parseInt(idx)
      const row = flattenedData[rowIndex]

      if (!row) return null

      const { _childRows, id, created_at, notification_status, notification_sent_at, notification_error, ...rowData } = row

      // Find email column
      const emailColumn = columnKeys.find(key =>
        typeof rowData[key] === 'string' && (rowData[key] as string).includes('@')
      )

      return {
        groupKey: String(rowData[groupByColumn] || `Group ${rowIndex + 1}`),
        email: emailColumn ? String(rowData[emailColumn]) : '',
        sampleData: rowData,
        sampleRows: _childRows || [],
        invoiceCount: _childRows?.length || 0
      }
    }).filter((r): r is NonNullable<typeof r> => r !== null)
  }, [rowSelection, flattenedData, columnKeys, groupByColumn])

  const columns = useMemo<ColumnDef<typeof flattenedData[number]>[]>(() => {
    const cols: ColumnDef<Row>[] = [
      {
        id: 'select',
        size: 50,
        enableHiding: false,
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
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
        id: 'expand',
        size: 100,
        enableHiding: false,
        header: 'Rows',
        cell: ({ row }) => {
          const childRows = (row.original as any)._childRows || []
          const count = childRows.length
          return (
            <div className='flex items-center gap-2'>
              <Badge variant='secondary'>
                {count} {count === 1 ? 'row' : 'rows'}
              </Badge>
              {count > 0 && row.getCanExpand() && (
                <Button
                  className='size-7 text-muted-foreground'
                  onClick={row.getToggleExpandedHandler()}
                  aria-expanded={row.getIsExpanded()}
                  aria-label={row.getIsExpanded() ? 'Collapse' : 'Expand'}
                  size='icon'
                  variant='ghost'
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
        id: 'notification_status',
        size: 60,
        enableHiding: false,
        header: '',
        cell: ({ row }) => {
          const childRows = (row.original as any)._childRows || []
          const firstChild = childRows[0] || row.original
          const status = firstChild.notification_status || 'not_yet'

          const statusConfig = {
            not_yet: { icon: Clock, className: 'text-muted-foreground', label: 'Not Yet' },
            success: { icon: CheckCircle2, className: 'text-green-600', label: 'Success' },
            failed: { icon: XCircle, className: 'text-destructive', label: 'Failed' }
          }

          const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.not_yet
          const Icon = config.icon

          return (
            <div className='flex items-center justify-center' title={config.label}>
              <Icon className={`h-5 w-5 ${config.className}`} />
            </div>
          )
        }
      }
    ]

    columnKeys.forEach(key => {
      cols.push({
        id: key,
        accessorFn: (row: any) => row[key],
        header: key,
        cell: ({ getValue }) => {
          const value = getValue() as string | number | null
          return <div>{value ?? ''}</div>
        }
      })
    })

    return cols
  }, [columnKeys])

  const table = useReactTable({
    data: flattenedData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: (row) => {
      const childRows = (row.original as any)._childRows || []
      return childRows.length > 0
    },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      rowSelection,
      pagination,
      columnVisibility
    }
  })

  if (loading) {
    return (
      <div className="relative rounded-xl border border-white/20 bg-white/85 backdrop-blur-xl text-card-foreground shadow-xl shadow-black/5 dark:bg-gray-900/85 dark:border-white/10">
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-5 w-24" />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>

        <div className='overflow-x-auto border-t'>
          <Table>
            <TableHeader>
              <TableRow className='hover:bg-transparent bg-slate-100 border-b-2 border-slate-300'>
                <TableHead><Skeleton className="h-4 w-4" /></TableHead>
                <TableHead><Skeleton className="h-4 w-24" /></TableHead>
                <TableHead><Skeleton className="h-4 w-32" /></TableHead>
                <TableHead><Skeleton className="h-4 w-20" /></TableHead>
                <TableHead><Skeleton className="h-4 w-28" /></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, i) => (
                <TableRow key={i} className='bg-white'>
                  <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="border-t px-6 py-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-48" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
            </div>
          </div>
        </div>

        <div className="absolute inset-0 flex items-center justify-center bg-white/30 backdrop-blur-sm rounded-xl">
          <div className="flex flex-col items-center gap-3">
            <Spinner className="h-12 w-12 text-primary" />
            <p className="text-sm font-medium text-foreground">Loading data...</p>
          </div>
        </div>
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

  return (
    <div className="rounded-xl border border-white/20 bg-white/85 backdrop-blur-xl text-card-foreground shadow-xl shadow-black/5 dark:bg-gray-900/85 dark:border-white/10 flex flex-col max-h-[calc(100vh-8rem)]">
      <div className="p-6 space-y-4 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {imports.length > 0 && (
              <Combobox
                value={selectedImportId?.toString() ?? ''}
                onValueChange={(value) => setSelectedImportId(value ? parseInt(value) : null)}
              >
                <ComboboxInput
                  placeholder="Select an import..."
                  showTrigger
                  className="w-full sm:w-80"
                  value={imports.find(imp => imp.id === selectedImportId)?.file_name ?? ''}
                  readOnly
                />
                <ComboboxContent>
                  <ComboboxList>
                    {imports.map((imp) => (
                      <ComboboxItem key={imp.id} value={imp.id.toString()}>
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                            <FileText className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                            <span className="font-medium text-sm truncate">{imp.file_name}</span>
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3 shrink-0" />
                              <span className="truncate">{new Date(imp.uploaded_at).toLocaleDateString()}</span>
                            </span>
                          </div>
                        </div>
                      </ComboboxItem>
                    ))}
                    <ComboboxEmpty>No imports found</ComboboxEmpty>
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            )}
          </div>
          <div className="flex items-center gap-3">
            {columnKeys.length > 0 && (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Columns3 className="h-4 w-4" />
                      Kolom
                      <ChevronDownIcon className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={columnSearchQuery}
                      onChange={(e) => setColumnSearchQuery(e.target.value)}
                      className="pl-8 h-9"
                      placeholder="Cari kolom..."
                      onKeyDown={(e) => e.stopPropagation()}
                    />
                  </div>
                  <DropdownMenuSeparator />
                  {table
                    .getAllColumns()
                    .filter((column) => column.getCanHide())
                    .filter((column) => {
                      if (columnSearchQuery && !column.id.toLowerCase().includes(columnSearchQuery.toLowerCase())) {
                        return false
                      }
                      return true
                    })
                    .map((column) => (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) => column.toggleVisibility(!!value)}
                        onSelect={(e) => e.preventDefault()}
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      table.resetColumnVisibility(false)
                      // Apply default visibility (first 5 columns)
                      Object.entries(defaultColumnVisibility).forEach(([key, value]) => {
                        table.getColumn(key)?.toggleVisibility(value)
                      })
                      setColumnSearchQuery('')
                    }}
                  >
                    <RefreshCcw className="h-4 w-4 mr-2" />
                    Reset ke Default
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Combobox value={groupByColumn} onValueChange={(value) => setGroupByColumn(value || '')}>
                <ComboboxInput
                  placeholder="Group By..."
                  showTrigger
                  className="w-40"
                  value={groupByColumn}
                  readOnly
                />
                <ComboboxContent>
                  <ComboboxList>
                    {columnKeys.map((key) => (
                      <ComboboxItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/10">
                            <Inbox className="h-3 w-3 text-primary" />
                          </div>
                          <span className="text-sm">{key}</span>
                        </div>
                      </ComboboxItem>
                    ))}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </>
            )}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileSpreadsheet className="h-4 w-4" />
              <span>{people.length} rows</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm"
            onClick={() => setTemplateModalOpen(true)}
            disabled={Object.keys(rowSelection).filter(key => rowSelection[key]).length === 0}
          >
            <Send className="mr-2 h-4 w-4" />
            Send Email
          </Button>

          <EmailTemplateModal
            open={templateModalOpen}
            onOpenChange={setTemplateModalOpen}
            variables={columnKeys}
            sampleData={sampleData}
            sampleRows={sampleRows}
            recipients={recipients}
            onSend={sendEmails}
            sending={sendingEmails}
          />

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
          />

          {!selectedFile ? (
            <ButtonGroup>
              <Button size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                <Upload className="mr-2 h-4 w-4" />
                Upload File
              </Button>
              <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive" size="sm" disabled={!selectedImportId}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete Import</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to delete this import? This action cannot be undone and will remove all {people.length} rows.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex flex-col sm:flex-row justify-end gap-3 mt-4">
                    <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="w-full sm:w-auto">
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={async () => {
                        if (selectedImportId) {
                          setDeleting(true)
                          await handleDeleteImport(selectedImportId)
                          setDeleting(false)
                          setDeleteDialogOpen(false)
                        }
                      }}
                      disabled={deleting}
                      className="w-full sm:w-auto"
                    >
                      {deleting && <Spinner className="mr-2" />}
                      {deleting ? 'Deleting...' : 'Delete'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </ButtonGroup>
          ) : (
            <>
              <div className="text-sm text-muted-foreground truncate px-3 py-2 bg-muted rounded">
                {selectedFile.name}
              </div>
              <ButtonGroup>
                <Button size="sm" onClick={handleImport} disabled={uploading}>
                  {uploading && <Spinner className="mr-2" />}
                  {uploading ? 'Importing...' : 'Import'}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setSelectedFile(null)} disabled={uploading}>
                  Cancel
                </Button>
              </ButtonGroup>
            </>
          )}
        </div>
      </div>

      {people.length === 0 ? (
        <div className="p-12 text-center flex-1">
          <Inbox className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No data yet</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Import a CSV or XLSX file.
          </p>
        </div>
      ) : (
        <>
          <div className='overflow-auto border-t flex-1 min-h-0'>
              <table className="min-w-full caption-bottom text-sm">
                <thead className="sticky top-0 z-10">
                  {table.getHeaderGroups().map(headerGroup => (
                    <tr key={headerGroup.id} className='hover:bg-transparent bg-slate-100/95 backdrop-blur-sm border-b-2 border-slate-300 shadow-sm'>
                      {headerGroup.headers.map(header => (
                        <th
                          key={header.id}
                          className='text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap sticky top-0 z-10 bg-slate-100/95 backdrop-blur-sm'
                          aria-sort={
                            header.column.getIsSorted() === 'asc'
                              ? 'ascending'
                              : header.column.getIsSorted() === 'desc'
                                ? 'descending'
                                : 'none'
                          }
                        >
                          {header.isPlaceholder ? null : (
                            <div
                              className={`flex h-full ${header.column.getCanSort() ? 'cursor-pointer items-center justify-between gap-2 select-none' : 'items-center'}`}
                              onClick={header.column.getToggleSortingHandler()}
                              onKeyDown={e => {
                                if (header.column.getCanSort() && (e.key === 'Enter' || e.key === ' ')) {
                                  e.preventDefault()
                                  header.column.getToggleSortingHandler()?.(e)
                                }
                              }}
                              tabIndex={header.column.getCanSort() ? 0 : undefined}
                            >
                              <span className='truncate'>
                                {flexRender(header.column.columnDef.header, header.getContext())}
                              </span>
                              {(header.column.getIsSorted() === 'asc' && <ChevronUpIcon className='shrink-0 opacity-60' size={16} aria-hidden='true' />) ||
                              (header.column.getIsSorted() === 'desc' && <ChevronDownIcon className='shrink-0 opacity-60' size={16} aria-hidden='true' />)}
                            </div>
                          )}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map(row => (
                      <Fragment key={row.id}>
                        <tr data-state={row.getIsSelected() && 'selected'} className='bg-white hover:bg-white border-b transition-colors'>
                          {row.getVisibleCells().map(cell => (
                            <td
                              key={cell.id}
                              className='p-2 align-middle whitespace-nowrap [&:has([aria-expanded])]:[&:has([aria-expanded])]:w-px [&:has([aria-expanded])]:[&:has([aria-expanded])]:py-0'
                            >
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </td>
                          ))}
                        </tr>
                        {row.getIsExpanded() && (
                          <tr className='hover:bg-transparent animate-in fade-in slide-in-from-top-2 duration-300'>
                            <td></td>
                            <td colSpan={columnKeys.length + 1} className='p-4' style={{ width: '1px', minWidth: '0' }}>
                              <div className='rounded-lg border overflow-hidden' style={{ width: '100%', overflow: 'hidden' }}>
                                <div className='overflow-x-auto'>
                                  <table style={{ minWidth: 'max-content' }} className="min-w-full caption-bottom text-sm">
                                    <thead>
                                      <tr className='bg-slate-100 border-b-2 border-slate-300'>
                                        {columnKeys.map(key => (
                                          <th key={key} className='text-xs text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap'>
                                            {key}
                                          </th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {(row.original as any)._childRows?.map((childRow: any, idx: number) => (
                                        <tr key={idx} className='bg-white hover:bg-slate-50 border-b transition-colors'>
                                          {columnKeys.map(key => (
                                            <td key={key} className='p-2 align-middle whitespace-nowrap text-sm'>
                                              {childRow[key] ?? ''}
                                            </td>
                                          ))}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={columns.length} className='h-24 text-center p-2 align-middle'>
                        No results.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
          </div>

          <div className="border-t px-6 py-4 shrink-0">
            <div className="flex items-center justify-between gap-4">
              <div className="text-sm text-muted-foreground">
                Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
                {Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, table.getFilteredRowModel().rows.length)} of{' '}
                {table.getFilteredRowModel().rows.length} row(s)
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={table.getState().pagination.pageSize}
                  onChange={e => {
                    table.setPageSize(Number(e.target.value))
                  }}
                  className="h-8 rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  {[10, 20, 50, 100].map(pageSize => (
                    <option key={pageSize} value={pageSize}>
                      {pageSize}
                    </option>
                  ))}
                  <option value={table.getFilteredRowModel().rows.length}>
                    All
                  </option>
                </select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.setPageIndex(0)}
                  disabled={!table.getCanPreviousPage()}
                >
                  {'<<'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  {'<'}
                </Button>
                <div className="text-sm">
                  Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  {'>'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                  disabled={!table.getCanNextPage()}
                >
                  {'>>'}
                </Button>
              </div>
            </div>
          </div>
        </>
        )}
    </div>
  )
}
