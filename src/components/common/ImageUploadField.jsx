import { useState } from 'react'
import toast from 'react-hot-toast'
import { uploadImage } from '../../lib/storage'

export default function ImageUploadField({ label = 'Image', value, onChange, folder }) {
  const [uploading, setUploading] = useState(false)

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadImage(file, folder)
      onChange(url)
      toast.success('Image uploaded')
    } catch (err) {
      console.error('Failed to upload image', err)
      toast.error('Could not upload image')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-stone-700">{label}</span>
      <div className="flex items-center gap-3">
        {value && <img src={value} alt="" className="h-14 w-14 rounded-md object-cover" />}
        <input type="file" accept="image/*" onChange={handleFile} disabled={uploading} className="text-sm" />
        {uploading && <span className="text-xs text-stone-500">Uploading...</span>}
      </div>
    </div>
  )
}
