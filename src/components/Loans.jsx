import React, { useState, useMemo } from 'react';
import { useSystem } from '../context/AppContext';
import { CheckCircle, Search, Plus, Edit2, Calendar, ChevronLeft, ChevronRight, FileText, Users, Layers, MapPin, LayoutGrid, List, User, FileSpreadsheet, Settings, AlertTriangle, RotateCcw, Archive } from 'lucide-react';
import { LOAN_TYPES, LOAN_STATUS_COLORS, BARANGAYS } from '../utils/constants';
import Toast from './ui/Toast';
import { exportCollectionSheet, exportGroupReportPDF } from '../utils/exportUtils';

const ITEMS_PER_PAGE = 10;

const Loans = () => {
    const { 
        loans, customers, staffAccounts, loanGroups, currentUser, canAccess, settings, updateSettings,
        createLoan, updateLoanStatus, updateLoan, createLoanGroup, getOfficerCapacity, resetSystemData, updateLoanGroup, approveLoan,
        transactions
    } = useSystem();

    // UI State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAddGroupModalOpen, setIsAddGroupModalOpen] = useState(false);
    const [editingLoan, setEditingLoan] = useState(null);
    const [scheduleModalLoan, setScheduleModalLoan] = useState(null);
    const [isFeesModalOpen, setIsFeesModalOpen] = useState(false);
    const [tempFees, setTempFees] = useState(settings);
    const [toast, setToast] = useState(null);
    const [archiveConfirmGroup, setArchiveConfirmGroup] = useState(null);

    // Filter & Search State
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [barangayFilter, setBarangayFilter] = useState('All');
    const [viewMode, setViewMode] = useState('groups'); // 'list' or 'groups'
    const [currentPage, setCurrentPage] = useState(1);

    // Form State
    const [newLoan, setNewLoan] = useState({ 
        customerId: '', 
        loanType: 'REGULAR', 
        amount: '', 
        term: '',
        groupId: '',
        officerId: ''
    });
    const [newGroup, setNewGroup] = useState({ name: '', barangay: '', officerId: '' });
    const [formError, setFormError] = useState('');

    const getCustomerName = (id) => customers.find(c => c.id === id)?.name || 'Unknown';
    const getOfficerName = (id) => staffAccounts.find(s => s.id === id)?.name || 'Unknown';
    const getGroupName = (id) => loanGroups.find(g => g.id === id)?.name || 'N/A';

    const canManageGroup = (group) => {
        if (!currentUser || !group) return false;
        if (currentUser.role === 'admin') return true;
        if (currentUser.role === 'officer') {
            return currentUser.barangays?.includes(group.barangay);
        }
        return false;
    };

    const isMemberOverdue = (loanId) => {
        const loan = loans.find(l => l.id === loanId);
        if (!loan || loan.status !== 'Active') return false;
        const loanTxns = transactions.filter(t => t.loanId === loanId).sort((a,b) => new Date(b.date) - new Date(a.date));
        const lastDate = loanTxns[0] ? new Date(loanTxns[0].date) : new Date(loan.startDate);
        const diff = Math.floor((new Date() - lastDate) / (1000 * 60 * 60 * 24));
        return diff > 7;
    };

    // Derived State for Creation Form
    const selectedCustomer = useMemo(() => 
        customers.find(c => c.id === newLoan.customerId), 
    [newLoan.customerId, customers]);

    const availableGroups = useMemo(() => {
        if (!selectedCustomer) return [];
        return loanGroups.filter(g => g.barangay === selectedCustomer.barangay && g.status === 'Active' && g.loanIds.length < 5);
    }, [selectedCustomer, loanGroups]);

    const getCustomerLoanStatus = (customerId) => {
        const activeLoan = loans.find(l => l.customerId === customerId && (l.status === 'Active' || l.status === 'Pending'));
        return activeLoan ? activeLoan.status : null;
    };

    const availableOfficers = useMemo(() => {
        const b = newGroup.barangay || selectedCustomer?.barangay;
        if (!b) return [];
        return staffAccounts.filter(s => 
            (s.role === 'officer' || s.role === 'admin') && 
            s.status !== 'Disabled' && 
            s.barangays && 
            s.barangays.includes(b)
        );
    }, [newGroup.barangay, selectedCustomer, staffAccounts]);

    const generateGroupName = (barangay) => {
        if (!barangay) return '';
        const existingInBarangay = loanGroups.filter(g => g.barangay === barangay).length;
        const groupNum = existingInBarangay + 1;
        const now = new Date();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = now.getFullYear();
        return `${barangay}_Group ${groupNum}_${month}_${year}`;
    };

    // --- Handlers ---
    
    const handleCreateLoan = (e) => {
        e.preventDefault();
        setFormError('');

        if (!newLoan.customerId || !newLoan.groupId || !newLoan.officerId) {
            setFormError('Please select a customer, group, and loan officer.');
            return;
        }

        const typeConfig = LOAN_TYPES[newLoan.loanType];
        const amount = Number(newLoan.amount);
        const term = Number(newLoan.term);

        if (amount > typeConfig.max) {
            setFormError(`Maximum amount for ${typeConfig.label} is ₱${typeConfig.max.toLocaleString()}`);
            return;
        }

        // Verify group capacity one last time
        const group = loanGroups.find(g => g.id === newLoan.groupId);
        if (group && group.loanIds.length >= 5) {
            setFormError('This group is already full (max 5 loans). Please select or create another group.');
            return;
        }

        createLoan({
            ...newLoan,
            loanType: typeConfig.label,
            amount,
            principal: amount,
            interestRate: typeConfig.rate,
            term
        });

        setIsModalOpen(false);
        setNewLoan({ customerId: '', loanType: 'REGULAR', amount: '', term: '', groupId: '', officerId: '' });
        setToast({ message: 'Loan application created and assigned to group!', type: 'success' });
    };

    const handleCreateGroup = (e) => {
        e.preventDefault();
        if (!newGroup.name || !newGroup.officerId) return;
        
        const created = createLoanGroup({
            ...newGroup,
            barangay: newGroup.barangay // Taken from the new dropdown
        });
        
        setNewLoan({ ...newLoan, groupId: created.id, officerId: created.officerId });
        setIsAddGroupModalOpen(false);
        setNewGroup({ name: '', barangay: '', officerId: '' });
        setToast({ message: 'New Loan Group created!', type: 'success' });
    };

    const calculateAmortization = (amount, rate, term, type) => {
        if (type === 'Multi-Purpose Loan' || rate === 0) {
            const weeklyPayment = amount / term;
            const schedule = [];
            let balance = amount;
            for (let i = 1; i <= term; i++) {
                balance -= weeklyPayment;
                schedule.push({ period: i, payment: weeklyPayment, principal: weeklyPayment, interest: 0, balance: Math.max(0, balance) });
            }
            return schedule;
        }
        const effectiveWeeklyRate = (rate / 100) / 4.345;
        const weeklyPayment = (amount * effectiveWeeklyRate) / (1 - Math.pow(1 + effectiveWeeklyRate, -term));
        let balance = amount;
        const schedule = [];
        for (let i = 1; i <= term; i++) {
            const interest = balance * effectiveWeeklyRate;
            const principal = weeklyPayment - interest;
            balance -= principal;
            schedule.push({ period: i, payment: weeklyPayment, principal, interest, balance: Math.max(0, balance) });
        }
        return schedule;
    };

    // --- Filtering ---
    const filteredLoans = loans.filter(l => {
        const customer = customers.find(c => c.id === l.customerId);
        const matchesSearch = l.id.toLowerCase().includes(searchTerm.toLowerCase()) || customer?.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' || l.status === statusFilter;
        const matchesBarangay = barangayFilter === 'All' || customer?.barangay === barangayFilter;
        return matchesSearch && matchesStatus && matchesBarangay;
    });

    const totalPages = Math.ceil(filteredLoans.length / ITEMS_PER_PAGE);
    const displayedLoans = filteredLoans.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    return (
        <div className="space-y-6">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Loans Management</h2>
                    <p className="text-slate-500 text-sm">Manage group-based disbursements and officer assignments.</p>
                </div>
                <div className="flex items-center gap-2">
                    {canAccess('admin') && (
                        <button
                            onClick={() => {
                                setTempFees(settings);
                                setIsFeesModalOpen(true);
                            }}
                            className="flex items-center gap-2 text-slate-500 hover:text-slate-800 px-3 py-2 rounded-lg transition-all hover:bg-slate-100 text-sm font-medium"
                        >
                            <Settings size={18} />
                            Update Fees
                        </button>
                    )}
                    {canAccess(['admin', 'officer']) && (
                        <>
                            <button
                                onClick={() => {
                                    setNewGroup({ name: '', barangay: '', officerId: '' });
                                    setIsAddGroupModalOpen(true);
                                }}
                                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg transition-colors text-sm font-bold shadow-sm"
                            >
                                <Plus size={18} />
                                New Group
                            </button>
                            <button
                                onClick={() => {
                                    setNewLoan({ customerId: '', loanType: 'REGULAR', amount: '', term: '', groupId: '', officerId: '' });
                                    setIsModalOpen(true);
                                }}
                                className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-bold shadow-sm"
                            >
                                <Plus size={18} />
                                New Loan
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Toolbar */}
            <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-2">
                <div className="flex-1 flex gap-2">
                    <div className="relative flex-1 max-w-xs">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search borrower or ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 w-full text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:ring-2 focus:ring-brand-500 outline-none min-w-[140px]"
                    >
                        <option value="All">All Statuses</option>
                        <option value="Active">Active</option>
                        <option value="Pending">Pending</option>
                        <option value="Paid">Paid</option>
                    </select>
                    <select
                        value={barangayFilter}
                        onChange={(e) => setBarangayFilter(e.target.value)}
                        className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:ring-2 focus:ring-brand-500 outline-none min-w-[160px]"
                    >
                        <option value="All">All Barangays</option>
                        {[...new Set(customers.map(c => c.barangay).filter(Boolean))].map(b => (
                            <option key={b} value={b}>{b}</option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-2 border-l border-slate-100 pl-2">
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                        <button
                            onClick={() => setViewMode('groups')}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'groups' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            title="Group View"
                        >
                            <LayoutGrid size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            title="List View"
                        >
                            <List size={18} />
                        </button>
                    </div>
                    
                    <button
                        onClick={() => {
                            const filteredGroups = loanGroups.filter(g => barangayFilter === 'All' || g.barangay === barangayFilter);
                            exportCollectionSheet({
                                loans,
                                customers,
                                groups: filteredGroups,
                                settings,
                                centerName: barangayFilter === 'All' ? 'All Barangays' : barangayFilter,
                                generatedBy: currentUser?.name
                            });
                        }}
                        className="flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-4 py-2 rounded-lg transition-colors text-xs font-bold border border-indigo-100"
                    >
                        <FileSpreadsheet size={16} />
                        Collection Sheet
                    </button>
                </div>
            </div>

            {/* Content View */}
            {viewMode === 'groups' ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {loanGroups
                        .filter(g => {
                            const groupLoans = loans.filter(l => l.groupId === g.id);
                            const groupCustomers = groupLoans.map(l => customers.find(c => c.id === l.customerId));
                            
                            const matchesBarangay = barangayFilter === 'All' || g.barangay === barangayFilter;
                            const matchesStatus = statusFilter === 'All' || groupLoans.some(l => l.status === statusFilter);
                            const matchesSearch = searchTerm === '' || 
                                g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                groupCustomers.some(c => c?.name.toLowerCase().includes(searchTerm.toLowerCase()));
                            
                            return matchesBarangay && matchesStatus && matchesSearch;
                        })
                        .map(group => {
                            const groupLoans = loans.filter(l => l.groupId === group.id);
                            const percentFull = (groupLoans.length / 5) * 100;
                                                        // Determine status
                            const isArchived = group.status === 'Disabled' || group.status === 'Closed';
                            const isActive = group.status === 'Active';
                            
                            return (
                                <div 
                                    key={group.id} 
                                    className={`relative rounded-3xl border transition-all duration-300 overflow-hidden ${
                                        isActive 
                                            ? 'bg-white border-slate-100 shadow-sm hover:shadow-md' 
                                            : 'bg-slate-50 border-slate-200 opacity-90 grayscale-[0.3] border-dashed shadow-none ring-1 ring-slate-200'
                                    }`}
                                >
                                    {isArchived && (
                                        <div className="absolute top-0 right-0 z-10 px-4 py-1.5 bg-slate-600 text-white text-[10px] font-black uppercase tracking-widest rounded-bl-xl shadow-lg border-l border-b border-slate-700 flex items-center gap-2">
                                            <Archive size={12} />
                                            Archived Group
                                        </div>
                                    )}

                                    {/* Group Header */}
                                    <div className={`p-6 border-b transition-colors duration-300 ${isActive ? 'border-slate-50 bg-slate-50/30' : 'border-slate-200 bg-slate-100/80'}`}>
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md transition-colors ${isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-300 text-slate-700'}`}>
                                                        {group.status}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-slate-400 font-mono">ID: {group.id}</span>
                                                </div>
                                                <h3 className={`text-lg font-black tracking-tight flex items-center gap-2 transition-colors ${isActive ? 'text-slate-900' : 'text-slate-500'}`}>
                                                    <Layers size={18} className={isActive ? 'text-brand-600' : 'text-slate-400'} />
                                                    {group.name}
                                                </h3>
                                            </div>
                                            {!isActive ? (
                                                <div className="p-2 bg-slate-200 rounded-full opacity-60">
                                                    <Archive size={24} className="text-slate-400" />
                                                </div>
                                            ) : (
                                                <div className="text-right">
                                                    <div className="flex items-center gap-1 justify-end mb-1">
                                                        {[...Array(5)].map((_, i) => (
                                                            <div 
                                                                key={i} 
                                                                className={`w-2 h-4 rounded-sm transition-all ${i < groupLoans.length ? (groupLoans.length === 5 ? 'bg-red-500' : 'bg-brand-500') : 'bg-slate-200'}`}
                                                            />
                                                        ))}
                                                    </div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                                        {groupLoans.length} / 5 Slots Occupied
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                                            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border italic transition-all ${isActive ? 'bg-white/80 border-slate-100' : 'bg-slate-200/50 border-slate-300 text-slate-400'}`}>
                                                <User size={12} className={isActive ? 'text-brand-500' : 'text-slate-400'} />
                                                Officer: {getOfficerName(group.officerId)}
                                            </div>
                                            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all ${isActive ? 'bg-white/80 border-slate-100' : 'bg-slate-200/50 border-slate-300 text-slate-400'}`}>
                                                <MapPin size={12} className={isActive ? 'text-brand-500' : 'text-slate-400'} />
                                                {group.barangay}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Members List */}
                                    <div className={`p-4 space-y-2 max-h-[300px] overflow-y-auto transition-colors ${isActive ? 'bg-slate-50/20' : 'bg-slate-100/20'}`}>
                                        {groupLoans.length > 0 ? (
                                            groupLoans.map((loan, idx) => {
                                                const customer = customers.find(c => c.id === loan.customerId);
                                                const isMatch = (statusFilter === 'All' || loan.status === statusFilter) &&
                                                               (searchTerm === '' || customer?.name.toLowerCase().includes(searchTerm.toLowerCase()));
                                                const overdue = isMemberOverdue(loan.id);
                                                return (
                                                    <div key={loan.id} className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${overdue ? 'bg-red-50 border-red-200 shadow-sm shadow-red-100' : 'bg-white border-slate-100'}`}>
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${overdue ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                                                {idx + 1}
                                                            </div>
                                                            <div>
                                                                <p className={`text-xs font-black uppercase tracking-tight ${overdue ? 'text-red-700' : 'text-slate-900'}`}>{customer?.name}</p>
                                                                <p className={`text-[10px] font-bold ${overdue ? 'text-red-500' : 'text-slate-400'}`}>
                                                                    {overdue ? 'DELINQUENT - CALL' : `₱${loan.remainingBalance.toLocaleString()} • ${loan.loanType}`}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${isActive ? LOAN_STATUS_COLORS[loan.status] : 'bg-slate-100 text-slate-400 border border-slate-200'}`}>
                                                                {loan.status}
                                                            </span>
                                                            {isActive && (
                                                                <div className="flex items-center gap-1">
                                                                    <button 
                                                                        onClick={() => setScheduleModalLoan(loan)}
                                                                        className="p-1.5 text-slate-400 hover:text-brand-600 transition-all"
                                                                        title="View Schedule"
                                                                    >
                                                                        <FileText size={14} />
                                                                    </button>
                                                                    {loan.status === 'Pending' && canManageGroup(group) && (
                                                                        <button 
                                                                            onClick={() => {
                                                                                if(window.confirm('Approve this loan application?')) {
                                                                                    approveLoan(loan.id);
                                                                                    setToast({ message: 'Loan application approved!', type: 'success' });
                                                                                }
                                                                            }}
                                                                            className="p-1.5 text-slate-400 hover:text-emerald-600 transition-all"
                                                                            title="Approve Loan"
                                                                        >
                                                                            <CheckCircle size={14} />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="py-8 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                                                <p className="text-xs text-slate-400 font-medium italic">Empty Group</p>
                                            </div>
                                        )}
                                    </div>
                                    {/* Footer Actions */}
                                    <div className={`p-4 border-t flex gap-2 transition-colors duration-300 ${isActive ? 'bg-slate-50/50 border-slate-100' : 'bg-slate-100 border-slate-200'}`}>
                                        <div className="flex flex-1 gap-2">
                                            {isActive && canManageGroup(group) && (
                                                <>
                                                    <button 
                                                        onClick={() => {
                                                            setNewLoan({ ...newLoan, groupId: group.id, officerId: group.officerId });
                                                            setIsModalOpen(true);
                                                        }}
                                                        className="text-[10px] font-black uppercase text-brand-600 hover:text-brand-700 flex items-center gap-1 bg-white px-2 py-1 rounded-md border border-slate-200"
                                                    >
                                                        <Plus size={12} /> Add Member
                                                    </button>
                                                    <button 
                                                        onClick={() => setArchiveConfirmGroup(group)}
                                                        className="text-[10px] font-black uppercase text-slate-400 hover:text-red-500 flex items-center gap-1 bg-white px-2 py-1 rounded-md border border-slate-200"
                                                    >
                                                        <Archive size={12} /> Archive
                                                    </button>
                                                </>
                                            )}
                                            {!isActive && canManageGroup(group) && (
                                                <button 
                                                    onClick={() => updateLoanGroup(group.id, { status: 'Active' })}
                                                    className="text-[10px] font-black uppercase text-brand-600 hover:text-brand-700 flex items-center gap-1 bg-white px-2 py-1 rounded-md border border-slate-200"
                                                >
                                                    <RotateCcw size={12} /> Restore Group
                                                </button>
                                            )}
                                        </div>
                                        <button 
                                            onClick={() => exportGroupReportPDF(group, loans, customers, staffAccounts)}
                                            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                                                isActive 
                                                    ? 'text-indigo-600 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100' 
                                                    : 'text-slate-500 bg-slate-200 border border-slate-300 hover:bg-slate-300'
                                            }`}
                                        >
                                            <FileText size={14} />
                                            Batch Report
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4">Loan/Group</th>
                                    <th className="px-6 py-4">Customer/Barangay</th>
                                    <th className="px-6 py-4">Officer</th>
                                    <th className="px-6 py-4">Amount</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {displayedLoans.map((loan) => {
                                    const customer = customers.find(c => c.id === loan.customerId);
                                    return (
                                        <tr key={loan.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-mono text-xs text-slate-400">#{loan.id}</span>
                                                    <span className="font-medium text-slate-900 flex items-center gap-1">
                                                        <Layers size={12} className="text-brand-500" />
                                                        {getGroupName(loan.groupId)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-slate-900">{customer?.name}</span>
                                                    <span className="text-xs text-slate-400 flex items-center gap-0.5">
                                                        <MapPin size={10} />
                                                        {customer?.barangay}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold">
                                                        {getOfficerName(loan.officerId).charAt(0)}
                                                    </div>
                                                    {getOfficerName(loan.officerId)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-medium text-slate-900">₱{loan.amount.toLocaleString()}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${LOAN_STATUS_COLORS[loan.status] || 'bg-slate-100 text-slate-600'}`}>
                                                    {loan.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => setScheduleModalLoan(loan)} className="p-1.5 text-slate-400 hover:text-blue-600" title="Schedule">
                                                        <Calendar size={16} />
                                                    </button>
                                                    {loan.status === 'Pending' && canAccess(['admin', 'officer']) && (
                                                        <button onClick={() => approveLoan(loan.id)} className="p-1.5 text-green-600" title="Approve">
                                                            <CheckCircle size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    {/* Pagination (Simplified) */}
                    <div className="p-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
                        <span>Showing {displayedLoans.length} of {filteredLoans.length} loans</span>
                    </div>
                </div>
            )}

            {/* Application Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 animate-in zoom-in duration-200 overflow-y-auto max-h-[90vh]">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-900">New Group Loan</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400">×</button>
                        </div>
                        
                        {formError && <div className="p-3 mb-4 text-xs text-red-600 bg-red-50 rounded-lg border border-red-100">{formError}</div>}
                        
                        <form onSubmit={handleCreateLoan} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">1. Select Customer</label>
                                <select
                                    required
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-slate-50"
                                    value={newLoan.customerId}
                                    onChange={e => setNewLoan({ ...newLoan, customerId: e.target.value, groupId: '', officerId: '' })}
                                >
                                    <option value="">Choose Customer...</option>
                                    {customers.map(c => {
                                        const loanStatus = getCustomerLoanStatus(c.id);
                                        const targetGroup = loanGroups.find(g => g.id === newLoan.groupId);
                                        const isDifferentBarangay = targetGroup ? (c.barangay !== targetGroup.barangay) : false;
                                        const isDisabled = c.status !== 'Active' || loanStatus || isDifferentBarangay;
                                        
                                        return (
                                            <option 
                                                key={c.id} 
                                                value={c.id} 
                                                disabled={isDisabled}
                                                className={isDisabled ? 'text-slate-400' : ''}
                                            >
                                                {c.name} ({c.barangay}) 
                                                {loanStatus ? ` — [ ${loanStatus} Loan ]` : ''}
                                                {isDifferentBarangay ? ' — [ Wrong Barangay ]' : ''}
                                                {c.status !== 'Active' ? ' — [ Disabled Account ]' : ''}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>

                            {selectedCustomer && (
                                <>
                                    <div className="p-3 bg-brand-50 border border-brand-100 rounded-xl flex items-center gap-3">
                                        <MapPin size={18} className="text-brand-600" />
                                        <div>
                                            <p className="text-xs text-brand-600 font-bold uppercase">Customer Location</p>
                                            <p className="text-sm font-bold text-slate-800">{selectedCustomer.barangay}</p>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-2 flex justify-between">
                                            2. Assign to Group
                                            <button 
                                                type="button" 
                                                onClick={() => setIsAddGroupModalOpen(true)}
                                                className="text-brand-600 hover:underline flex items-center gap-1"
                                            >
                                                <Plus size={10} /> Create New
                                            </button>
                                        </label>
                                        <select
                                            required
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                            value={newLoan.groupId}
                                            onChange={e => {
                                                const group = loanGroups.find(g => g.id === e.target.value);
                                                setNewLoan({ ...newLoan, groupId: e.target.value, officerId: group?.officerId || '' });
                                            }}
                                        >
                                            <option value="">Select an active group...</option>
                                            {availableGroups.map(g => (
                                                <option key={g.id} value={g.id}>{g.name} ({5 - g.loanIds.length} slots left)</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Loan Type</label>
                                            <select
                                                className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none"
                                                value={newLoan.loanType}
                                                onChange={e => setNewLoan({ ...newLoan, loanType: e.target.value })}
                                            >
                                                {Object.entries(LOAN_TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Officer</label>
                                            <input 
                                                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500"
                                                value={getOfficerName(newLoan.officerId)}
                                                disabled
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Amount</label>
                                            <input 
                                                type="number" required placeholder="0.00"
                                                className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none"
                                                value={newLoan.amount}
                                                onChange={e => setNewLoan({ ...newLoan, amount: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Weeks</label>
                                            <input 
                                                type="number" required placeholder="Weeks"
                                                className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none"
                                                value={newLoan.term}
                                                onChange={e => setNewLoan({ ...newLoan, term: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </>
                            )}

                            <div className="flex gap-3 pt-6">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-slate-600 font-bold hover:bg-slate-50 rounded-xl border">Cancel</button>
                                <button type="submit" disabled={!newLoan.groupId} className="flex-1 py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 shadow-lg shadow-brand-500/20 disabled:opacity-50">Create Loan</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Group Modal */}
            {isAddGroupModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-in slide-in-from-bottom duration-300">
                        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <Layers size={18} className="text-brand-600" />
                            Create New Group
                        </h3>
                        <form onSubmit={handleCreateGroup} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Barangay Location</label>
                                <select
                                    required
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none bg-slate-50"
                                    value={newGroup.barangay}
                                    onChange={e => {
                                        const b = e.target.value;
                                        const autoName = generateGroupName(b);
                                        setNewGroup({ ...newGroup, barangay: b, name: autoName, officerId: '' });
                                    }}
                                >
                                    <option value="">Select Barangay...</option>
                                    {BARANGAYS.map(b => <option key={b} value={b}>{b}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Group Name</label>
                                <input 
                                    required
                                    placeholder="Barangay_Group 1_MM_YYYY"
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none"
                                    value={newGroup.name}
                                    onChange={e => setNewGroup({ ...newGroup, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Assign Officer</label>
                                <select
                                    required
                                    disabled={!newGroup.barangay}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none disabled:bg-slate-100 disabled:text-slate-400"
                                    value={newGroup.officerId}
                                    onChange={e => setNewGroup({ ...newGroup, officerId: e.target.value })}
                                >
                                    <option value="">Select Officer...</option>
                                    {availableOfficers.map(o => {
                                        const cap = getOfficerCapacity(o.id, newGroup.barangay);
                                        return <option key={o.id} value={o.id}>{o.name} ({cap.slots}/5 slots)</option>;
                                    })}
                                </select>
                                {!newGroup.barangay && <p className="text-[10px] text-brand-600 mt-1">Select a barangay first to see available officers.</p>}
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setIsAddGroupModalOpen(false)} className="flex-1 py-2 text-slate-600 font-bold hover:bg-slate-50 rounded-lg transition-colors">Cancel</button>
                                <button type="submit" className="flex-1 py-2 bg-brand-600 text-white rounded-lg font-black shadow-md hover:bg-brand-700 transition-colors">Create Group</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Amortization Schedule Modal */}
            {scheduleModalLoan && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 flex flex-col max-h-[80vh]">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold">Payment Schedule</h3>
                            <button onClick={() => setScheduleModalLoan(null)}>×</button>
                        </div>
                        <div className="overflow-y-auto flex-1">
                            {/* Same table code as before */}
                            <table className="w-full text-xs text-right">
                                <thead className="bg-slate-50 sticky top-0">
                                    <tr>
                                        <th className="px-4 py-3 text-center">Period</th>
                                        <th className="px-4 py-3">Payment</th>
                                        <th className="px-4 py-3">Principal</th>
                                        <th className="px-4 py-3">Interest</th>
                                        <th className="px-4 py-3">Balance</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {calculateAmortization(scheduleModalLoan.amount, scheduleModalLoan.interestRate, scheduleModalLoan.term, scheduleModalLoan.loanType).map(row => (
                                        <tr key={row.period} className="border-b">
                                            <td className="px-4 py-2 text-center">{row.period}</td>
                                            <td className="px-4 py-2 font-medium">₱{row.payment.toFixed(2)}</td>
                                            <td className="px-4 py-2">₱{row.principal.toFixed(2)}</td>
                                            <td className="px-4 py-2">₱{row.interest.toFixed(2)}</td>
                                            <td className="px-4 py-2 font-mono">₱{row.balance.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Update Fees Modal */}
            {isFeesModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 animate-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Settings size={20} className="text-brand-600" />
                                System Fee Settings
                            </h3>
                            <button onClick={() => setIsFeesModalOpen(false)} className="text-slate-400">×</button>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Admin Fee (%)</label>
                                <input 
                                    type="number" step="0.1"
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-brand-500"
                                    value={tempFees.adminFeePercent}
                                    onChange={e => setTempFees({ ...tempFees, adminFeePercent: parseFloat(e.target.value) })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">CBU (%)</label>
                                    <input 
                                        type="number" step="0.1"
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none"
                                        value={tempFees.cbuPercent}
                                        onChange={e => setTempFees({ ...tempFees, cbuPercent: parseFloat(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Savings SD (%)</label>
                                    <input 
                                        type="number" step="0.1"
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none"
                                        value={tempFees.sdPercent}
                                        onChange={e => setTempFees({ ...tempFees, sdPercent: parseFloat(e.target.value) })}
                                    />
                                </div>
                            </div>
                            
                            <div className="pt-4 border-t border-slate-100">
                                <button
                                    onClick={resetSystemData}
                                    className="w-full flex items-center justify-center gap-2 py-2 text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 rounded-lg text-xs font-black transition-all"
                                >
                                    <RotateCcw size={14} />
                                    RESET SYSTEM TO DEFAULT
                                </button>
                                <div className="flex items-start gap-2 mt-2 p-2 bg-slate-50 rounded text-[9px] text-slate-500 leading-normal">
                                    <AlertTriangle size={12} className="text-amber-500 shrink-0 mt-0.5" />
                                    <span>Warning: Resetting will synchronize all customers, loans, and groups back to their original mock values. All recent changes will be lost.</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-8">
                            <button
                                onClick={() => setIsFeesModalOpen(false)}
                                className="flex-1 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg transition-colors border border-slate-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    updateSettings(tempFees);
                                    setIsFeesModalOpen(false);
                                    setToast({ message: 'System fees updated successfully.', type: 'success' });
                                }}
                                className="flex-1 py-2 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg transition-colors shadow-sm"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Archive Confirmation Modal */}
            {archiveConfirmGroup && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 animate-in zoom-in duration-200 border border-slate-100">
                        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                            <AlertTriangle size={32} className="text-red-600" />
                        </div>
                        
                        <div className="text-center mb-8">
                            <h3 className="text-xl font-black text-slate-900 mb-2">Archive Group?</h3>
                            <p className="text-sm text-slate-500 font-medium px-4">
                                You are about to archive <span className="text-slate-900 font-bold">"{archiveConfirmGroup.name}"</span>. 
                                No new members or loans can be added to this group once archived.
                            </p>
                        </div>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => {
                                    updateLoanGroup(archiveConfirmGroup.id, { status: 'Disabled' });
                                    setToast({ message: `Group ${archiveConfirmGroup.name} has been archived.`, type: 'info' });
                                    setArchiveConfirmGroup(null);
                                }}
                                className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl transition-all shadow-md shadow-red-100 flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
                            >
                                <Archive size={16} />
                                Confirm Archive
                            </button>
                            <button
                                onClick={() => setArchiveConfirmGroup(null)}
                                className="w-full py-3.5 bg-white text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-all border border-slate-200 uppercase tracking-widest text-xs"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Loans;
