import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import * as XLSX from 'xlsx'

export async function POST(request: Request) {
  try {
    const sql = getDb()

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    const fileName = file.name.toLowerCase()
    let parsedData: Record<string, any>[] = []

    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer)
      const sheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[sheetName]
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false }) as (string | number | null | undefined)[][]

      if (data.length > 0) {
        const headers = data[0].map(h => String(h).trim())
        const dataRows = data.slice(1)

        for (const row of dataRows) {
          const rowObj: Record<string, any> = {}
          headers.forEach((header, index) => {
            if (row[index] !== null && row[index] !== undefined) {
              rowObj[header] = row[index]
            }
          })
          if (Object.keys(rowObj).length > 0) {
            parsedData.push(rowObj)
          }
        }
      }
    } else if (fileName.endsWith('.csv')) {
      const text = await file.text()
      parsedData = parseCSV(text)
    } else {
      return NextResponse.json(
        { error: 'Unsupported file format. Please use CSV or XLSX.' },
        { status: 400 }
      )
    }

    if (parsedData.length === 0) {
      return NextResponse.json(
        { error: 'File is empty or has no valid data' },
        { status: 400 }
      )
    }

    const cleanedData = parsedData.map(row => {
      const cleanedRow: Record<string, any> = {}
      for (const [key, value] of Object.entries(row)) {
        cleanedRow[key] = convertScientificNotation(value)
      }
      return cleanedRow
    })

    await sql`UPDATE imports SET is_active = false`

    const [importRecord] = await sql<{ id: number }[]>`
      INSERT INTO imports (file_name, is_active)
      VALUES (${file.name}, true)
      RETURNING id
    `

    for (const rowData of cleanedData) {
      await sql`
        INSERT INTO rows (import_id, data)
        VALUES (${importRecord.id}, ${sql.json(rowData)})
      `
    }

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${parsedData.length} rows from ${file.name}`
    })
  } catch (error) {
    console.error('Error importing file:', error)
    return NextResponse.json(
      { error: 'Failed to import file' },
      { status: 500 }
    )
  }
}

function parseCSV(text: string): Record<string, any>[] {
  const lines = text.trim().split('\n')
  if (lines.length === 0) return []

  const headers = parseCSVLine(lines[0])
  const dataLines = lines.slice(1)

  const rows: Record<string, any>[] = []

  for (const line of dataLines) {
    const values = parseCSVLine(line)
    if (values.length === headers.length) {
      const rowObj: Record<string, any> = {}
      headers.forEach((header, index) => {
        rowObj[header] = values[index]?.trim() || ''
      })
      rows.push(rowObj)
    }
  }

  return rows
}

function parseCSVLine(line: string): string[] {
  const values: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      values.push(current)
      current = ''
    } else {
      current += char
    }
  }

  values.push(current)
  return values
}

function convertScientificNotation(value: any): any {
  if (value === null || value === undefined) {
    return value
  }

  if (typeof value === 'number') {
    return String(value)
  }

  if (typeof value === 'string') {
    const lowerValue = value.toLowerCase().trim()

    if (/e\+?\d+$/i.test(lowerValue)) {
      const num = parseFloat(lowerValue)
      if (!isNaN(num)) {
        return String(num)
      }
    }

    return value
  }

  return value
}
