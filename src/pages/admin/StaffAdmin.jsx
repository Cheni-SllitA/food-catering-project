import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabaseClient'
import DataTable from '../../components/common/DataTable'
import StatusBadge from '../../components/common/StatusBadge'
import Modal from '../../components/common/Modal'
import AssignTaskModal from '../../components/common/AssignTaskModal'
import { Button, Select, PageHeader } from '../../components/common/FormControls'

export default function StaffAdmin() {
  const [staff, setStaff] = useState([])
  const [customers, setCustomers] = useState([])
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [assignOpen, setAssignOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [addStaffOpen, setAddStaffOpen] = useState(false)
  const [promoteId, setPromoteId] = useState('')
  const [promoting, setPromoting] = useState(false)

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

  const handleAddStaff = async () => {
    if (!promoteId) return
    setPromoting(true)
    const { error } = await supabase.from('profiles').update({ role: 'staff' }).eq('id', promoteId)
    setPromoting(false)
    if (error) {
      toast.error('Could not add staff member')
      return
    }
    toast.success('Staff member added')
    setPromoteId('')
    setAddStaffOpen(false)
    load()
  }

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
            <Button variant="secondary" onClick={() => setAddStaffOpen(true)}>+ Add Staff</Button>
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

      {addStaffOpen && (
        <Modal open onClose={() => setAddStaffOpen(false)} title="Add staff member">
          <p className="mb-4 text-sm text-stone-500">
            New staff must already have a customer account (they sign up like any customer).
            Promote one of your existing customers to staff below.
          </p>
          <div className="flex flex-col gap-4">
            <Select label="Customer" value={promoteId} onChange={(e) => setPromoteId(e.target.value)}>
              <option value="">Select a customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.full_name || c.id.slice(0, 8)}</option>
              ))}
            </Select>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setAddStaffOpen(false)}>Cancel</Button>
              <Button onClick={handleAddStaff} disabled={!promoteId || promoting}>
                {promoting ? 'Adding...' : 'Add Staff'}
              </Button>
            </div>
          </div>
        </Modal>
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
