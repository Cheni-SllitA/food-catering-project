import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../contexts/AuthContext'
import DataTable from '../../components/common/DataTable'
import StatusBadge from '../../components/common/StatusBadge'
import { Select, PageHeader } from '../../components/common/FormControls'
import { TASK_STATUS } from '../../lib/constants'

export default function StaffTasks() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('staff_tasks')
      .select('*, reservation:catering_reservations(event_date, event_location)')
      .eq('staff_id', user.id)
      .order('assigned_date', { ascending: false })
    if (error) console.error('Failed to load tasks', error)
    setTasks(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id])

  const updateStatus = async (task, status) => {
    const payload = { status }
    if (status === 'completed') payload.completed_date = new Date().toISOString()
    const { error } = await supabase.from('staff_tasks').update(payload).eq('id', task.id)
    if (error) {
      toast.error('Could not update task')
      return
    }
    toast.success('Task updated')
    load()
  }

  return (
    <div>
      <PageHeader title="My Tasks" description="Tasks assigned to you" />
      <DataTable
        loading={loading}
        data={tasks}
        emptyMessage="No tasks assigned to you yet"
        columns={[
          { key: 'title', header: 'Task' },
          { key: 'description', header: 'Description', render: (row) => row.description || '-' },
          {
            key: 'reservation',
            header: 'Event',
            render: (row) => row.reservation ? `${row.reservation.event_location} — ${row.reservation.event_date ? new Date(row.reservation.event_date).toLocaleDateString() : ''}` : '-',
          },
          { key: 'assigned_date', header: 'Assigned', render: (row) => new Date(row.assigned_date).toLocaleDateString() },
          {
            key: 'status',
            header: 'Status',
            render: (row) => (
              row.status === 'completed' ? (
                <StatusBadge status={row.status} />
              ) : (
                <Select value={row.status} onChange={(e) => updateStatus(row, e.target.value)} className="py-1">
                  {Object.values(TASK_STATUS).map((s) => (
                    <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                  ))}
                </Select>
              )
            ),
          },
        ]}
      />
    </div>
  )
}
