import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import DataTable from '../../components/common/DataTable'
import StatusBadge from '../../components/common/StatusBadge'
import CreateStaffModal from '../../components/common/CreateStaffModal'
import AssignTaskModal from '../../components/common/AssignTaskModal'
import { Button, PageHeader } from '../../components/common/FormControls'

export default function TasksManager() {
  const [tasks, setTasks] = useState([])
  const [staff, setStaff] = useState([])
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [assignOpen, setAssignOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [createStaffOpen, setCreateStaffOpen] = useState(false)

  const load = async () => {
    setLoading(true)
    const [{ data: taskData, error: taskError }, { data: staffData }, { data: reservationData }] = await Promise.all([
      supabase.from('staff_tasks').select('*, staff:profiles(full_name), reservation:catering_reservations(event_date, event_location)').order('assigned_date', { ascending: false }),
      supabase.from('profiles').select('*').eq('role', 'staff').order('full_name'),
      supabase.from('catering_reservations').select('*, package:catering_packages(package_name)').order('event_date', { ascending: false }),
    ])
    if (taskError) console.error('Failed to load tasks', taskError)
    setTasks(taskData ?? [])
    setStaff(staffData ?? [])
    setReservations(reservationData ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div>
      <PageHeader
        title="Staff & Tasks"
        description="Create staff accounts and assign event tasks"
        actions={
          <>
            <Button variant="secondary" onClick={() => setCreateStaffOpen(true)}>+ Add Staff</Button>
            <Button onClick={() => setAssignOpen(true)} disabled={staff.length === 0}>+ Assign task</Button>
          </>
        }
      />

      <h2 className="mb-2 text-lg font-semibold text-stone-900">Staff members</h2>
      <DataTable
        loading={loading}
        data={staff}
        emptyMessage="No staff members yet"
        columns={[
          { key: 'full_name', header: 'Name', render: (row) => row.full_name || '-' },
          { key: 'address', header: 'Address', render: (row) => row.address || '-' },
          { key: 'phone', header: 'Phone', render: (row) => row.phone || '-' },
        ]}
      />

      <h2 className="mb-2 mt-8 text-lg font-semibold text-stone-900">Assigned tasks</h2>
      <DataTable
        loading={loading}
        data={tasks}
        emptyMessage="No tasks assigned yet"
        columns={[
          { key: 'title', header: 'Task' },
          { key: 'staff', header: 'Assigned to', render: (row) => row.staff?.full_name || '-' },
          { key: 'reservation', header: 'Event', render: (row) => row.reservation ? `${row.reservation.event_location} — ${row.reservation.event_date ? new Date(row.reservation.event_date).toLocaleDateString() : ''}` : '-' },
          { key: 'assigned_date', header: 'Date', render: (row) => new Date(row.assigned_date).toLocaleString() },
          { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
          {
            key: 'actions',
            header: '',
            render: (row) => (
              <button className="text-primary-600 hover:underline" onClick={() => setEditingTask(row)}>Edit</button>
            ),
          },
        ]}
      />

      {createStaffOpen && (
        <CreateStaffModal onClose={() => setCreateStaffOpen(false)} onCreated={load} />
      )}

      {assignOpen && (
        <AssignTaskModal staffList={staff} reservations={reservations} onClose={() => setAssignOpen(false)} onAssigned={load} />
      )}

      {editingTask && (
        <AssignTaskModal staffList={staff} reservations={reservations} task={editingTask} onClose={() => setEditingTask(null)} onAssigned={load} />
      )}
    </div>
  )
}
