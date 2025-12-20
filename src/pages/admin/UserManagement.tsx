import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, UserPlus, Edit, Trash2, Search, Shield, Key, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';

interface User {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
  role: string;
}

const AVAILABLE_ROLES = [
  { value: 'user', label: 'Kunde (Legacy)', description: 'Kunde/Auftraggeber - erstellt Leads' },
  { value: 'client', label: 'Kunde', description: 'Kunde/Auftraggeber - erstellt Leads' },
  { value: 'handwerker', label: 'Handwerker', description: 'Handwerker - antwortet auf Leads' },
  { value: 'admin', label: 'Administrator', description: 'Administrator mit erweiterten Rechten' },
  { value: 'super_admin', label: 'Super Administrator', description: 'Vollzugriff auf System und Benutzerverwaltung' },
];

const getRoleBadgeVariant = (role: string) => {
  switch (role) {
    case 'super_admin':
      return 'default';
    case 'admin':
      return 'secondary';
    default:
      return 'outline';
  }
};

export default function UserManagement() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('user');
  const [editUserRole, setEditUserRole] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false);
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null);
  const [generatedPassword, setGeneratedPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isSuperAdmin, loading: roleLoading } = useUserRole();

  useEffect(() => {
    if (!roleLoading && !isSuperAdmin) {
      toast({
        title: 'Zugriff verweigert',
        description: 'Nur Super Administratoren können auf diese Seite zugreifen.',
        variant: 'destructive',
      });
      navigate('/dashboard');
      return;
    }
    
    if (!roleLoading && isSuperAdmin) {
      loadUsers();
    }
  }, [roleLoading, isSuperAdmin]);

  useEffect(() => {
    // Filter users based on search query
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredUsers(
        users.filter(
          (user) =>
            user.email.toLowerCase().includes(query) ||
            user.full_name.toLowerCase().includes(query) ||
            user.role.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, users]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      // Fetch all profiles with their roles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name, created_at')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Create a map of user roles
      const rolesMap = new Map(rolesData.map((r) => [r.user_id, r.role]));

      // Combine profiles with roles
      const usersWithRoles = profilesData.map((profile) => ({
        ...profile,
        role: rolesMap.get(profile.id) || 'user',
      }));

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: 'Fehler',
        description: 'Benutzer konnten nicht geladen werden.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!newUserEmail.trim()) {
      toast({
        title: 'Fehler',
        description: 'Bitte geben Sie eine E-Mail-Adresse ein.',
        variant: 'destructive',
      });
      return;
    }

    setActionLoading(true);
    try {
      // Check if user already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', newUserEmail.trim())
        .maybeSingle();

      if (existingProfile) {
        toast({
          title: 'Fehler',
          description: 'Ein Benutzer mit dieser E-Mail-Adresse existiert bereits.',
          variant: 'destructive',
        });
        setActionLoading(false);
        return;
      }

      // Note: In a real application, you would need to trigger user creation through an edge function
      // that has admin privileges. For now, we'll just show a message.
      toast({
        title: 'Hinweis',
        description: 'Benutzererstellung muss über Supabase Admin-Panel erfolgen. Sie können hier nur bestehende Benutzer verwalten.',
        variant: 'destructive',
      });

      setIsAddDialogOpen(false);
      setNewUserEmail('');
      setNewUserRole('user');
    } catch (error) {
      console.error('Error adding user:', error);
      toast({
        title: 'Fehler',
        description: 'Fehler beim Hinzufügen des Benutzers.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;

    setActionLoading(true);
    try {
      // First, delete the old role
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', selectedUser.id)
        .eq('role', selectedUser.role as any);

      // Then insert the new role
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: selectedUser.id, role: editUserRole as any });

      if (error) throw error;

      toast({
        title: 'Erfolg',
        description: 'Benutzerrolle wurde erfolgreich aktualisiert.',
      });

      setIsEditDialogOpen(false);
      setSelectedUser(null);
      await loadUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: 'Fehler',
        description: 'Fehler beim Aktualisieren der Benutzerrolle.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setActionLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { userId },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (error) throw error;

      toast({
        title: 'Benutzer gelöscht',
        description: 'Benutzer und alle zugehörigen Daten wurden vollständig gelöscht.',
      });

      await loadUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Fehler',
        description: error.message || 'Fehler beim Löschen des Benutzers.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetPasswordConfirm = async () => {
    if (!resetPasswordUser) return;

    setActionLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('reset-user-password', {
        body: {
          userId: resetPasswordUser.id,
          userEmail: resetPasswordUser.email,
          userName: resetPasswordUser.full_name || resetPasswordUser.email,
        },
      });

      if (error) throw error;

      if (data?.newPassword) {
        setGeneratedPassword(data.newPassword);
      }

      toast({
        title: 'Passwort zurückgesetzt',
        description: `Das Passwort für ${resetPasswordUser.email} wurde zurückgesetzt.`,
      });
    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast({
        title: 'Fehler',
        description: error.message || 'Beim Zurücksetzen des Passworts ist ein Fehler aufgetreten.',
        variant: 'destructive',
      });
      setShowResetPasswordDialog(false);
      setResetPasswordUser(null);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCopyPassword = () => {
    if (generatedPassword) {
      navigator.clipboard.writeText(generatedPassword);
      toast({
        title: 'Kopiert',
        description: 'Passwort wurde in die Zwischenablage kopiert.',
      });
    }
  };

  const handleCloseResetDialog = () => {
    setShowResetPasswordDialog(false);
    setResetPasswordUser(null);
    setGeneratedPassword('');
    setShowPassword(false);
  };

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setEditUserRole(user.role);
    setIsEditDialogOpen(true);
  };

  if (loading) {
    return (
      <AdminLayout title="Benutzerverwaltung" description="Verwalten Sie Benutzer und deren Rollen im System">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Benutzerverwaltung" description="Verwalten Sie Benutzer und deren Rollen im System">
      <div className="flex items-center justify-end mb-8">
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
                <Button className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  Benutzer hinzufügen
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Neuen Benutzer hinzufügen</DialogTitle>
                  <DialogDescription>
                    Hinweis: Benutzererstellung erfolgt über Supabase Admin-Panel
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">E-Mail</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      placeholder="benutzer@beispiel.ch"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Rolle</Label>
                    <Select value={newUserRole} onValueChange={setNewUserRole}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {AVAILABLE_ROLES.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            <div>
                              <div className="font-medium">{role.label}</div>
                              <div className="text-xs text-muted-foreground">{role.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Abbrechen
                  </Button>
                  <Button onClick={handleAddUser} disabled={actionLoading}>
                    {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Hinzufügen
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Alle Benutzer</CardTitle>
                  <CardDescription>
                    {filteredUsers.length} {filteredUsers.length === 1 ? 'Benutzer' : 'Benutzer'} gefunden
                  </CardDescription>
                </div>
                <div className="w-72">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Benutzer suchen..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>E-Mail</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Rolle</TableHead>
                    <TableHead>Erstellt am</TableHead>
                    <TableHead className="text-right">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.email}</TableCell>
                      <TableCell>{user.full_name || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {AVAILABLE_ROLES.find((r) => r.value === user.role)?.label || user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString('de-CH')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(user)}
                            title="Rolle bearbeiten"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setResetPasswordUser(user);
                              setShowResetPasswordDialog(true);
                            }}
                            title="Passwort zurücksetzen"
                          >
                            <Key className="h-4 w-4 text-orange-600" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" title="Benutzer löschen" disabled={actionLoading}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                                  <AlertTriangle className="h-5 w-5" />
                                  Benutzer endgültig löschen?
                                </AlertDialogTitle>
                                <AlertDialogDescription className="space-y-3">
                                  <div className="rounded-md bg-destructive/10 p-3 border border-destructive/20">
                                    <p className="font-semibold text-destructive">ACHTUNG: Diese Aktion kann nicht rückgängig gemacht werden!</p>
                                  </div>
                                  <p>
                                    <strong>{user.full_name || user.email}</strong> wird unwiderruflich gelöscht.
                                  </p>
                                  <p className="text-sm">Folgende Daten werden entfernt:</p>
                                  <ul className="list-disc list-inside text-sm space-y-1">
                                    <li>Benutzerprofil und Konto</li>
                                    <li>Alle Nachrichten und Konversationen</li>
                                    <li>Alle Aufträge und Angebote</li>
                                    <li>Handwerker-Profil (falls vorhanden)</li>
                                    <li>Bewertungen und Abonnements</li>
                                  </ul>
                                  <p className="text-sm text-muted-foreground mt-2">
                                    Die E-Mail-Adresse kann danach neu registriert werden.
                                  </p>
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Entfernen
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredUsers.length === 0 && (
                <EmptyState 
                  variant="users"
                  title={searchQuery ? 'Keine Benutzer gefunden' : 'Noch keine Benutzer vorhanden'}
                  description={searchQuery 
                    ? 'Versuchen Sie einen anderen Suchbegriff.'
                    : 'Neue Benutzer werden hier angezeigt, sobald sie sich registrieren.'}
                />
              )}
            </CardContent>
          </Card>

        {/* Edit User Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Benutzerrolle bearbeiten</DialogTitle>
              <DialogDescription>
                Ändern Sie die Rolle für {selectedUser?.email}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-role">Rolle</Label>
                <Select value={editUserRole} onValueChange={setEditUserRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_ROLES.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        <div>
                          <div className="font-medium">{role.label}</div>
                          <div className="text-xs text-muted-foreground">{role.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleEditUser} disabled={actionLoading}>
                {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Speichern
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reset Password Dialog */}
        <AlertDialog open={showResetPasswordDialog} onOpenChange={setShowResetPasswordDialog}>
          <AlertDialogContent className="max-w-lg">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                Passwort zurücksetzen
              </AlertDialogTitle>
              <AlertDialogDescription>
                {!generatedPassword ? (
                  <>
                    Möchten Sie wirklich das Passwort für <strong>{resetPasswordUser?.email}</strong> zurücksetzen?
                    <br /><br />
                    Ein neues sicheres Passwort wird generiert und per E-Mail an den Benutzer gesendet.
                  </>
                ) : (
                  <div className="space-y-4 text-left">
                    <p className="text-foreground">
                      Das Passwort wurde erfolgreich zurückgesetzt für:
                      <br />
                      <strong>{resetPasswordUser?.email}</strong>
                    </p>
                    <div className="bg-muted p-4 rounded-lg space-y-2">
                      <p className="text-sm font-medium">Neues Passwort:</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 bg-background px-3 py-2 rounded border font-mono text-sm">
                          {showPassword ? generatedPassword : '••••••••••••••••'}
                        </code>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setShowPassword(!showPassword)}
                          title={showPassword ? 'Passwort verbergen' : 'Passwort anzeigen'}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button size="sm" onClick={handleCopyPassword}>
                          Kopieren
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Falls die E-Mail nicht angekommen ist, können Sie das Passwort kopieren und dem Benutzer manuell mitteilen.
                    </p>
                  </div>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              {!generatedPassword ? (
                <>
                  <AlertDialogCancel onClick={handleCloseResetDialog}>Abbrechen</AlertDialogCancel>
                  <AlertDialogAction onClick={handleResetPasswordConfirm} disabled={actionLoading}>
                    {actionLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Wird zurückgesetzt...
                      </>
                    ) : (
                      'Passwort zurücksetzen'
                    )}
                </AlertDialogAction>
              </>
            ) : (
              <Button onClick={handleCloseResetDialog} className="w-full">
                Schliessen
              </Button>
            )}
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </AdminLayout>
  );
}