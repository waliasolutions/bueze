-- Drop the existing "FOR ALL" policy and create separate explicit policies
DROP POLICY IF EXISTS "Lead owners can manage own leads" ON public.leads;

-- Explicit INSERT policy for authenticated users
CREATE POLICY "Authenticated users can create leads"
  ON public.leads
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

-- Separate UPDATE policy for owners
CREATE POLICY "Lead owners can update own leads"
  ON public.leads
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Separate DELETE policy for owners
CREATE POLICY "Lead owners can delete own leads"
  ON public.leads
  FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);