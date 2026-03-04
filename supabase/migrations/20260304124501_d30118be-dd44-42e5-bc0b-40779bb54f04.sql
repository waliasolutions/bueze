
DROP POLICY "Admins can manage all subscriptions" ON handwerker_subscriptions;
DROP POLICY "Admins can view all subscriptions" ON handwerker_subscriptions;

CREATE POLICY "Admins can manage all subscriptions" ON handwerker_subscriptions
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins can view all subscriptions" ON handwerker_subscriptions
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));
