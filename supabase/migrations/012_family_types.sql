-- Migration 012: Add family_type to families table
ALTER TABLE public.families 
ADD COLUMN IF NOT EXISTS family_type TEXT DEFAULT 'church' 
CHECK (family_type IN ('church', 'sunday_school'));

-- Default existing families to 'sunday_school' since the feature was mostly used for that initially
UPDATE public.families SET family_type = 'sunday_school' WHERE family_type IS NULL OR family_type = 'church';
