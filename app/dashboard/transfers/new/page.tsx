import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth'
import NewTransferForm from '@/components/NewTransferForm'

export default async function NewTransferPage() {
  // Only hospitals can create transfer requests
  await requireRole('hospital')

  return <NewTransferForm />
}
