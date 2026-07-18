import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabaseClient'
import DataTable from '../../components/common/DataTable'
import StatusBadge from '../../components/common/StatusBadge'
import AssignTaskModal from '../../components/common/AssignTaskModal'
import { Button, Select, PageHeader } from '../../components/common/FormControls'

export default function StaffAdmin() {
  const [staff, setStaff] = useState([])
  const [customers, setCustomers] = useState([])
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [assignOpen, setAssignOpen] = useState(false)
  const [promoteId, setPromoteId] = useState('')

  const load = async () => {
    setLoading(true)
    const [{ data: staffData, error: staffError }, { data: customerData }, { data: taskData }] = await Promise.all([
      supabase.from('profiles').select('*').eq('role', 'staff').order('full_name'),
      supabase.from('profiles').select('*').eq('role', 'customer').order('full_name'),
      supabase.from('staff_tasks').select('*, staff:profiles(full_name)').order('assigned_date', { ascending: false }),
    ])
    if (staffError) console.error('Failed to load staff', staffError)
    setStaff(staffData ?? [])
    setCustomers(customerData ?? [])
    setTasks(taskData ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const handlePromote = async () => {
    if (!promoteId) return
    const { error } = await supabase.from('profiles').update({ role: 'staff' }).eq('id', promoteId)
    if (error) {
      toast.error('Could not update role')
      return
    }
    toast.success('User promoted to staff')
    setPromoteId('')
    load()
  }

  return (
    <div>
      <PageHeader
        title="Staff"
        description="Manage staff members and assign tasks"
        actions={<Button onClick={() => setAssignOpen(true)} disabled={staff.length === 0}>+ Assign task</Button>}
      />

      <div className="mb-6 flex items-end gap-2 rounded-lg border border-stone-200 bg-white p-4">
        <Select label="Promote a customer to staff" value={promoteId} onChange={(e) => setPromoteId(e.target.value)} className="flex-1">
          <option value="">Select a customer</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>{c.full_name || c.id.slice(0, 8)}</option>
          ))}
        </Select>
        <Button onClick={handlePromote} disabled={!promoteId}>Promote</Button>
      </div>

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
          { key: 'assigned_date', header: 'Assigned', render: (row) => new Date(row.assigned_date).toLocaleDateString() },
          { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
        ]}
      />

      {assignOpen && (
        <AssignTaskModal staffList={staff} onClose={() => setAssignOpen(false)} onAssigned={load} />
      )}
    </div>
  )
}
