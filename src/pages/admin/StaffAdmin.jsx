import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabaseClient'
import DataTable from '../../components/common/DataTable'
import StatusBadge from '../../components/common/StatusBadge'
import CreateStaffModal from '../../components/common/CreateStaffModal'
import AssignTaskModal from '../../components/common/AssignTaskModal'
import { Button, PageHeader } from '../../components/common/FormControls'

export default function StaffAdmin() {
  const [staff, setStaff] = useState([])
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [assignOpen, setAssignOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [createStaffOpen, setCreateStaffOpen] = useState(false)

  const load = async () => {
    setLoading(true)
    const [{ data: staffData, error: staffError }, { data: taskData }] = await Promise.all([
      supabase.from('profiles').select('*').eq('role', 'staff').order('full_name'),
      supabase.from('staff_tasks').select('*, staff:profiles(full_name)').order('assigned_date', { ascending: false }),
    ])
    if (staffError) console.error('Failed to load staff', staffError)
    setStaff(staffData ?? [])
    setTasks(taskData ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const handleRemoveStaff = async (member) => {
    if (!confirm(`Remove "${member.full_name || 'this user'}" from staff? Their account reverts to a regular customer.`)) return
    const { error } = await supabase.from('profiles').update({ role: 'customer' }).eq('id', member.id)
    if (error) {
      toast.error('Could not remove staff member')
      return
    }
    toast.success('Staff member removed')
    load()
  }

  return (
    <div>
      <PageHeader
        title="Staff"
        description="Manage staff members and assign tasks"
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
          {
            key: 'actions',
            header: '',
            render: (row) => (
              <button className="text-red-600 hover:underline" onClick={() => handleRemoveStaff(row)}>Remove</button>
            ),
          },
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
        <AssignTaskModal staffList={staff} onClose={() => setAssignOpen(false)} onAssigned={load} />
      )}

      {editingTask && (
        <AssignTaskModal staffList={staff} task={editingTask} onClose={() => setEditingTask(null)} onAssigned={load} />
      )}
    </div>
  )
}
