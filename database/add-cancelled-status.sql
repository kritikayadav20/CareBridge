-- Add 'cancelled' status to transfers table check constraint

-- First, drop the existing constraint
ALTER TABLE public.transfers 
DROP CONSTRAINT IF EXISTS transfers_status_check;

-- Add the new constraint with 'cancelled' included
ALTER TABLE public.transfers 
ADD CONSTRAINT transfers_status_check 
CHECK (status IN ('requested', 'accepted', 'completed', 'cancelled'));

