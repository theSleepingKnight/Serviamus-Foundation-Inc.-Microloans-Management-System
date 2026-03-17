import React, { useState } from 'react';
import { useSystem } from '../context/AppContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar, RadialBarChart, RadialBar, AreaChart, Area } from 'recharts';
import { Activity, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';


const Dashboard = () => {
    const { customers, loans, currentUser, auditLogs, loanGroups, staffAccounts, transactions } = useSystem();
    const [timeFilter, setTimeFilter] = useState('Overall');

    // Helper to check if date is within range
    const isWithinRange = (dateString, filter) => {
        if (filter === 'Overall') return true;

        const date = new Date(dateString);
        // Find latest date in data to use as "Now" reference
        const loanDates = loans.map(l => new Date(l.startDate).getTime());
        const customerDates = customers.map(c => new Date(c.joinedDate).getTime());
        const allDates = [...loanDates, ...customerDates];
        const maxDate = allDates.length > 0 ? new Date(Math.max(...allDates)) : new Date();

        const diffTime = Math.abs(maxDate - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (filter === 'Weekly') return diffDays <= 7;
        if (filter === 'Monthly') return diffDays <= 30;
        if (filter === 'Yearly') return date.getFullYear() === maxDate.getFullYear();

        return true;
    };

    const filteredLoans = loans.filter(l => isWithinRange(l.startDate, timeFilter));
    const filteredCustomers = customers.filter(c => isWithinRange(c.joinedDate, timeFilter));

    // Calculate Metrics based on FILTERED data
    const activeLoansCount = filteredLoans.filter(l => l.status === 'Active' || l.status === 'Pending').length;
    const totalCBU = customers.reduce((sum, c) => sum + (c.cbuBalance || 0), 0);
    const totalSD = customers.reduce((sum, c) => sum + (c.sdBalance || 0), 0);

    // Revenue Estimation
    const estimatedRevenue = filteredLoans.reduce((sum, loan) => {
        const interest = loan.amount * (loan.interestRate / 100) * (loan.term / 12);
        return sum + interest;
    }, 0);

    const outstandingDebt = filteredLoans
        .filter(l => l.status === 'Active')
        .reduce((sum, loan) => sum + loan.remainingBalance, 0);

    // Chart Data Preparation (using filtered loans)
    const statusData = [
        { name: 'Active', value: filteredLoans.filter(l => l.status === 'Active').length, color: '#0ea5e9' },
        { name: 'Pending', value: filteredLoans.filter(l => l.status === 'Pending').length, color: '#eab308' },
        { name: 'Paid', value: filteredLoans.filter(l => l.status === 'Paid').length, color: '#22c55e' },
        { name: 'Defaulted', value: filteredLoans.filter(l => l.status === 'Defaulted').length, color: '#ef4444' },
    ].filter(d => d.value > 0);

    const typeData = filteredLoans.reduce((acc, loan) => {
        const type = loan.loanType || 'Regular Loan';
        const existing = acc.find(d => d.name === type);
        if (existing) {
            existing.value += loan.amount;
        } else {
            acc.push({ name: type, value: loan.amount });
        }
        return acc;
    }, []);

    const tickFormatter = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    // Sort loans by date for the line chart
    const sortedLoans = [...filteredLoans].sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

    // Aggregate by date
    const visualDataMap = sortedLoans.reduce((acc, loan) => {
        const date = loan.startDate;
        if (!acc[date]) acc[date] = 0;
        acc[date] += loan.amount;
        return acc;
    }, {});

    const performanceData = Object.entries(visualDataMap).map(([date, value]) => ({
        name: date,
        value: value
    })).sort((a, b) => new Date(a.name) - new Date(b.name));

    const exportToDashboardPDF = () => {
        try {
            const doc = new jsPDF();
            const timestamp = new Date().toLocaleString();
            
            // Branding Header
            doc.setFillColor(15, 23, 42); // slate-950
            doc.rect(0, 0, 210, 40, 'F');
            
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(22);
            doc.setFont('helvetica', 'bold');
            doc.text('SERVIAMUS FOUNDATION INC.', 20, 20);
            
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text('Main Dashboard Summary Report', 20, 28);
            doc.text(`Generated: ${timestamp}`, 140, 28);

            // Filter Focus
            doc.setTextColor(50, 50, 50);
            doc.setFontSize(12);
            doc.text(`Report Period: ${timeFilter}`, 20, 50);

            // Key Metrics Table
            autoTable(doc, {
                startY: 60,
                head: [['Key Metric', 'Performance Value']],
                body: [
                    ['Total New Customers', filteredCustomers.length.toString()],
                    ['Loan Disbursements', filteredLoans.length.toString()],
                    ['Interest Income (Projected)', `PHP ${estimatedRevenue.toLocaleString()}`],
                    ['Outstanding Debt (Total)', `PHP ${outstandingDebt.toLocaleString()}`],
                    ['Current Active Loans', activeLoansCount.toString()]
                ],
                theme: 'striped',
                headStyles: { fillColor: [79, 70, 229] } // indigo-600
            });

            // Loan Distribution by Status
            doc.setTextColor(15, 23, 42);
            doc.setFontSize(12);
            doc.text('Portfolio Status Breakdown:', 20, doc.lastAutoTable.finalY + 15);
            
            autoTable(doc, {
                startY: doc.lastAutoTable.finalY + 20,
                head: [['Status', 'Number of Loans']],
                body: statusData.map(d => [d.name, d.value.toString()]),
                headStyles: { fillColor: [15, 23, 42] }
            });

            // Portfolio by Type
            doc.text('Portfolio by Loan Type:', 20, doc.lastAutoTable.finalY + 15);
            
            autoTable(doc, {
                startY: doc.lastAutoTable.finalY + 20,
                head: [['Loan Type', 'Total Principal']],
                body: typeData.map(d => [d.name, `PHP ${d.value.toLocaleString()}`]),
                headStyles: { fillColor: [15, 23, 42] }
            });

            doc.save(`Serviamus_Dashboard_Summary_${timeFilter}_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (error) {
            console.error('PDF Generation Error:', error);
            alert('An error occurred while generating the dashboard PDF.');
        }
    };

    const isCashier = currentUser?.role === 'cashier';

    // Stats for Cashier Dashboard
    const todayStr = new Date().toISOString().split('T')[0];
    const todayTransactions = (isCashier ? transactions : transactions).filter(t => t.date === todayStr);
    const todayCollected = todayTransactions.reduce((sum, t) => sum + t.amount, 0);
    const pendingDisbursements = loans.filter(l => l.status === 'Approved');

    const Card = ({ title, value, subtext, subtextColor, icon: Icon }) => (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all hover:translate-y-[-2px] group">
            <div className="flex justify-between items-start mb-4">
                <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{title}</h3>
                {Icon && <Icon size={18} className="text-slate-300 group-hover:text-brand-500 transition-colors" />}
            </div>
            <p className="text-2xl font-black text-slate-900 mb-1">{value}</p>
            {subtext && <p className={`text-xs font-bold ${subtextColor || 'text-slate-400'}`}>{subtext}</p>}
        </div>
    );

    if (isCashier) {
        return (
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Collection Dashboard</h2>
                    <p className="text-sm font-medium text-slate-500">Overview for {currentUser?.name} • {todayStr}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card 
                        title="Today's Total" 
                        value={`₱${todayCollected.toLocaleString()}`} 
                        subtext={`${todayTransactions.length} Payments`}
                        subtextColor="text-emerald-500"
                        icon={Activity}
                    />
                    <Card 
                        title="Pending Releases" 
                        value={pendingDisbursements.length} 
                        subtext="Ready for disbursement"
                        subtextColor="text-amber-500"
                        icon={Activity}
                    />
                    <Card 
                        title="Active Portfolio" 
                        value={loans.filter(l => l.status === 'Active').length} 
                        subtext="Ongoing loans"
                        subtextColor="text-indigo-500"
                        icon={Activity}
                    />
                    <Card 
                        title="Recent Activity" 
                        value={auditLogs.filter(l => l.user === currentUser?.name).length} 
                        subtext="Actions today"
                        subtextColor="text-slate-500"
                        icon={Activity}
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                        <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                            <Activity size={20} className="text-brand-600" />
                            Recent Collections
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                                    <tr>
                                        <th className="pb-4">Loan ID</th>
                                        <th className="pb-4">Borrower</th>
                                        <th className="pb-4 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {todayTransactions.slice(0, 5).map(t => {
                                        const loan = loans.find(l => l.id === t.loanId);
                                        const customer = customers.find(c => c.id === loan?.customerId);
                                        return (
                                            <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="py-4 font-mono text-xs text-slate-400">#{t.loanId}</td>
                                                <td className="py-4 font-bold text-slate-800">{customer?.name}</td>
                                                <td className="py-4 text-right font-black text-emerald-600">₱{t.amount.toLocaleString()}</td>
                                            </tr>
                                        );
                                    })}
                                    {todayTransactions.length === 0 && (
                                        <tr>
                                            <td colSpan="3" className="py-8 text-center text-slate-400 font-medium italic">No collections today.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                        <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                            <Activity size={20} className="text-brand-600" />
                            To Release
                        </h3>
                        <div className="space-y-4">
                            {pendingDisbursements.slice(0, 5).map(l => {
                                const customer = customers.find(c => c.id === l.customerId);
                                return (
                                    <div key={l.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div>
                                            <p className="text-xs font-black text-slate-900 uppercase">{customer?.name}</p>
                                            <p className="text-[10px] font-bold text-slate-400">₱{l.amount.toLocaleString()} • {l.loanType}</p>
                                        </div>
                                        <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest bg-amber-50 px-2 py-0.5 rounded-md">Approved</span>
                                    </div>
                                );
                            })}
                            {pendingDisbursements.length === 0 && (
                                <p className="text-center py-8 text-slate-400 font-medium italic">No pending disbursements.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center text-left">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight underline">Main Dashboard</h2>
                    <p className="text-slate-500 font-medium">Welcome back, {currentUser?.name}</p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Time Filter */}
                    <div className="bg-white p-1 rounded-lg border border-slate-200 flex text-sm font-medium">
                        {['Weekly', 'Monthly', 'Yearly', 'Overall'].map((filter) => (
                            <button
                                key={filter}
                                onClick={() => setTimeFilter(filter)}
                                className={`px-3 py-1.5 rounded-md transition-all ${timeFilter === filter
                                    ? 'bg-brand-50 text-brand-700 shadow-sm font-bold'
                                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                    }`}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={exportToDashboardPDF}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-all font-bold shadow-md shadow-indigo-100"
                            title="Download PDF Summary"
                        >
                            <Download size={18} />
                            PDF Summary
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                <Card
                    title="Projected Revenue"
                    value={`₱${estimatedRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
                    subtext="Based on interest"
                    subtextColor="text-green-600"
                />
                <Card
                    title="Outstanding Debt"
                    value={`₱${outstandingDebt.toLocaleString()}`}
                    subtext="Principal Remaining"
                    subtextColor="text-red-600"
                />
                <Card
                    title="New Customers"
                    value={filteredCustomers.length}
                    subtext={`In this period`}
                    subtextColor="text-blue-600"
                />
                <Card
                    title="New Loans"
                    value={filteredLoans.length}
                    subtext={`${activeLoansCount} Active`}
                    subtextColor="text-slate-500"
                />
                <Card
                    title="Total CBU"
                    value={`₱${totalCBU.toLocaleString()}`}
                    subtext="Capital Build-Up"
                    subtextColor="text-indigo-600"
                />
                <Card
                    title="Mandatory Savings"
                    value={`₱${totalSD.toLocaleString()}`}
                    subtext="SD Balance"
                    subtextColor="text-brand-600"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Loan Volume Chart */}
                <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
                    <h3 className="text-lg font-black text-slate-800 mb-6">Loan Volume ({timeFilter})</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={performanceData}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis
                                    dataKey="name"
                                    tickFormatter={tickFormatter}
                                    stroke="#94a3b8"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="#94a3b8"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `₱${value / 1000}k`}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value) => [`₱${value.toLocaleString()}`, 'Amount']}
                                    labelFormatter={(label) => new Date(label).toLocaleDateString()}
                                />
                                <Area type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Recent Activity Log */}
                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col">
                    <div className="flex items-center gap-2 mb-6">
                        <Activity size={20} className="text-brand-600" />
                        <h3 className="text-lg font-black text-slate-800 tracking-tight">System Audit Log</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto pr-2 max-h-[300px] space-y-4 custom-scrollbar">
                        {auditLogs && auditLogs.length > 0 ? (
                            auditLogs.map((log) => (
                                <div key={log.id} className="flex gap-3 text-sm border-b border-slate-50 pb-4 last:border-0 last:pb-0">
                                    <div className="mt-1 w-2 h-2 rounded-full bg-slate-200 shrink-0"></div>
                                    <div>
                                        <p className="text-slate-800 font-bold leading-tight mb-1">{log.action}</p>
                                        <p className="text-[10px] font-black uppercase text-slate-400">
                                            {log.user} • {new Date(log.timestamp).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-slate-400 text-sm text-center py-4">No recent activity logged.</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Status Distribution */}
                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
                    <h3 className="text-lg font-black text-slate-800 mb-6">Portfolio Health</h3>
                    <div className="h-64 flex items-center justify-center">
                        {statusData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={statusData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={90}
                                        paddingAngle={8}
                                        dataKey="value"
                                    >
                                        {statusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="text-slate-400 text-sm font-bold">Insufficient data for analysis.</div>
                        )}
                    </div>
                </div>

                {/* Loan Type Distribution */}
                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
                    <h3 className="text-lg font-black text-slate-800 mb-6 font-mono">Product Diversification</h3>
                    <div className="h-64">
                        {typeData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={typeData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={120} stroke="#64748b" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} />
                                    <Tooltip cursor={{ fill: '#f8fafc' }} formatter={(value) => `₱${value.toLocaleString()}`} />
                                    <Bar dataKey="value" fill="#6366f1" radius={[0, 10, 10, 0]} barSize={24} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-slate-400 text-sm font-bold">Waiting for disursements.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
