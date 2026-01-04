import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Handle Next.js 15+ params (can be a Promise)
    const resolvedParams = await Promise.resolve(params)
    const transferId = resolvedParams.id

    if (!transferId) {
      return NextResponse.json(
        { error: 'Transfer ID is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user role
    const userResult = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single() as { data: { role: string } | null }
    const userData = userResult.data

    if (!userData || userData.role !== 'hospital') {
      return NextResponse.json(
        { error: 'Only hospitals can cancel transfer requests' },
        { status: 403 }
      )
    }

    // Get the transfer to verify ownership
    const transferResult = await supabase
      .from('transfers')
      .select('id, from_hospital_id, status')
      .eq('id', transferId)
      .single() as { data: { id: string; from_hospital_id: string | null; status: string } | null; error: any }
    const transfer = transferResult.data
    const transferError = transferResult.error

    if (transferError || !transfer) {
      return NextResponse.json(
        { error: 'Transfer not found' },
        { status: 404 }
      )
    }

    // Verify the hospital is the sender (from_hospital_id)
    if (transfer.from_hospital_id !== user.id) {
      return NextResponse.json(
        { error: 'Only the sending hospital can cancel this transfer request' },
        { status: 403 }
      )
    }

    // Only allow canceling if status is 'requested'
    if (transfer.status !== 'requested') {
      return NextResponse.json(
        { error: `Cannot cancel transfer with status: ${transfer.status}. Only 'requested' transfers can be cancelled.` },
        { status: 400 }
      )
    }

    // Update transfer status to 'cancelled'
    const { error: updateError } = await (supabase
      .from('transfers') as any)
      .update({ status: 'cancelled' })
      .eq('id', transferId)

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message || 'Failed to cancel transfer' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'Transfer request cancelled successfully' },
      { status: 200 }
    )
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

