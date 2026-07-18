import EmptyState from './EmptyState'
import Loader from './Loader'

/**
 * columns: [{ key, header, render?(row) }]
 */
export default function DataTable({ columns, data, loading, emptyMessage = 'No records found', rowKey = 'id' }) {
  if (loading) return <Loader />
  if (!data || data.length === 0) return <EmptyState title={emptyMessage} />

  return (
    <div className="overflow-x-auto rounded-lg border border-stone-200">
      <table className="min-w-full divide-y divide-stone-200 text-sm">
        <thead className="bg-stone-50">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="whitespace-nowrap px-4 py-3 text-left font-semibold text-stone-600"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100 bg-white">
          {data.map((row) => (
            <tr key={row[rowKey]} className="hover:bg-stone-50">
              {columns.map((col) => (
                <td key={col.key} className="whitespace-nowrap px-4 py-3 text-stone-700">
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
