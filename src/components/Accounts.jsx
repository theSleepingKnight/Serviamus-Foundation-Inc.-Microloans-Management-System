import React, { useState } from 'react';
import { useSystem } from '../context/AppContext';
import { UserPlus, UserX, MapPin, X } from 'lucide-react';
import { BARANGAYS } from '../utils/constants';
import Toast from './ui/Toast';

const Accounts = () => {
    const { staffAccounts, createStaffAccount, updateStaffAccount, deleteStaffAccount, currentUser } = useSystem();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState(null);
    const [newAccount, setNewAccount] = useState({ name: '', email: '', role: 'officer', password: '', barangays: [] });
    const [formError, setFormError] = useState('');
    const [toast, setToast] = useState(null);

    const handleAddSubmit = (e) => {
        e.preventDefault();
        setFormError('');
        if (newAccount.role === 'officer' && (!newAccount.barangays || newAccount.barangays.length === 0)) {
            setFormError('Please select at least one barangay for Loan Officers.');
            return;
        }
        try {
            createStaffAccount(newAccount);
            setIsAddModalOpen(false);
            setNewAccount({ name: '', email: '', role: 'officer', password: '', barangays: [] });
            setToast({ message: 'Staff account created successfully!', type: 'success' });
        } catch (err) {
            setFormError(err.message);
        }
    };

    const handleEditSubmit = (e) => {
        e.preventDefault();
        setFormError('');
        if (!editingAccount) return;
        if (editingAccount.role === 'officer' && (!editingAccount.barangays || editingAccount.barangays.length === 0)) {
            setFormError('Please select at least one barangay for Loan Officers.');
            return;
        }

        try {
            updateStaffAccount(editingAccount.id, {
                name: editingAccount.name,
                email: editingAccount.email,
                role: editingAccount.role,
                password: editingAccount.password,
                barangays: editingAccount.barangays || []
            });
            setEditingAccount(null);
            setToast({ message: 'Staff account updated!', type: 'success' });
        } catch (err) {
            setFormError(err.message);
        }
    };

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this account? This action cannot be undone.')) {
            deleteStaffAccount(id);
            setToast({ message: 'Staff account deleted.', type: 'success' });
        }
    };

    const toggleAccountStatus = (account) => {
        const newStatus = account.status === 'Disabled' ? 'Active' : 'Disabled';
        updateStaffAccount(account.id, { status: newStatus });
        setToast({ message: `Account status set to ${newStatus}.`, type: 'success' });
    };

    return (
        <div className="space-y-6">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800">Staff Management</h2>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg transition-colors font-medium shadow-sm"
                >
                    <UserPlus size={18} />
                    New Staff Account
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {staffAccounts.map((account) => {
                    const isSelf = currentUser && currentUser.id === account.id;
                    const isDisabled = account.status === 'Disabled';

                    return (
                        <div key={account.id} className={`bg-white p-6 rounded-xl shadow-sm border ${isDisabled ? 'border-slate-200 bg-slate-50' : 'border-slate-100'} flex flex-col gap-4 hover:shadow-md transition-shadow relative group`}>
                            {isDisabled && (
                                <div className="absolute top-2 right-2 px-2 py-0.5 bg-slate-200 text-slate-500 text-[10px] font-bold uppercase rounded">
                                    Disabled
                                </div>
                            )}

                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shrink-0
                                    ${isDisabled ? 'bg-slate-200 text-slate-400' :
                                        account.role === 'admin' ? 'bg-purple-100 text-purple-600' :
                                            account.role === 'officer' ? 'bg-blue-100 text-blue-600' :
                                                'bg-indigo-100 text-indigo-600'}`}
                                >
                                    {account.name.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                    <h3 className={`font-bold truncate ${isDisabled ? 'text-slate-500' : 'text-slate-800'}`}>{account.name}</h3>
                                    <p className="text-sm text-slate-500 truncate">{account.email}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="inline-block px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-slate-100 text-slate-600">
                                            {account.role}
                                        </span>
                                        {account.barangays && account.barangays.length > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                                {account.barangays.map(b => (
                                                    <span key={b} className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-600 border border-emerald-100">
                                                        {b}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {!isSelf && (
                                <div className="pt-4 mt-auto border-t border-slate-100 flex gap-2">
                                    <button
                                        onClick={() => setEditingAccount(account)}
                                        className="flex-1 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => toggleAccountStatus(account)}
                                        className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border 
                                            ${isDisabled
                                                ? 'text-green-600 border-green-200 hover:bg-green-50'
                                                : 'text-orange-600 border-orange-200 hover:bg-orange-50'
                                            }`}
                                    >
                                        {isDisabled ? 'Enable' : 'Disable'}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(account.id)}
                                        className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
                                        title="Delete Account"
                                    >
                                        <UserX size={14} />
                                    </button>
                                </div>
                            )}
                            {isSelf && (
                                <div className="pt-4 mt-auto border-t border-slate-100 text-center">
                                    <span className="text-xs text-slate-400 italic">Current User (You)</span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* New Staff Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 animate-in fade-in zoom-in duration-200">
                        <h3 className="text-lg font-bold text-slate-900 mb-4">Create Staff Account</h3>
                        {formError && <div className="p-2 mb-4 text-xs text-red-600 bg-red-50 rounded border border-red-100">{formError}</div>}

                        <form onSubmit={handleAddSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                                <input
                                    required
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                    value={newAccount.name}
                                    onChange={e => setNewAccount({ ...newAccount, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    required
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                    value={newAccount.email}
                                    onChange={e => setNewAccount({ ...newAccount, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                                <select
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-white"
                                    value={newAccount.role}
                                    onChange={e => setNewAccount({ ...newAccount, role: e.target.value })}
                                >
                                    <option value="officer">Loan Officer</option>
                                    <option value="cashier">Cashier</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                                <div className="relative">
                                    <input
                                        type={newAccount.showPassword ? "text" : "password"}
                                        required
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                        value={newAccount.password}
                                        onChange={e => setNewAccount({ ...newAccount, password: e.target.value })}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setNewAccount({ ...newAccount, showPassword: !newAccount.showPassword })}
                                        className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-brand-600 font-medium"
                                    >
                                        {newAccount.showPassword ? "Hide" : "Show"}
                                    </button>
                                </div>
                            </div>

                            {/* Barangay Assignment - Only for Officers */}
                            {newAccount.role === 'officer' && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                                        <MapPin size={14} className="text-slate-400" />
                                        Assigned Barangays <span className="text-red-500">*</span>
                                    </label>
                                    <div className="grid grid-cols-2 gap-2 p-3 border border-slate-200 rounded-lg max-h-40 overflow-y-auto bg-slate-50">
                                        {BARANGAYS.map(b => (
                                            <label key={b} className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer hover:text-brand-600 transition-colors">
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                                                    checked={newAccount.barangays?.includes(b)}
                                                    onChange={e => {
                                                        const updatedB = e.target.checked
                                                            ? [...(newAccount.barangays || []), b]
                                                            : (newAccount.barangays || []).filter(item => item !== b);
                                                        setNewAccount({ ...newAccount, barangays: updatedB });
                                                    }}
                                                />
                                                {b}
                                            </label>
                                        ))}
                                    </div>
                                    <div className="mt-2 flex flex-wrap gap-1">
                                        {newAccount.barangays?.map(b => (
                                            <span key={b} className="inline-flex items-center gap-1 px-2 py-0.5 bg-brand-50 text-brand-700 text-[10px] font-medium rounded-full border border-brand-100">
                                                {b}
                                                <button 
                                                    type="button"
                                                    onClick={() => setNewAccount({ ...newAccount, barangays: newAccount.barangays.filter(item => item !== b) })}
                                                    className="hover:text-red-500"
                                                >
                                                    <X size={10} />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="flex-1 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg transition-colors border border-slate-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg transition-colors shadow-sm"
                                >
                                    Create Account
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Staff Modal */}
            {editingAccount && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 animate-in fade-in zoom-in duration-200">
                        <h3 className="text-lg font-bold text-slate-900 mb-4">Edit Staff Account</h3>
                        {formError && <div className="p-2 mb-4 text-xs text-red-600 bg-red-50 rounded border border-red-100">{formError}</div>}

                        <form onSubmit={handleEditSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                                <input
                                    required
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                    value={editingAccount.name}
                                    onChange={e => setEditingAccount({ ...editingAccount, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    required
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                    value={editingAccount.email}
                                    onChange={e => setEditingAccount({ ...editingAccount, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                                <select
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-white"
                                    value={editingAccount.role}
                                    onChange={e => setEditingAccount({ ...editingAccount, role: e.target.value })}
                                >
                                    <option value="officer">Loan Officer</option>
                                    <option value="cashier">Cashier</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                                <div className="relative">
                                    <input
                                        type={editingAccount.showPassword ? "text" : "password"}
                                        required
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none font-mono text-sm"
                                        value={editingAccount.password}
                                        onChange={e => setEditingAccount({ ...editingAccount, password: e.target.value })}
                                        placeholder="Enter new password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setEditingAccount({ ...editingAccount, showPassword: !editingAccount.showPassword })}
                                        className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-brand-600 font-medium"
                                    >
                                        {editingAccount.showPassword ? "Hide" : "Show"}
                                    </button>
                                </div>
                            </div>

                            {/* Barangay Assignment - Only for Officers */}
                            {editingAccount.role === 'officer' && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                                        <MapPin size={14} className="text-slate-400" />
                                        Assigned Barangays <span className="text-red-500">*</span>
                                    </label>
                                    <div className="grid grid-cols-2 gap-2 p-3 border border-slate-200 rounded-lg max-h-40 overflow-y-auto bg-slate-50">
                                        {BARANGAYS.map(b => (
                                            <label key={b} className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer hover:text-brand-600 transition-colors">
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                                                    checked={editingAccount.barangays?.includes(b)}
                                                    onChange={e => {
                                                        const updatedB = e.target.checked
                                                            ? [...(editingAccount.barangays || []), b]
                                                            : (editingAccount.barangays || []).filter(item => item !== b);
                                                        setEditingAccount({ ...editingAccount, barangays: updatedB });
                                                    }}
                                                />
                                                {b}
                                            </label>
                                        ))}
                                    </div>
                                    <div className="mt-2 flex flex-wrap gap-1">
                                        {editingAccount.barangays?.map(b => (
                                            <span key={b} className="inline-flex items-center gap-1 px-2 py-0.5 bg-brand-50 text-brand-700 text-[10px] font-medium rounded-full border border-brand-100">
                                                {b}
                                                <button 
                                                    type="button"
                                                    onClick={() => setEditingAccount({ ...editingAccount, barangays: editingAccount.barangays.filter(item => item !== b) })}
                                                    className="hover:text-red-500"
                                                >
                                                    <X size={10} />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setEditingAccount(null)}
                                    className="flex-1 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg transition-colors border border-slate-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg transition-colors shadow-sm"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Accounts;
