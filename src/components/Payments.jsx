import React, { useState } from 'react';
import { useSystem } from '../context/AppContext';
import { Search, CreditCard, DollarSign, History, FileText, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
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

    const isCashier = canAccess('cashier') || canAccess('admin'); // Admins can also process

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

    const getCustomerName = (id) => customers.find(c => c.id === id)?.name || 'Unknown';

    const getLoanTransactions = (loanId) => {
        return transactions.filter(t => t.loanId === loanId).sort((a, b) => new Date(b.date) - new Date(a.date));
    };

    return (
        <div className="space-y-6">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <h2 className="text-2xl font-bold text-slate-800">Payment Processing</h2>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by Customer or Loan ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 w-full text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
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

            {/* Payment Modal */}
            {selectedLoan && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center">
                                <CreditCard size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Process Payment</h3>
                                <p className="text-xs text-slate-500">Loan #{selectedLoan.id}</p>
                            </div>
                        </div>

                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4">
                            <p className="text-xs text-slate-500 mb-1">Current Balance</p>
                            <p className="text-xl font-bold text-slate-800">₱{selectedLoan.remainingBalance.toLocaleString()}</p>
                        </div>

                        <form onSubmit={handlePayment} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Payment Amount (₱)</label>
                                <input
                                    type="number"
                                    min="1"
                                    max={selectedLoan.remainingBalance}
                                    required
                                    autoFocus
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none font-medium text-lg"
                                    value={paymentAmount}
                                    onChange={e => setPaymentAmount(e.target.value)}
                                />
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setSelectedLoan(null)}
                                    className="flex-1 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg transition-colors border border-slate-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg transition-colors shadow-sm"
                                >
                                    Confirm
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Transaction History Modal */}
            {historyLoan && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 animate-in fade-in zoom-in duration-200 max-h-[80vh] flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Payment History</h3>
                                <p className="text-sm text-slate-500">Loan #{historyLoan.id} • {getCustomerName(historyLoan.customerId)}</p>
                            </div>
                            <button onClick={() => setHistoryLoan(null)} className="text-slate-400 hover:text-slate-600">×</button>
                        </div>

                        <div className="overflow-y-auto flex-1">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 font-medium sticky top-0">
                                    <tr>
                                        <th className="px-4 py-2">Date</th>
                                        <th className="px-4 py-2">Processed By</th>
                                        <th className="px-4 py-2 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {getLoanTransactions(historyLoan.id).length > 0 ? (
                                        getLoanTransactions(historyLoan.id).map(t => (
                                            <tr key={t.id}>
                                                <td className="px-4 py-3 text-slate-600">{t.date}</td>
                                                <td className="px-4 py-3 text-slate-600">{t.processedBy}</td>
                                                <td className="px-4 py-3 text-right font-medium text-green-600">+₱{t.amount.toLocaleString()}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="3" className="px-4 py-8 text-center text-slate-400">No payment history found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-4 pt-4 border-t border-slate-100 text-right">
                            <button
                                onClick={() => setHistoryLoan(null)}
                                className="px-4 py-2 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Payments;
