export interface CSVImportResponse {
  message: string
  error?: string
}

export interface CSVImportError {
  error: string
}

export class CSVImportService {
  private static readonly IMPORT_ENDPOINT = '/api/import'

  static async importCSV(file: File): Promise<CSVImportResponse> {
    if (!file.name.endsWith('.csv')) {
      throw new Error('Please upload a CSV file')
    }

    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(this.IMPORT_ENDPOINT, {
      method: 'POST',
      body: formData
    })

    const data: CSVImportResponse | CSVImportError = await response.json()

    if (!response.ok) {
      throw new Error('error' in data ? data.error : 'Failed to import CSV')
    }

    return data
  }
}
