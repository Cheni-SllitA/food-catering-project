import { useEffect, useState } from 'react'
import { formatLKR } from '../../lib/format'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../contexts/AuthContext'
import Loader from '../../components/common/Loader'
import EmptyState from '../../components/common/EmptyState'
import { Button } from '../../components/common/FormControls'

export default function PackageDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [pkg, setPkg] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      const [{ data: pkgData, error: pkgError }, { data: itemsData, error: itemsError }] = await Promise.all([
        supabase.from('catering_packages').select('*').eq('id', id).single(),
        supabase.from('package_items').select('*').eq('package_id', id),
      ])
      if (!mounted) return
      if (pkgError) console.error('Failed to load package', pkgError)
      if (itemsError) console.error('Failed to load package items', itemsError)
      setPkg(pkgData ?? null)
      setItems(itemsData ?? [])
      setLoading(false)
    }
    load()
    return () => {
      mounted = false
    }
  }, [id])

  if (loading) return <Loader />
  if (!pkg) return <EmptyState title="Package not found" action={<Link to="/packages" className="text-primary-600">Back to packages</Link>} />

  const handleReserve = () => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: `/reserve/${pkg.id}` } } })
      return
    }
    navigate(`/reserve/${pkg.id}`)
  }

  return (
    <div>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="aspect-video overflow-hidden rounded-lg bg-stone-100">
          {pkg.image_url ? (
            <img src={pkg.image_url} alt={pkg.package_name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-stone-400">No image</div>
          )}
        </div>
        <div>
          <h1 className="text-3xl font-bold text-stone-900">{pkg.package_name}</h1>
          <p className="mt-4 text-2xl font-semibold text-stone-900">{formatLKR(pkg.price)}</p>
          <p className="mt-2 text-sm text-stone-500">
            {pkg.minimum_people}-{pkg.maximum_people} guests
          </p>
          <p className="mt-4 text-stone-600">{pkg.description}</p>
          <Button className="mt-6" onClick={handleReserve}>
            Reserve this package
          </Button>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="mb-4 text-lg font-semibold text-stone-900">What's included</h2>
        {items.length === 0 ? (
          <p className="text-sm text-stone-500">No item details available for this package.</p>
        ) : (
          <ul className="divide-y divide-stone-100 rounded-lg border border-stone-200 bg-white">
            {items.map((item) => (
              <li key={item.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="text-stone-700">
                  {item.item_name}
                  {item.notes && <span className="text-stone-400"> — {item.notes}</span>}
                </span>
                <span className="text-stone-500">{item.quantity != null ? `× ${item.quantity}` : ''}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
