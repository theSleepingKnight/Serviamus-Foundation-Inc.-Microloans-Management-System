import React, { useState, useMemo } from 'react';
import { useSystem } from '../context/AppContext';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line, AreaChart, Area
} from 'recharts';
import { Download, Filter, Calendar, MapPin, Users, Layers, TrendingUp, DollarSign, Wallet, FileSpreadsheet, FileText } from 'lucide-react';
import { BARANGAYS } from '../utils/constants';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { exportCollectionSheet } from '../utils/exportUtils';

const Analytics = () => {
    const { loans, customers, transactions, loanGroups, staffAccounts, currentUser, settings } = useSystem();

    // Filter States
    const [timeRange, setTimeRange] = useState('Monthly'); // Weekly, Monthly, Yearly
    const [selectedBarangay, setSelectedBarangay] = useState('All');
    const [selectedGroup, setSelectedGroup] = useState('All');
    const [selectedLoanType, setSelectedLoanType] = useState('All');

    // --- Data Processing Helpers ---

    const filteredData = useMemo(() => {
        let currentLoans = [...loans];
        let currentTxns = [...transactions];

        if (selectedBarangay !== 'All') {
            const customerIdsInBarangay = customers.filter(c => c.barangay === selectedBarangay).map(c => c.id);
            currentLoans = currentLoans.filter(l => customerIdsInBarangay.includes(l.customerId));
            currentTxns = currentTxns.filter(t => {
                const loan = loans.find(l => l.id === t.loanId);
                return loan && customerIdsInBarangay.includes(loan.customerId);
            });
        }

        if (selectedGroup !== 'All') {
            currentLoans = currentLoans.filter(l => l.groupId === selectedGroup);
            currentTxns = currentTxns.filter(t => {
                const loan = loans.find(l => l.id === t.loanId);
                return loan && loan.groupId === selectedGroup;
            });
        }

        if (selectedLoanType !== 'All') {
            currentLoans = currentLoans.filter(l => l.loanType === selectedLoanType);
            currentTxns = currentTxns.filter(t => {
                const loan = loans.find(l => l.id === t.loanId);
                return loan && loan.loanType === selectedLoanType;
            });
        }

        return { loans: currentLoans, transactions: currentTxns };
    }, [loans, transactions, customers, selectedBarangay, selectedGroup, selectedLoanType]);

    // Statistics
    const stats = useMemo(() => {
        const totalLoansAmount = filteredData.loans.reduce((sum, l) => sum + l.amount, 0);
        const totalCollections = filteredData.transactions.reduce((sum, t) => sum + t.amount, 0);
        const activeLoansCount = filteredData.loans.filter(l => l.status === 'Active').length;
        const totalInterest = filteredData.loans.reduce((sum, l) => sum + (l.amount * (l.interestRate / 100)), 0);

        return { totalLoansAmount, totalCollections, activeLoansCount, totalInterest };
    }, [filteredData]);

    // Chart Data Preparation
    const chartData = useMemo(() => {
        // Group by Date based on timeRange
        const grouped = {};
        
        filteredData.transactions.forEach(t => {
            const date = new Date(t.date);
            let key;
            if (timeRange === 'Weekly') {
                // Get start of week
                const day = date.getDay();
                const diff = date.getDate() - day + (day === 0 ? -6 : 1);
                const startOfWeek = new Date(date.setDate(diff));
                key = startOfWeek.toISOString().split('T')[0];
            } else if (timeRange === 'Monthly') {
                key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            } else {
                key = `${date.getFullYear()}`;
            }
            
            if (!grouped[key]) grouped[key] = { name: key, collections: 0, loans: 0 };
            grouped[key].collections += t.amount;
        });

        filteredData.loans.forEach(l => {
            const date = new Date(l.startDate);
            let key;
            if (timeRange === 'Weekly') {
                const day = date.getDay();
                const diff = date.getDate() - day + (day === 0 ? -6 : 1);
                const startOfWeek = new Date(date.setDate(diff));
                key = startOfWeek.toISOString().split('T')[0];
            } else if (timeRange === 'Monthly') {
                key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            } else {
                key = `${date.getFullYear()}`;
            }
            
            if (!grouped[key]) grouped[key] = { name: key, collections: 0, loans: 0 };
            grouped[key].loans += l.amount;
        });

        return Object.values(grouped).sort((a, b) => a.name.localeCompare(b.name)).slice(-12);
    }, [filteredData, timeRange]);

    // --- PDF Export Logic ---

    const exportToPDF = () => {
        try {
            const doc = new jsPDF();
            const timestamp = new Date().toLocaleString();
            
            // Stylish Header
            doc.setFillColor(15, 23, 42); // slate-900
            doc.rect(0, 0, 210, 40, 'F');
            
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(22);
            doc.setFont('helvetica', 'bold');
            doc.text('SERVIAMUS FOUNDATION INC.', 20, 20);
            
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text('Customer Loans Management System', 20, 28);
            doc.text(`Generated: ${timestamp}`, 140, 28);

            // Filter Summary
            doc.setTextColor(50, 50, 50);
            doc.setFontSize(12);
            doc.text('Report Parameters:', 20, 50);
            doc.setFontSize(10);
            doc.text(`Barangay: ${selectedBarangay}`, 20, 58);
            doc.text(`Group: ${selectedGroup === 'All' ? 'All Groups' : getGroupName(selectedGroup)}`, 80, 58);
            doc.text(`Loan Type: ${selectedLoanType}`, 140, 58);

            // Stats Grid in PDF
            autoTable(doc, {
                startY: 65,
                head: [['Statistic', 'Value']],
                body: [
                    ['Total Loans Issued', `PHP ${(stats.totalLoansAmount || 0).toLocaleString()}`],
                    ['Total Collections Recorded', `PHP ${(stats.totalCollections || 0).toLocaleString()}`],
                    ['Estimated Interest Revenue', `PHP ${(stats.totalInterest || 0).toLocaleString()}`],
                    ['Active Loan Accounts', (stats.activeLoansCount || 0).toString()]
                ],
                theme: 'striped',
                headStyles: { fillColor: [16, 185, 129] } // emerald-500
            });

            // Transactions Table
            const finalY = doc.lastAutoTable.finalY || 100;
            doc.setTextColor(15, 23, 42);
            doc.setFontSize(12);
            doc.text('Recent Transactions in this Period:', 20, finalY + 15);
            
            const txnBody = filteredData.transactions.slice(0, 20).map(t => {
                const loan = loans.find(l => l.id === t.loanId);
                const customer = customers.find(c => c.id === loan?.customerId);
                return [t.date, customer?.name || 'N/A', `PHP ${t.amount.toLocaleString()}`];
            });

            autoTable(doc, {
                startY: finalY + 20,
                head: [['Date', 'Customer', 'Amount']],
                body: txnBody.length > 0 ? txnBody : [['-', 'No transactions found', '-']],
                headStyles: { fillColor: [15, 23, 42] }
            });

            doc.save(`Moncada_Report_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (error) {
            console.error('PDF Generation Error:', error);
            alert('An error occurred while generating the PDF. Please try again.');
        }
    };

    const getGroupName = (id) => loanGroups.find(g => g.id === id)?.name || id;


    return (
        <div className="space-y-8 pb-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Loans Analytics</h2>
                    <p className="text-slate-500 text-sm font-medium">Insights into lending performance and collection cycles.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={exportToPDF}
                        className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl transition-all font-bold shadow-lg shadow-slate-200"
                    >
                        <Download size={18} />
                        Export Report (PDF)
                    </button>
                    <button
                        onClick={() => {
                            exportCollectionSheet({
                                loans,
                                customers,
                                groups: loanGroups.filter(g => selectedBarangay === 'All' || g.barangay === selectedBarangay),
                                settings,
                                centerName: selectedBarangay === 'All' ? 'All Barangays' : selectedBarangay,
                                generatedBy: currentUser?.name
                            });
                        }}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl transition-all font-bold shadow-lg shadow-indigo-100"
                    >
                        <FileText size={18} />
                        Collection Sheet
                    </button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Total Loans', value: `₱${stats.totalLoansAmount.toLocaleString()}`, icon: Wallet, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    { label: 'Collections', value: `₱${stats.totalCollections.toLocaleString()}`, icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Active Loans', value: stats.activeLoansCount, icon: Users, color: 'text-sky-600', bg: 'bg-sky-50' },
                    { label: 'Revenue (Est)', value: `₱${stats.totalInterest.toLocaleString()}`, icon: TrendingUp, color: 'text-violet-600', bg: 'bg-violet-50' },
                ].map((item, i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${item.bg} ${item.color}`}>
                            <item.icon size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{item.label}</p>
                            <p className="text-xl font-black text-slate-900">{item.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Advanced Filters */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-6 border-b border-slate-50 pb-4">
                    <Filter size={18} className="text-brand-600" />
                    <h3 className="font-bold text-slate-800">Advanced Filters</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Time Range</label>
                        <div className="flex bg-slate-100 p-1 rounded-xl">
                            {['Weekly', 'Monthly', 'Yearly'].map(range => (
                                <button
                                    key={range}
                                    onClick={() => setTimeRange(range)}
                                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${timeRange === range ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    {range}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Barangay</label>
                        <select
                            value={selectedBarangay}
                            onChange={(e) => setSelectedBarangay(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                        >
                            <option value="All">All Barangays</option>
                            {BARANGAYS.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Loan Group</label>
                        <select
                            value={selectedGroup}
                            onChange={(e) => setSelectedGroup(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                        >
                            <option value="All">All Groups</option>
                            {loanGroups.filter(g => selectedBarangay === 'All' || g.barangay === selectedBarangay).map(g => (
                                <option key={g.id} value={g.id}>{g.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Loan Type</label>
                        <select
                            value={selectedLoanType}
                            onChange={(e) => setSelectedLoanType(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                        >
                            <option value="All">All Types</option>
                            <option value="Regular Loan">Regular Loan</option>
                            <option value="Housing Loan">Housing Loan</option>
                            <option value="Multi-Purpose Loan">Multi-Purpose Loan</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Collections Over Time */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <DollarSign size={18} className="text-emerald-500" />
                                Collection Cycles
                            </h3>
                            <p className="text-xs text-slate-400 font-medium">Weekly/Monthly collection performance</p>
                        </div>
                    </div>
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorCol" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                    itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                                />
                                <Area type="monotone" dataKey="collections" stroke="#10b981" fillOpacity={1} fill="url(#colorCol)" strokeWidth={3} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Collections by Group */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Users size={18} className="text-indigo-500" />
                                Collections by Group (Batched)
                            </h3>
                            <p className="text-xs text-slate-400 font-medium">Batched collection totals per group</p>
                        </div>
                    </div>
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart 
                                data={useMemo(() => {
                                    const groupColls = {};
                                    filteredData.transactions.forEach(t => {
                                        const loan = loans.find(l => l.id === t.loanId);
                                        const gName = loan?.groupId ? getGroupName(loan.groupId) : 'Individual';
                                        groupColls[gName] = (groupColls[gName] || 0) + t.amount;
                                    });
                                    return Object.entries(groupColls).map(([name, value]) => ({ name, value }));
                                }, [filteredData, loans])} 
                                layout="vertical"
                            >
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} width={100} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                    formatter={(value) => [`₱${value.toLocaleString()}`, 'Total Collected']}
                                />
                                <Bar dataKey="value" fill="#6366f1" radius={[0, 6, 6, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Loans Issued Over Time */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Layers size={18} className="text-blue-500" />
                                Loan Disbursements
                            </h3>
                            <p className="text-xs text-slate-400 font-medium">Total loan volume by period</p>
                        </div>
                    </div>
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                    cursor={{fill: '#f8fafc'}}
                                />
                                <Bar dataKey="loans" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={24} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;
