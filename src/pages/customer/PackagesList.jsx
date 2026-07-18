import { useEffect, useState } from 'react'
import { formatLKR } from '../../lib/format'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import Loader from '../../components/common/Loader'
import EmptyState from '../../components/common/EmptyState'

export default function PackagesList() {
  const [packages, setPackages] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      const { data, error } = await supabase
        .from('catering_packages')
        .select('*')
        .eq('is_active', true)
        .order('package_name')
      if (!mounted) return
      if (error) console.error('Failed to load packages', error)
      setPackages(data ?? [])
      setLoading(false)
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-900">Catering Packages</h1>
        <p className="text-sm text-stone-500">Perfect for events of any size</p>
      </div>

      {loading ? (
        <Loader />
      ) : packages.length === 0 ? (
        <EmptyState title="No packages available" />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {packages.map((pkg) => (
            <Link
              key={pkg.id}
              to={`/packages/${pkg.id}`}
              className="flex flex-col overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm transition hover:shadow-md"
            >
              <div className="aspect-video overflow-hidden bg-stone-100">
                {pkg.image_url ? (
                  <img src={pkg.image_url} alt={pkg.package_name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-stone-400">No image</div>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-2 p-4">
                <h2 className="font-semibold text-stone-900">{pkg.package_name}</h2>
                <p className="line-clamp-2 text-sm text-stone-500">{pkg.description}</p>
                <div className="mt-auto flex items-center justify-between pt-2 text-sm">
                  <span className="text-stone-500">
                    {pkg.minimum_people}-{pkg.maximum_people} guests
                  </span>
                  <span className="text-lg font-semibold text-stone-900">
                    {formatLKR(pkg.price)}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
