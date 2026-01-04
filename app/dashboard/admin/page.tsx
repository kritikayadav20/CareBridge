import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/auth'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import AdminCreateAccountForm from '@/components/AdminCreateAccountForm'

export default async function AdminPage() {
  const user = await requireAdmin()

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setCreating(true)

    try {
      const response = await fetch('/api/admin/create-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        // Show detailed error if available
        const errorMsg = data.details 
          ? `${data.error}\n\nDetails: ${data.details}` 
          : data.error || 'Failed to create account'
        throw new Error(errorMsg)
      }

      setSuccess(`Account created successfully! Email: ${formData.email}`)
      setFormData({
        email: '',
        password: '',
        fullName: '',
        phone: '',
        role: 'doctor',
      })
    } catch (err: any) {
      setError(err.message || 'Failed to create account')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/dashboard" className="text-2xl font-bold text-slate-800">
              CareBridge
            </Link>
            <Link href="/dashboard" className="text-sm text-slate-600 hover:text-slate-900">
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Admin Panel</h1>
          <p className="text-slate-600 mt-1">Create hospital accounts</p>
        </div>

        <Card>
          <h3 className="text-xl font-semibold text-slate-900 mb-6">Create Hospital Account</h3>
          <p className="text-sm text-slate-600 mb-4">
            Hospital accounts can then admit patients and create doctor accounts.
          </p>
          <AdminCreateAccountForm />
        </Card>
      </div>
    </div>
  )
}

