import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import * as XLSX from 'xlsx'

export async function POST(request: Request) {
  try {
    const sql = getDb()

    // Parse the incoming form data
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    let rows: Array<{
      name: string
      email: string
      invoice_num: string
      price: number
    }> = []

    const fileName = file.name.toLowerCase()

    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      // Parse Excel file
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer)
      const sheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[sheetName]
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][]

      // Skip header if it exists
      const startIndex = data.length > 0 && String(data[0][0]).toLowerCase() === 'name' ? 1 : 0

      for (let i = startIndex; i < data.length; i++) {
        const row = data[i]
        if (row.length >= 4) {
          rows.push({
            name: String(row[0]).trim(),
            email: String(row[1]).trim(),
            invoice_num: String(row[2]).trim(),
            price: parseFloat(row[3]) || 0
          })
        }
      }
    } else if (fileName.endsWith('.csv')) {
      // Parse CSV file
      const text = await file.text()
      rows = parseCSV(text)
    } else {
      return NextResponse.json(
        { error: 'Unsupported file format. Please use CSV or XLSX.' },
        { status: 400 }
      )
    }

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'File is empty or has no valid data' },
        { status: 400 }
      )
    }

    // Use transaction to replace all data
    await sql.begin(async (sql) => {
      // Delete all existing data
      await sql`DELETE FROM invoices`
      await sql`DELETE FROM persons`

      // Group by person to avoid duplicates
      const peopleMap = new Map<string, {
        name: string
        email: string
        invoices: Array<{ invoice_num: string; price: number }>
      }>()

      rows.forEach((row) => {
        const key = `${row.name}|${row.email}`

        if (!peopleMap.has(key)) {
          peopleMap.set(key, {
            name: row.name,
            email: row.email,
            invoices: []
          })
        }

        peopleMap.get(key)!.invoices.push({
          invoice_num: row.invoice_num,
          price: row.price
        })
      })

      // Insert people and their invoices
      for (const [_, personData] of peopleMap) {
        const [person] = await sql<{ id: number }[]>`
          INSERT INTO persons (name, email)
          VALUES (${personData.name}, ${personData.email})
          RETURNING id
        `

        // Insert invoices for this person
        for (const invoice of personData.invoices) {
          await sql`
            INSERT INTO invoices (invoice_num, price, person_id)
            VALUES (${invoice.invoice_num}, ${invoice.price}, ${person.id})
          `
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${rows.length} invoices from ${file.name}`
    })
  } catch (error) {
    console.error('Error importing file:', error)
    return NextResponse.json(
      { error: 'Failed to import file' },
      { status: 500 }
    )
  }
}

// Simple CSV parser
function parseCSV(text: string): Array<{
  name: string
  email: string
  invoice_num: string
  price: number
}> {
  const lines = text.trim().split('\n')

  // Skip header if it exists
  const startIndex = lines[0].toLowerCase().includes('name') ? 1 : 0

  const rows: Array<{
    name: string
    email: string
    invoice_num: string
    price: number
  }> = []

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    // Parse CSV (handle quoted values)
    const values = parseCSVLine(line)

    if (values.length >= 4) {
      rows.push({
        name: values[0].trim(),
        email: values[1].trim(),
        invoice_num: values[2].trim(),
        price: parseFloat(values[3].trim()) || 0
      })
    }
  }

  return rows
}

// Parse a single CSV line, handling quoted values
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
