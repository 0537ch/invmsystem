'use client'

import { useEffect, useState } from 'react'

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

  function formatInvoices(invoices: Invoice[]) {
    return invoices
      .map(inv => {
        const price = typeof inv.price === 'string' ? parseFloat(inv.price) : inv.price
        return `${inv.invoice_num} ($${price.toFixed(2)})`
      })
      .join(', ')
  }

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
        No data yet. Import a CSV file to get started.
      </div>
    )
  }

  const grandTotal = people.reduce((sum, person) => {
    const total = typeof person.total === 'string' ? parseFloat(person.total) : person.total
    return sum + total
  }, 0)

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">
          {people.length} {people.length === 1 ? 'Person' : 'People'}
        </h2>
        <div className="text-xl font-semibold text-gray-700">
          Grand Total: ${grandTotal.toFixed(2)}
        </div>
      </div>

      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Invoices
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {people.map((person) => (
              <tr key={person.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {person.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {person.email}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 max-w-md">
                  <div className="break-words">
                    {formatInvoices(person.invoices)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-semibold">
                  ${(typeof person.total === 'string' ? parseFloat(person.total) : person.total).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
