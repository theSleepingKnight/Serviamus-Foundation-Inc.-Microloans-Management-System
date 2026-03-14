import React, { useState } from 'react';
import { useSystem } from '../context/AppContext';
import { Search, UserPlus, MoreVertical, Edit2, UserX, UserCheck, ChevronLeft, ChevronRight, MapPin, ArrowRightLeft, Users, PiggyBank, TrendingUp, Filter, Eye } from 'lucide-react';
import { BARANGAYS } from '../utils/constants';
import Toast from './ui/Toast';

const ITEMS_PER_PAGE = 10;

const Customers = () => {
    const { customers, toggleCustomerStatus, addNewCustomer, updateCustomer, loanGroups, loans, transferCustomer } = useSystem();
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [transferringCustomer, setTransferringCustomer] = useState(null);
    const [transferData, setTransferData] = useState({ barangay: '', groupId: '' });
    const [toast, setToast] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [barangayFilter, setBarangayFilter] = useState('All');
    const [viewingCustomer, setViewingCustomer] = useState(null);

    // New Customer State
    const [newCustomer, setNewCustomer] = useState({
        lastName: '', firstName: '', middleName: '', extension: '',
        email: '', mobileNumber: '', address: '', barangay: '',
        familyRefName: '', familyRefContact: '',
        colleagueRefName: '', colleagueRefContact: '',
        cbuBalance: '', sdBalance: ''
    });
    const [formError, setFormError] = useState('');

    // Filtering
    const filteredCustomers = customers.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            c.phone.includes(searchTerm);
        const matchesBarangay = barangayFilter === 'All' || c.barangay === barangayFilter;
        return matchesSearch && matchesBarangay;
    });

    // Stats calculations
    const stats = {
        total: customers.length,
        active: customers.filter(c => c.status === 'Active').length,
        totalCBU: customers.reduce((acc, c) => acc + (Number(c.cbuBalance) || 0), 0),
        totalSD: customers.reduce((acc, c) => acc + (Number(c.sdBalance) || 0), 0)
    };

    // Pagination
    const totalPages = Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE);
    const displayedCustomers = filteredCustomers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const handleAddSubmit = (e) => {
        e.preventDefault();
        setFormError('');

        // Strict Validation
        if (!newCustomer.lastName || !newCustomer.firstName || !newCustomer.middleName || !newCustomer.mobileNumber || !newCustomer.address || !newCustomer.barangay) {
            setFormError('Please fill in all required fields, including Barangay.');
            return;
        }

        const hasFamilyRef = newCustomer.familyRefName && newCustomer.familyRefContact;
        const hasColleagueRef = newCustomer.colleagueRefName && newCustomer.colleagueRefContact;

        if (!hasFamilyRef && !hasColleagueRef) {
            setFormError('Please provide at least one complete reference (Family or Work Colleague).');
            return;
        }

        // Construct full name: Last, First Middle Extension
        const fullName = `${newCustomer.lastName}, ${newCustomer.firstName} ${newCustomer.middleName} ${newCustomer.extension}`.trim();

        addNewCustomer({
            ...newCustomer,
            name: fullName,
            phone: newCustomer.mobileNumber
        });

        setIsAddModalOpen(false);
        setNewCustomer({
            lastName: '', firstName: '', middleName: '', extension: '',
            email: '', mobileNumber: '', address: '',
            familyRefName: '', familyRefContact: '',
            colleagueRefName: '', colleagueRefContact: '',
            cbuBalance: '', sdBalance: ''
        });
        setToast({ message: 'Customer registered successfully!', type: 'success' });
    };

    const handleEditSubmit = (e) => {
        e.preventDefault();
        if (editingCustomer) {
            updateCustomer(editingCustomer.id, {
                name: editingCustomer.name,
                email: editingCustomer.email,
                phone: editingCustomer.phone,
                barangay: editingCustomer.barangay,
                cbuBalance: Number(editingCustomer.cbuBalance) || 0,
                sdBalance: Number(editingCustomer.sdBalance) || 0
            });
            setEditingCustomer(null);
            setToast({ message: 'Customer details updated.', type: 'success' });
        }
    };

    const handleToggleStatus = (customer) => {
        const action = customer.status === 'Active' ? 'disable' : 'enable';
        if (window.confirm(`Are you sure you want to ${action} this customer?`)) {
            toggleCustomerStatus(customer.id);
            setToast({ message: `Customer status updated to ${action}d.`, type: 'success' });
        }
    };

    const handleTransferSubmit = (e) => {
        e.preventDefault();
        if (transferringCustomer && transferData.barangay) {
            transferCustomer(transferringCustomer.id, transferData.barangay, transferData.groupId);
            setTransferringCustomer(null);
            setTransferData({ barangay: '', groupId: '' });
            setToast({ message: 'Customer transfer processed successfully.', type: 'success' });
        }
    };

    const getCustomerLoan = (id) => loans.find(l => l.customerId === id && (l.status === 'Active' || l.status === 'Pending'));

    return (
        <div className="space-y-6">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Customer Database</h2>
                    <p className="text-sm text-slate-500 font-medium">Manage member profiles and financial balances</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-xl transition-all font-bold shadow-lg shadow-brand-100 active:scale-95"
                >
                    <UserPlus size={18} />
                    Register New Customer
                </button>
            </div>

            {/* Quick Stats Header */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600">
                        <Users size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Members</p>
                        <h4 className="text-xl font-black text-slate-900">{stats.total}</h4>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                        <UserCheck size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Active Accounts</p>
                        <h4 className="text-xl font-black text-slate-900">{stats.active}</h4>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
                        <PiggyBank size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Total CBU</p>
                        <h4 className="text-xl font-black text-slate-900">₱{stats.totalCBU.toLocaleString()}</h4>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Total SD</p>
                        <h4 className="text-xl font-black text-slate-900">₱{stats.totalSD.toLocaleString()}</h4>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-5 border-b border-slate-100 bg-slate-50/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative max-w-xs w-full">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search by name, email, phone..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 w-full text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all bg-white"
                            />
                        </div>
                        <div className="h-8 w-px bg-slate-200 hidden md:block"></div>
                        <div className="flex items-center gap-2">
                            <Filter size={14} className="text-slate-400" />
                            <select 
                                value={barangayFilter}
                                onChange={(e) => setBarangayFilter(e.target.value)}
                                className="text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-brand-500"
                            >
                                <option value="All">All Barangays</option>
                                {BARANGAYS.map(b => <option key={b} value={b}>{b}</option>)}
                            </select>
                        </div>
                    </div>
                    
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-tighter bg-white px-3 py-1.5 rounded-lg border border-slate-100">
                        Found {filteredCustomers.length} Records
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4">Customer</th>
                                <th className="px-6 py-4">Contact</th>
                                <th className="px-6 py-4">Capital & Savings</th>
                                <th className="px-6 py-4">Joined Date</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {displayedCustomers.map((customer) => (
                                <tr key={customer.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold text-xs">
                                                {customer.name && customer.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-900">{customer.name}</p>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-500">{customer.id}</span>
                                                    <span className="flex items-center gap-1 text-[10px] text-brand-600 font-medium bg-brand-50 px-1.5 py-0.5 rounded">
                                                        <MapPin size={10} />
                                                        {customer.barangay || 'No Barangay'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-slate-700">{customer.email}</p>
                                        <p className="text-xs text-slate-500">{customer.phone}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center justify-between text-[11px]">
                                                <span className="text-slate-500 font-medium">CBU:</span>
                                                <span className="text-slate-900 font-bold">₱{Math.round(customer.cbuBalance || 0).toLocaleString()}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-[11px]">
                                                <span className="text-slate-500 font-medium">SD:</span>
                                                <span className="text-indigo-600 font-bold">₱{Math.round(customer.sdBalance || 0).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">
                                        {customer.joinedDate}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                                            ${customer.status === 'Active'
                                                ? 'bg-green-50 text-green-700 border-green-100'
                                                : 'bg-slate-100 text-slate-600 border-slate-200'
                                            }`}
                                        >
                                            {customer.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => setViewingCustomer(customer)}
                                                className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                                title="View Profile"
                                            >
                                                <Eye size={16} />
                                            </button>
                                            <button
                                                onClick={() => setEditingCustomer(customer)}
                                                className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                                                title="Edit"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setTransferringCustomer(customer);
                                                    setTransferData({ 
                                                        barangay: customer.barangay, 
                                                        groupId: getCustomerLoan(customer.id)?.groupId || '' 
                                                    });
                                                }}
                                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                title="Transfer"
                                            >
                                                <ArrowRightLeft size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleToggleStatus(customer)}
                                                className={`p-1.5 rounded-lg transition-colors ${customer.status === 'Active'
                                                    ? 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                                                    : 'text-slate-400 hover:text-green-600 hover:bg-green-50'
                                                    }`}
                                                title={customer.status === 'Active' ? 'Disable' : 'Enable'}
                                            >
                                                {customer.status === 'Active' ? <UserX size={16} /> : <UserCheck size={16} />}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="p-4 border-t border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <span className="text-xs text-slate-500">Page {currentPage} of {totalPages}</span>
                        <div className="flex gap-2">
                            <button
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(p => p - 1)}
                                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-white disabled:opacity-50"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(p => p + 1)}
                                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-white disabled:opacity-50"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Add Customer Modal (Same as before but with Toast integration via handleAddSubmit) */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 animate-in fade-in zoom-in duration-200 my-8">
                        <h3 className="text-lg font-bold text-slate-900 mb-6 pb-2 border-b border-slate-100">Registration Form</h3>
                        {formError && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-center gap-2">
                                <span className="font-bold">Error:</span> {formError}
                            </div>
                        )}
                        <form onSubmit={handleAddSubmit} className="space-y-6">
                            {/* Personal Information */}
                            <div>
                                <h4 className="text-sm font-semibold text-slate-900 mb-3 uppercase tracking-wider">Personal Information & Address</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 mb-1">Last Name <span className="text-red-500">*</span></label>
                                        <input
                                            required
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                            value={newCustomer.lastName}
                                            onChange={e => setNewCustomer({ ...newCustomer, lastName: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 mb-1">First Name <span className="text-red-500">*</span></label>
                                        <input
                                            required
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                            value={newCustomer.firstName}
                                            onChange={e => setNewCustomer({ ...newCustomer, firstName: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 mb-1">Middle Name <span className="text-red-500">*</span></label>
                                        <input
                                            required
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                            value={newCustomer.middleName}
                                            onChange={e => setNewCustomer({ ...newCustomer, middleName: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 mb-1">Extension</label>
                                        <input
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                            value={newCustomer.extension}
                                            placeholder="e.g. Jr, III (Optional)"
                                            onChange={e => setNewCustomer({ ...newCustomer, extension: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                            {/* Contact Information */}
                            <div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 mb-1">Email Address</label>
                                        <input
                                            type="email"
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                            value={newCustomer.email}
                                            onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 mb-1">Mobile Number <span className="text-red-500">*</span></label>
                                        <input
                                            required
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                            value={newCustomer.mobileNumber}
                                            onChange={e => setNewCustomer({ ...newCustomer, mobileNumber: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 mb-1">Complete Address <span className="text-red-500">*</span></label>
                                        <textarea
                                            required
                                            rows="2"
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none resize-none"
                                            value={newCustomer.address}
                                            onChange={e => setNewCustomer({ ...newCustomer, address: e.target.value })}
                                        ></textarea>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 mb-1">Barangay <span className="text-red-500">*</span></label>
                                        <select
                                            required
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-white"
                                            value={newCustomer.barangay}
                                            onChange={e => setNewCustomer({ ...newCustomer, barangay: e.target.value })}
                                        >
                                            <option value="">Select Barangay</option>
                                            {BARANGAYS.map(b => (
                                                <option key={b} value={b}>{b}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                            {/* References */}
                            <div>
                                <h4 className="text-sm font-semibold text-slate-900 mb-3 uppercase tracking-wider flex justify-between items-center">
                                    References
                                    <span className="text-[10px] text-slate-500 font-normal normal-case italic bg-slate-100 px-2 py-0.5 rounded">At least one required</span>
                                </h4>
                                <div className="space-y-4">
                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                        <p className="text-xs font-bold text-slate-700 mb-2">Family Reference</p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <input
                                                placeholder="Name"
                                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-white"
                                                value={newCustomer.familyRefName}
                                                onChange={e => setNewCustomer({ ...newCustomer, familyRefName: e.target.value })}
                                            />
                                            <input
                                                placeholder="Contact Number"
                                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-white"
                                                value={newCustomer.familyRefContact}
                                                onChange={e => setNewCustomer({ ...newCustomer, familyRefContact: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                        <p className="text-xs font-bold text-slate-700 mb-2">Work Colleague Reference</p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <input
                                                placeholder="Name"
                                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-white"
                                                value={newCustomer.colleagueRefName}
                                                onChange={e => setNewCustomer({ ...newCustomer, colleagueRefName: e.target.value })}
                                            />
                                            <input
                                                placeholder="Contact Number"
                                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-white"
                                                value={newCustomer.colleagueRefContact}
                                                onChange={e => setNewCustomer({ ...newCustomer, colleagueRefContact: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Initial Balances */}
                            <div>
                                <h4 className="text-sm font-semibold text-slate-900 mb-3 uppercase tracking-wider">Initial Balances (Optional)</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                        <label className="block text-xs font-medium text-slate-700 mb-1">Starting CBU (₱)</label>
                                        <input
                                            type="number"
                                            placeholder="0.00"
                                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-white font-mono"
                                            value={newCustomer.cbuBalance}
                                            onChange={e => setNewCustomer({ ...newCustomer, cbuBalance: e.target.value })}
                                        />
                                    </div>
                                    <div className="bg-indigo-50/50 p-3 rounded-lg border border-indigo-100">
                                        <label className="block text-xs font-medium text-slate-700 mb-1">Starting Savings - SD (₱)</label>
                                        <input
                                            type="number"
                                            placeholder="0.00"
                                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-white font-mono"
                                            value={newCustomer.sdBalance}
                                            onChange={e => setNewCustomer({ ...newCustomer, sdBalance: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-8 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => { setIsAddModalOpen(false); setFormError(''); }}
                                    className="flex-1 py-2.5 text-slate-600 font-medium hover:bg-slate-50 rounded-lg transition-colors border border-slate-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg transition-colors shadow-sm"
                                >
                                    Complete Registration
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Customer Modal */}
            {editingCustomer && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
                        <h3 className="text-lg font-bold text-slate-900 mb-4">Edit Customer</h3>
                        <form onSubmit={handleEditSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                                <input
                                    required
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                    value={editingCustomer.name}
                                    onChange={e => setEditingCustomer({ ...editingCustomer, name: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        required
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                        value={editingCustomer.email}
                                        onChange={e => setEditingCustomer({ ...editingCustomer, email: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                                    <input
                                        required
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                        value={editingCustomer.phone}
                                        onChange={e => setEditingCustomer({ ...editingCustomer, phone: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Barangay</label>
                                <select
                                    required
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-white"
                                    value={editingCustomer.barangay}
                                    onChange={e => setEditingCustomer({ ...editingCustomer, barangay: e.target.value })}
                                >
                                    <option value="">Select Barangay</option>
                                    {BARANGAYS.map(b => (
                                        <option key={b} value={b}>{b}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-50">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-500 mb-1">CBU Balance (₱)</label>
                                    <input
                                        type="number"
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 font-mono"
                                        value={editingCustomer.cbuBalance}
                                        onChange={e => setEditingCustomer({ ...editingCustomer, cbuBalance: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-indigo-500 mb-1">Savings - SD (₱)</label>
                                    <input
                                        type="number"
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-indigo-50/20 font-mono"
                                        value={editingCustomer.sdBalance}
                                        onChange={e => setEditingCustomer({ ...editingCustomer, sdBalance: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setEditingCustomer(null)}
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
            {/* Transfer Modal */}
            {transferringCustomer && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                                <ArrowRightLeft size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Transfer Customer</h3>
                                <p className="text-xs text-slate-500">Relocate {transferringCustomer.name}</p>
                            </div>
                        </div>

                        {getCustomerLoan(transferringCustomer.id) && (
                            <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                <p className="text-xs font-bold text-amber-800 flex items-center gap-2">
                                    ⚠️ Active Loan Detected
                                </p>
                                <p className="text-[10px] text-amber-700 mt-1">
                                    This customer has an active loan. Transferring will also relocate the loan and update the assigned officer.
                                </p>
                            </div>
                        )}

                        <form onSubmit={handleTransferSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Target Barangay</label>
                                <select
                                    required
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-white text-sm"
                                    value={transferData.barangay}
                                    onChange={e => setTransferData({ ...transferData, barangay: e.target.value, groupId: '' })}
                                >
                                    {BARANGAYS.map(b => (
                                        <option key={b} value={b}>{b}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Target Group (Optional)</label>
                                <select
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-white text-sm"
                                    value={transferData.groupId}
                                    onChange={e => setTransferData({ ...transferData, groupId: e.target.value })}
                                >
                                    <option value="">No Group (Independent)</option>
                                    {loanGroups
                                        .filter(g => g.barangay === transferData.barangay && g.status === 'Active' && g.loanIds.length < 5)
                                        .map(g => (
                                            <option key={g.id} value={g.id}>{g.name} ({g.loanIds.length}/5)</option>
                                        ))
                                    }
                                </select>
                            </div>

                            <div className="flex gap-3 mt-8">
                                <button
                                    type="button"
                                    onClick={() => setTransferringCustomer(null)}
                                    className="flex-1 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg transition-colors border border-slate-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors shadow-sm"
                                >
                                    Confirm Transfer
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Customer Profile View Modal */}
            {viewingCustomer && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl p-0 overflow-hidden animate-in zoom-in duration-200">
                        {/* Header Section */}
                        <div className="bg-slate-50 p-8 border-b border-slate-100 flex items-start justify-between">
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 rounded-3xl bg-brand-600 text-white flex items-center justify-center text-3xl font-black shadow-xl shadow-brand-100">
                                    {viewingCustomer.name.charAt(0)}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${viewingCustomer.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                                            Account {viewingCustomer.status}
                                        </span>
                                        <span className="text-[10px] font-bold text-slate-400 font-mono">ID: {viewingCustomer.id}</span>
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900 leading-tight">{viewingCustomer.name}</h3>
                                    <div className="flex items-center gap-3 mt-2 text-sm text-slate-500 font-medium">
                                        <span className="flex items-center gap-1.5"><MapPin size={14} className="text-brand-500" /> {viewingCustomer.barangay}</span>
                                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                        <span>Joined {viewingCustomer.joinedDate}</span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setViewingCustomer(null)} className="p-2 text-slate-400 hover:text-slate-600 bg-white border border-slate-200 rounded-xl">×</button>
                        </div>

                        {/* Content Grid */}
                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Financial Info */}
                            <div className="space-y-6">
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">Financial Standing</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100">
                                        <p className="text-[10px] font-black text-amber-600 uppercase mb-1">CBU Balance</p>
                                        <p className="text-xl font-black text-slate-900 leading-none">₱{(Number(viewingCustomer.cbuBalance) || 0).toLocaleString()}</p>
                                    </div>
                                    <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
                                        <p className="text-[10px] font-black text-indigo-600 uppercase mb-1">SD Balance</p>
                                        <p className="text-xl font-black text-slate-900 leading-none">₱{(Number(viewingCustomer.sdBalance) || 0).toLocaleString()}</p>
                                    </div>
                                </div>
                                
                                <div className="p-5 bg-white border border-slate-100 rounded-2xl flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500">
                                            <TrendingUp size={20} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">Current Loan</p>
                                            <p className="text-sm font-black text-slate-900">
                                                {getCustomerLoan(viewingCustomer.id) ? `₱${getCustomerLoan(viewingCustomer.id).amount.toLocaleString()} Active` : 'No Active Loan'}
                                            </p>
                                        </div>
                                    </div>
                                    {getCustomerLoan(viewingCustomer.id) && (
                                        <span className="text-[10px] font-black px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-md">
                                            #{getCustomerLoan(viewingCustomer.id).id}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Contact & References */}
                            <div className="space-y-6">
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">Contact & References</h4>
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                                            <Eye size={16} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase underline">Contact Details</p>
                                            <p className="text-sm font-bold text-slate-700">{viewingCustomer.phone}</p>
                                            <p className="text-xs text-slate-500">{viewingCustomer.email || 'No email provided'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                                            <Users size={16} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase underline">Family Reference</p>
                                            <p className="text-sm font-bold text-slate-700">{viewingCustomer.familyRefName || 'Not Set'}</p>
                                            <p className="text-xs text-slate-500">{viewingCustomer.familyRefContact || 'No contact'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                                            <UserPlus size={16} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase underline">Work Reference</p>
                                            <p className="text-sm font-bold text-slate-700">{viewingCustomer.colleagueRefName || 'Not Set'}</p>
                                            <p className="text-xs text-slate-500">{viewingCustomer.colleagueRefContact || 'No contact'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="bg-slate-50 p-6 flex justify-end gap-3 border-t border-slate-100">
                            <button
                                onClick={() => {
                                    setEditingCustomer(viewingCustomer);
                                    setViewingCustomer(null);
                                }}
                                className="px-6 py-2.5 bg-white text-slate-700 font-bold rounded-xl border border-slate-200 hover:bg-slate-100 transition-all flex items-center gap-2"
                            >
                                <Edit2 size={16} />
                                Edit Basic Info
                            </button>
                            <button
                                onClick={() => setViewingCustomer(null)}
                                className="px-6 py-2.5 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-all shadow-lg shadow-brand-100"
                            >
                                Close Profile
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Customers;
