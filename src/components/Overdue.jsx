import React, { useState } from 'react';
import { useSystem } from '../context/AppContext';
import { Search, AlertTriangle, Calendar, Phone, MapPin, User, ChevronLeft, ChevronRight, FileText } from 'lucide-react';

const ITEMS_PER_PAGE = 8;

const Overdue = () => {
    const { loans, customers, transactions, loanGroups, staffAccounts } = useSystem();
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedLoanHistory, setSelectedLoanHistory] = useState(null);

    const getCustomer = (id) => customers.find(c => c.id === id);
    const getOfficerName = (id) => staffAccounts.find(s => s.id === id)?.name || 'Unknown';
    const getGroupName = (id) => loanGroups.find(g => g.id === id)?.name || 'Individual';

    const isOverdue = (loan) => {
        if (loan.status !== 'Active') return false;
        const loanTxns = transactions.filter(t => t.loanId === loan.id).sort((a,b) => new Date(b.date) - new Date(a.date));
        const lastPaymentDate = loanTxns[0] ? new Date(loanTxns[0].date) : new Date(loan.startDate);
        const diffDays = Math.floor((new Date() - lastPaymentDate) / (1000 * 60 * 60 * 24));
        return diffDays > 7;
    };

    const overdueLoans = loans.filter(l => isOverdue(l)).filter(l => {
        const customer = getCustomer(l.customerId);
        return customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) || l.id.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const totalPages = Math.ceil(overdueLoans.length / ITEMS_PER_PAGE);
    const displayedOverdue = overdueLoans.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const getDaysSinceLastPayment = (loan) => {
        const loanTxns = transactions.filter(t => t.loanId === loan.id).sort((a,b) => new Date(b.date) - new Date(a.date));
        const lastDate = loanTxns[0] ? new Date(loanTxns[0].date) : new Date(loan.startDate);
        return Math.floor((new Date() - lastDate) / (1000 * 60 * 60 * 24));
    };

    const getLoanHistory = (loanId) => {
        return transactions.filter(t => t.loanId === loanId).sort((a,b) => new Date(b.date) - new Date(a.date));
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <AlertTriangle className="text-red-500" />
                        Overdue Monitor
                    </h2>
                    <p className="text-sm font-medium text-slate-500">Loans with no payments for more than 7 days</p>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search delinquent borrower..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 pr-4 py-2 text-sm border-2 border-slate-100 rounded-xl focus:border-red-500 outline-none w-64 transition-all"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {displayedOverdue.map(loan => {
                    const customer = getCustomer(loan.customerId);
                    const days = getDaysSinceLastPayment(loan);
                    return (
                        <div key={loan.id} className="bg-white rounded-3xl border-2 border-red-50 shadow-sm hover:shadow-xl hover:shadow-red-500/5 transition-all overflow-hidden flex flex-col group">
                            <div className="p-1 bg-red-500 w-full"></div>
                            <div className="p-6 flex-1">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-600 group-hover:scale-110 transition-transform">
                                            <AlertTriangle size={20} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Status: Overdue</p>
                                            <p className="text-sm font-black text-red-600 uppercase tabular-nums">{days} Days Past Due</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <h4 className="text-lg font-black text-slate-900 leading-tight uppercase group-hover:text-red-600 transition-colors">{customer?.name}</h4>
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 mt-1">
                                            <MapPin size={12} />
                                            {customer?.barangay} • Group {getGroupName(loan.groupId)}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-left">
                                            <p className="text-[10px] font-black text-slate-400 uppercase mb-0.5">Remaining</p>
                                            <p className="text-sm font-black text-slate-900">₱{loan.remainingBalance.toLocaleString()}</p>
                                        </div>
                                        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-left">
                                            <p className="text-[10px] font-black text-slate-400 uppercase mb-0.5">Weekly Rate</p>
                                            <p className="text-sm font-black text-slate-900">₱{(loan.amount / loan.term).toFixed(0)}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-2 pt-2">
                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                            <Phone size={14} className="text-slate-400" />
                                            {customer?.phone}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                            <User size={14} className="text-slate-400" />
                                            Officer: {getOfficerName(loan.officerId)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex gap-2">
                                <button 
                                    onClick={() => setSelectedLoanHistory(loan)}
                                    className="flex-1 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase text-slate-600 hover:bg-slate-100 transition-colors flex items-center justify-center gap-2"
                                >
                                    <FileText size={14} className="text-slate-400" />
                                    Review Loan History
                                </button>
                            </div>
                        </div>
                    );
                })}
                {overdueLoans.length === 0 && (
                    <div className="col-span-full py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
                        <AlertTriangle size={64} className="opacity-10 mb-4" />
                        <p className="font-black uppercase tracking-widest text-sm opacity-40">Portfolio Healthy - No Delinquencies</p>
                    </div>
                )}
            </div>

            {selectedLoanHistory && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg p-0 overflow-hidden animate-in zoom-in duration-200">
                        <div className="bg-slate-50 p-6 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-brand-100 text-brand-600 rounded-xl flex items-center justify-center">
                                    <FileText size={20} />
                                </div>
                                <h3 className="text-lg font-black text-slate-900">Transaction History</h3>
                            </div>
                            <button onClick={() => setSelectedLoanHistory(null)} className="p-2 text-slate-400 hover:text-slate-600 bg-white border border-slate-200 rounded-xl">×</button>
                        </div>
                        <div className="p-6">
                            <div className="mb-6">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Borrower</p>
                                <p className="text-lg font-black text-slate-900">{getCustomer(selectedLoanHistory.customerId)?.name}</p>
                                <p className="text-xs font-medium text-slate-500 mt-1">Loan ID: #{selectedLoanHistory.id} • Started {selectedLoanHistory.startDate}</p>
                            </div>

                            <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                {getLoanHistory(selectedLoanHistory.id).length > 0 ? (
                                    getLoanHistory(selectedLoanHistory.id).map((t, i) => (
                                        <div key={t.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                            <div>
                                                <p className="text-xs font-black text-slate-900 tracking-tight">{t.date}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">Ref: {t.id}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-black text-emerald-600">₱{t.amount.toLocaleString()}</p>
                                                <p className="text-[10px] font-black text-slate-400 uppercase">Paid</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-10 text-center border-2 border-dashed border-slate-100 rounded-3xl">
                                        <p className="text-xs font-black text-slate-400 uppercase italic">No Payments Found</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="bg-slate-50 p-6 border-t border-slate-100 flex justify-end">
                            <button 
                                onClick={() => setSelectedLoanHistory(null)}
                                className="px-6 py-2.5 bg-brand-600 text-white font-black rounded-xl hover:bg-brand-700 transition-all shadow-lg shadow-brand-100 text-xs uppercase"
                            >
                                Close History
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {totalPages > 1 && (
                <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] border-2 border-slate-100 shadow-sm">
                    <span className="text-xs font-black text-slate-400 uppercase">Page {currentPage} of {totalPages}</span>
                    <div className="flex gap-2">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => p - 1)}
                            className="p-3 rounded-2xl bg-white border-2 border-slate-100 text-slate-400 hover:text-red-500 hover:border-red-500 disabled:opacity-20 transition-all font-bold"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(p => p + 1)}
                            className="p-3 rounded-2xl bg-white border-2 border-slate-100 text-slate-400 hover:text-red-500 hover:border-red-500 disabled:opacity-20 transition-all font-bold"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Overdue;
