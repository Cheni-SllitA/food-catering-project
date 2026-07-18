import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function load() {
      const { data, error } = await supabase.from('food_categories').select('*').order('category_name')
      if (!mounted) return
      if (error) console.error('Failed to load categories', error)
      setCategories(data ?? [])
      setLoading(false)
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  return { categories, loading }
}
