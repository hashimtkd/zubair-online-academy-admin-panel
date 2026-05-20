import React, { useState } from 'react';
import { 
  Trash2, 
  UserX, 
  UserCheck, 
  Mail, 
  Calendar,
  AlertCircle 
} from 'lucide-react';
import { 
  useCollectionQuery, 
  useUpdateMutation, 
  useDeleteMutation 
} from '../hooks/useFirestore';
import type { AdminUser } from '../types';
import { useAuth } from '../context/AuthContext';
import { TableSkeleton } from '../components/ui/Skeleton';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { ConfirmDialog } from '../components/shared/ConfirmDialog';
import { EmptyState } from '../components/shared/EmptyState';
import { useToast } from '../components/ui/Toast';

export const AdminUsers: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();

  // Queries & Mutations
  const { data: admins = [], isLoading } = useCollectionQuery<AdminUser>('admins');
  const updateMutation = useUpdateMutation('admins');
  const deleteMutation = useDeleteMutation('admins');

  // Confirmation Dialogue States
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'disable' | 'enable' | null>(null);

  // Sorting
  const sortedAdmins = [...admins].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const handleStatusToggle = async () => {
    if (!actioningId || !actionType) return;
    const newStatus = actionType === 'disable' ? 'disabled' : 'active';
    
    try {
      await updateMutation.mutateAsync({
        id: actioningId,
        data: { status: newStatus }
      });
      toast(`Admin status set to ${newStatus} successfully.`, 'success');
    } catch (err) {
      toast('Failed to update admin status.', 'error');
    } finally {
      setActioningId(null);
      setActionType(null);
    }
  };

  const handleDeleteAdmin = async () => {
    if (!confirmDeleteId) return;
    try {
      await deleteMutation.mutateAsync(confirmDeleteId);
      toast('Admin record removed successfully.', 'success');
    } catch (err) {
      toast('Failed to delete admin.', 'error');
    } finally {
      setConfirmDeleteId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Title / Info bar */}
      <div>
        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Super Admin Controls</p>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-50 mt-1">Admin Management</h2>
      </div>

      {/* Manual Admin Addition Guidance Notice */}
      <div className="flex gap-3.5 p-4 rounded-xl border border-yellow-250/45 dark:border-yellow-950/40 bg-yellow-50/20 dark:bg-yellow-950/5 text-yellow-800 dark:text-yellow-400 text-xs leading-relaxed">
        <AlertCircle className="w-5 h-5 shrink-0 text-yellow-550" />
        <div className="space-y-1">
          <span className="font-bold">Database Admin Management Notice</span>
          <p>
            You cannot directly invite or register new administrators from this panel. New accounts must be manually added to the Firebase Authentication console, and their corresponding profile metadata document created inside the <code className="bg-slate-100 dark:bg-slate-900 px-1 py-0.5 rounded font-mono text-[10px]">admins</code> Cloud Firestore collection using their matching Auth UID.
          </p>
        </div>
      </div>

      {/* Main Table view */}
      {isLoading ? (
        <TableSkeleton rows={3} cols={4} />
      ) : sortedAdmins.length === 0 ? (
        <EmptyState
          title="No Administrators Registered"
          description="There are currently no administrator records registered in the database."
        />
      ) : (
        <Card className="p-0 overflow-hidden border border-slate-100 dark:border-slate-850/80">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-950/20 text-xs font-semibold text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-850/60">
                  <th className="py-4 pl-6 font-semibold">User</th>
                  <th className="py-4 pr-4 font-semibold">Role Badge</th>
                  <th className="py-4 pr-4 font-semibold">Account Status</th>
                  <th className="py-4 pr-4 font-semibold">Registered Date</th>
                  <th className="py-4 pr-6 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850/20">
                {sortedAdmins.map((adm) => {
                  const isSelf = adm.id === currentUser?.id;
                  return (
                    <tr key={adm.id} className="text-sm text-slate-600 dark:text-slate-350 hover:bg-slate-50/20 dark:hover:bg-slate-900/10 transition-colors">
                      <td className="py-4.5 pl-6 flex items-center gap-3">
                        {/* Avatar */}
                        <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-850 border border-slate-200/50 dark:border-slate-800 flex items-center justify-center font-bold text-slate-400 shrink-0">
                          {adm.fullName[0].toUpperCase()}
                        </div>
                        {/* Name Info */}
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-slate-900 dark:text-slate-100 truncate">
                            {adm.fullName} {isSelf && <span className="text-[10px] text-green-500 font-bold bg-green-500/10 px-1.5 py-0.5 rounded-md ml-1">You</span>}
                          </span>
                          <span className="text-[11px] text-slate-400 truncate flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" />
                            {adm.email}
                          </span>
                        </div>
                      </td>
                      <td className="py-4.5 pr-4">
                        {adm.role === 'super_admin' ? (
                          <Badge variant="purple">Super Admin</Badge>
                        ) : (
                          <Badge variant="info">Admin</Badge>
                        )}
                      </td>
                      <td className="py-4.5 pr-4">
                        {adm.status === 'active' ? (
                          <Badge variant="success">Active</Badge>
                        ) : (
                          <Badge variant="neutral">Disabled</Badge>
                        )}
                      </td>
                      <td className="py-4.5 pr-4">
                        <span className="text-xs text-slate-500 flex items-center gap-1 font-semibold">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {new Date(adm.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                        </span>
                      </td>
                      <td className="py-4.5 pr-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Disable / Enable Toggle */}
                          {adm.status === 'active' ? (
                            <button
                              onClick={() => {
                                setActioningId(adm.id);
                                setActionType('disable');
                              }}
                              disabled={isSelf}
                              title={isSelf ? "You cannot disable your own profile" : "Disable administrator account"}
                              className="p-1.5 rounded-lg border border-slate-100 hover:border-slate-200 dark:border-slate-800 dark:hover:border-slate-700 bg-white dark:bg-slate-900 text-slate-500 hover:text-red-500 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                            >
                              <UserX className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setActioningId(adm.id);
                                setActionType('enable');
                              }}
                              title="Re-enable administrator account"
                              className="p-1.5 rounded-lg border border-slate-100 hover:border-green-200 dark:border-slate-800 dark:hover:border-green-900/30 bg-white dark:bg-slate-900 text-slate-450 hover:text-green-600 dark:hover:text-green-400 transition-colors cursor-pointer"
                            >
                              <UserCheck className="w-4 h-4" />
                            </button>
                          )}
                          
                          {/* Delete Account */}
                          <button
                            onClick={() => setConfirmDeleteId(adm.id)}
                            disabled={isSelf}
                            title={isSelf ? "You cannot delete your own profile" : "Delete administrator profile"}
                            className="p-1.5 rounded-lg border border-slate-100 hover:border-red-200 dark:border-slate-800 dark:hover:border-red-900/30 bg-white dark:bg-slate-900 text-slate-450 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* CONFIRM STATUS TOGGLE DIALOG */}
      <ConfirmDialog
        isOpen={!!actioningId && !!actionType}
        onClose={() => { setActioningId(null); setActionType(null); }}
        onConfirm={handleStatusToggle}
        title={actionType === 'disable' ? 'Suspend Administrator Account' : 'Reactivate Administrator Account'}
        description={`Are you sure you want to ${actionType} this administrator profile? Suspended admins will be locked out of the dashboard.`}
        confirmText={actionType === 'disable' ? 'Suspend' : 'Activate'}
        variant={actionType === 'disable' ? 'danger' : 'primary'}
        isLoading={updateMutation.isPending}
      />

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        isOpen={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={handleDeleteAdmin}
        title="Delete Administrator Profile"
        description="Are you sure you want to permanently delete this administrator profile document? This action is irreversible."
        confirmText="Delete"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />

    </div>
  );
};
export default AdminUsers;
