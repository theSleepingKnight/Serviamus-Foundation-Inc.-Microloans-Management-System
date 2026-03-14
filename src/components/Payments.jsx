import React, { useState } from 'react';
import { useSystem } from '../context/AppContext';
import { Search, CreditCard, DollarSign, History, FileText, CheckCircle, ChevronLeft, ChevronRight, Users, Layers, Activity, Calendar, ArrowRight, Download } from 'lucide-react';
import Toast from './ui/Toast';

const ITEMS_PER_PAGE = 10;
const Payments = () => {
    const { loans, customers, canAccess, processPayment, transactions, loanGroups } = useSystem();

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLoan, setSelectedLoan] = useState(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [historyLoan, setHistoryLoan] = useState(null);
    const [toast, setToast] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [viewMode, setViewMode] = useState('individual'); // 'individual' or 'group'
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [batchAmounts, setBatchAmounts] = useState({}); // { loanId: amount }

    const isCashier = canAccess('cashier') || canAccess('admin');

    // Stats
    const today = new Date().toLocaleDateString();
    const todayTransactions = transactions.filter(t => t.date.includes(today));
    const totalCollectedToday = todayTransactions.reduce((acc, t) => acc + t.amount, 0);

    // Filter Logic
    const filteredLoans = loans.filter(l => {
        const customer = customers.find(c => c.id === l.customerId);
        const matchesSearch = customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            l.id.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch && l.status === 'Active';
    });

    const totalPages = Math.ceil(filteredLoans.length / ITEMS_PER_PAGE);
    const displayedLoans = filteredLoans.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const handlePayment = (e) => {
        e.preventDefault();
        if (selectedLoan && paymentAmount) {
            const amount = Number(paymentAmount);
            if (amount <= 0 || amount > selectedLoan.remainingBalance) {
                setToast({ message: 'Invalid payment amount.', type: 'error' });
                return;
            }

            processPayment(selectedLoan.id, amount);
            setSelectedLoan(null);
            setPaymentAmount('');
            setToast({ message: `Payment of ₱${amount.toLocaleString()} received!`, type: 'success' });
        }
    };

    const handleBatchPayment = (e) => {
        e.preventDefault();
        const paymentsToProcess = Object.entries(batchAmounts).filter(([_, amt]) => Number(amt) > 0);
        
        if (paymentsToProcess.length === 0) {
            setToast({ message: 'No payment amounts entered.', type: 'error' });
            return;
        }

        paymentsToProcess.forEach(([loanId, amount]) => {
            processPayment(loanId, Number(amount));
        });

        setToast({ message: `Successfully processed ${paymentsToProcess.length} payments for ${selectedGroup.name}`, type: 'success' });
        setSelectedGroup(null);
        setBatchAmounts({});
    };

    const getCustomerName = (id) => customers.find(c => c.id === id)?.name || 'Unknown';
    const getLoanTransactions = (loanId) => transactions.filter(t => t.loanId === loanId).sort((a, b) => new Date(b.date) - new Date(a.date));

    return (
        <div className="space-y-6">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Collection Desk</h2>
                    <p className="text-sm text-slate-500 font-medium tracking-tight">Process individual or group member payments</p>
                </div>
                <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                    <button 
                        onClick={() => setViewMode('individual')}
                        className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'individual' ? 'bg-white text-brand-600 shadow-md translate-y-[-1px]' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        Individual
                    </button>
                    <button 
                        onClick={() => setViewMode('group')}
                        className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'group' ? 'bg-white text-emerald-600 shadow-md translate-y-[-1px]' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        Group Batch
                    </button>
                </div>
            </div>

            {/* Daily Metrics Header */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5">
                    <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600 shadow-inner">
                        <Activity size={28} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Today's Collections</p>
                        <h4 className="text-2xl font-black text-slate-900 tabular-nums">₱{totalCollectedToday.toLocaleString()}</h4>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5">
                    <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-inner">
                        <CheckCircle size={28} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Receipts Issued</p>
                        <h4 className="text-2xl font-black text-slate-900 tabular-nums">{todayTransactions.length}</h4>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5">
                    <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 shadow-inner">
                        <Calendar size={28} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Business Date</p>
                        <h4 className="text-2xl font-black text-slate-900 tabular-nums">{today}</h4>
                    </div>
                </div>
            </div>

            {viewMode === 'individual' ? (
                <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/20">
                        <div className="relative max-w-md">
                            <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Scan Loan ID or search customer name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-12 pr-6 py-3.5 w-full text-sm border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all font-medium"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4">Loan ID</th>
                                    <th className="px-6 py-4">Customer</th>
                                    <th className="px-6 py-4">Outstanding Bal.</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {displayedLoans.map((loan) => (
                                    <tr key={loan.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 font-mono text-slate-500 text-xs">{loan.id}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-slate-900">{getCustomerName(loan.customerId)}</span>
                                                {loan.groupId && (
                                                    <span className="text-[10px] text-slate-400 font-mono">
                                                        Group: {loanGroups.find(g => g.id === loan.groupId)?.name}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-700 font-medium">
                                            ₱{loan.remainingBalance.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => setHistoryLoan(loan)}
                                                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="View History"
                                                >
                                                    <History size={16} />
                                                </button>
                                                {isCashier && (
                                                    <button
                                                        onClick={() => setSelectedLoan(loan)}
                                                        className="bg-brand-600 hover:bg-brand-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shadow-sm inline-flex items-center gap-1.5"
                                                    >
                                                        <DollarSign size={14} />
                                                        Pay
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredLoans.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-8 text-center text-slate-500">
                                            No active loans found matching your search.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="p-6 border-t border-slate-100 flex justify-between items-center bg-slate-50/20">
                            <span className="text-xs font-bold text-slate-400 uppercase">Page {currentPage} of {totalPages}</span>
                            <div className="flex gap-3">
                                <button
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(p => p - 1)}
                                    className="p-2 rounded-xl bg-white border-2 border-slate-100 text-slate-500 hover:border-brand-500 hover:text-brand-600 disabled:opacity-30 transition-all active:scale-90"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <button
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage(p => p + 1)}
                                    className="p-2 rounded-xl bg-white border-2 border-slate-100 text-slate-500 hover:border-brand-500 hover:text-brand-600 disabled:opacity-30 transition-all active:scale-90"
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loanGroups.filter(g => g.status === 'Active').map(group => {
                        const activeLoans = loans.filter(l => group.loanIds.includes(l.id) && l.status === 'Active');
                        const totalRemaining = activeLoans.reduce((acc, l) => acc + l.remainingBalance, 0);
                        
                        return (
                            <div key={group.id} className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 transition-all group border-b-4 border-b-transparent hover:border-b-emerald-500 text-left">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                                        <Layers size={24} />
                                    </div>
                                    <span className="text-[10px] font-black px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md uppercase">
                                        {activeLoans.length} Members
                                    </span>
                                </div>
                                <h4 className="text-lg font-black text-slate-900 mb-1">{group.name}</h4>
                                <p className="text-xs text-slate-500 font-medium mb-6">Barangay {group.barangay}</p>
                                
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 mb-6">
                                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Group Outstanding</p>
                                    <p className="text-xl font-black text-slate-900">₱{totalRemaining.toLocaleString()}</p>
                                </div>

                                <button
                                    onClick={() => {
                                        setSelectedGroup(group);
                                        const initialAmounts = {};
                                        activeLoans.forEach(l => initialAmounts[l.id] = '');
                                        setBatchAmounts(initialAmounts);
                                    }}
                                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-2xl transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 group-hover:translate-y-[-2px]"
                                >
                                    Open Payment Sheet
                                    <ArrowRight size={18} />
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Individual Payment Modal */}
            {selectedLoan && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm p-8 animate-in zoom-in duration-200">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center shadow-inner">
                                <CreditCard size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900 leading-tight">Apply Payment</h3>
                                <p className="text-xs font-bold text-slate-400 font-mono tracking-tight">Loan #{selectedLoan.id}</p>
                            </div>
                        </div>

                        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 mb-6">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Outstanding Balance</p>
                            <p className="text-2xl font-black text-slate-900">₱{selectedLoan.remainingBalance.toLocaleString()}</p>
                        </div>

                        <form onSubmit={handlePayment} className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Payment Amount (₱)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-brand-600">₱</span>
                                    <input
                                        type="number"
                                        min="1"
                                        max={selectedLoan.remainingBalance}
                                        required
                                        autoFocus
                                        className="w-full pl-8 pr-4 py-4 bg-white border-2 border-slate-200 rounded-2xl focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none font-black text-xl text-slate-900 tabular-nums shadow-sm transition-all"
                                        value={paymentAmount}
                                        onChange={e => setPaymentAmount(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setSelectedLoan(null)}
                                    className="flex-1 py-4 text-slate-600 font-black rounded-2xl hover:bg-slate-50 transition-all border-2 border-slate-100 active:scale-95 text-center"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-4 bg-brand-600 hover:bg-brand-700 text-white font-black rounded-2xl transition-all shadow-xl shadow-brand-100 active:scale-95"
                                >
                                    Verify & Pay
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Transaction History Modal */}
            {historyLoan && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg p-8 animate-in fade-in zoom-in duration-200 max-h-[80vh] flex flex-col">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 tracking-tight">Payment Ledger</h3>
                                <p className="text-sm font-medium text-slate-500">Loan #{historyLoan.id} • {getCustomerName(historyLoan.customerId)}</p>
                            </div>
                            <button onClick={() => setHistoryLoan(null)} className="p-2 text-slate-400 hover:text-slate-600 bg-slate-50 rounded-xl transition-colors">×</button>
                        </div>

                        <div className="overflow-y-auto flex-1 pr-2">
                            <table className="w-full text-sm text-left border-separate border-spacing-y-2">
                                <thead className="bg-white text-[10px] font-black text-slate-400 uppercase tracking-widest sticky top-0">
                                    <tr>
                                        <th className="px-4 py-2">Date</th>
                                        <th className="px-4 py-2">Cashier</th>
                                        <th className="px-4 py-2 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {getLoanTransactions(historyLoan.id).length > 0 ? (
                                        getLoanTransactions(historyLoan.id).map(t => (
                                            <tr key={t.id} className="bg-slate-50/50 hover:bg-slate-50 transition-colors">
                                                <td className="px-4 py-3 text-slate-600 font-medium rounded-l-xl">{t.date}</td>
                                                <td className="px-4 py-3 text-slate-600 font-medium">{t.processedBy}</td>
                                                <td className="px-4 py-3 text-right font-black text-emerald-600 rounded-r-xl">+₱{t.amount.toLocaleString()}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="3" className="px-4 py-12 text-center">
                                                <div className="flex flex-col items-center text-slate-400">
                                                    <History size={40} className="mb-2 opacity-20" />
                                                    <p className="font-bold">No payment history found.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
                            <button
                                onClick={() => setHistoryLoan(null)}
                                className="px-8 py-3 bg-slate-100 text-slate-700 font-black rounded-2xl hover:bg-slate-200 transition-all active:scale-95"
                            >
                                Close Ledger
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Batch Payment Sheet Modal */}
            {selectedGroup && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                        <div className="p-8 bg-emerald-600 text-white flex justify-between items-start shrink-0">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-500/50 px-2 py-1 rounded-md">Batch Payment Sheet</span>
                                    <span className="w-1 h-1 rounded-full bg-white/50"></span>
                                    <span className="text-[10px] font-medium opacity-80">{selectedGroup.barangay}</span>
                                </div>
                                <h3 className="text-3xl font-black leading-none mt-1">{selectedGroup.name}</h3>
                            </div>
                            <button onClick={() => setSelectedGroup(null)} className="p-2 text-white/50 hover:text-white bg-white/10 rounded-xl transition-colors">×</button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 text-left">
                            <form id="batch-form" onSubmit={handleBatchPayment} className="space-y-4">
                                {loans.filter(l => selectedGroup.loanIds.includes(l.id) && l.status === 'Active').map(loan => (
                                    <div key={loan.id} className="p-5 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] flex items-center justify-between gap-6 hover:border-emerald-200 transition-colors">
                                        <div className="flex items-center gap-4 min-w-0">
                                            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 font-bold shrink-0">
                                                {getCustomerName(loan.customerId).charAt(0)}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-extrabold text-slate-900 truncate uppercase tracking-tight">{getCustomerName(loan.customerId)}</p>
                                                <p className="text-xs font-bold text-slate-400 font-mono">Bal: ₱{loan.remainingBalance.toLocaleString()}</p>
                                            </div>
                                        </div>
                                        <div className="relative shrink-0">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-emerald-600">₱</span>
                                            <input 
                                                type="number"
                                                placeholder="0.00"
                                                className="w-36 pl-8 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none font-black text-slate-900 tabular-nums placeholder:text-slate-200"
                                                value={batchAmounts[loan.id] || ''}
                                                onChange={(e) => setBatchAmounts({...batchAmounts, [loan.id]: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </form>
                        </div>

                        <div className="p-8 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
                            <div className="text-left">
                                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Total to Process</p>
                                <p className="text-2xl font-black text-emerald-600">
                                    ₱{Object.values(batchAmounts).reduce((acc, amt) => acc + (Number(amt) || 0), 0).toLocaleString()}
                                </p>
                            </div>
                            <div className="flex gap-4">
                                <button 
                                    type="button"
                                    onClick={() => setSelectedGroup(null)}
                                    className="px-8 py-3 bg-white border-2 border-slate-200 text-slate-700 font-black rounded-2xl hover:bg-slate-100 transition-all active:scale-95"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    form="batch-form"
                                    className="px-8 py-3 bg-emerald-600 text-white font-black rounded-2xl hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 active:scale-95"
                                >
                                    Confirm Batch
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Payments;
