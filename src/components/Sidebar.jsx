import React from 'react';
import { useSystem } from '../context/AppContext';
import { Home, Users, Wallet, CreditCard, ShieldCheck, LogOut, BarChart3 } from 'lucide-react';

const Sidebar = ({ activeView, setActiveView, isOpen }) => {
    const { currentUser, logout } = useSystem();
    const role = currentUser?.role;

    const menuItems = [
        { id: 'dashboard', label: 'Main Dashboard', icon: Home, roles: ['admin', 'officer', 'cashier'] },
        { id: 'analytics', label: 'Loans Analytics', icon: BarChart3, roles: ['admin', 'officer'] },
        { id: 'customers', label: 'Customers', icon: Users, roles: ['admin', 'officer'] },
        { id: 'loans', label: 'Loans', icon: Wallet, roles: ['admin', 'officer'] },
        { id: 'payments', label: 'Payments', icon: CreditCard, roles: ['admin', 'officer', 'cashier'] },
        { id: 'accounts', label: 'Accounts', icon: ShieldCheck, roles: ['admin'] },
    ];

    const filteredItems = menuItems.filter(item => item.roles.includes(role));

    return (
        <aside className={`w-64 bg-slate-950 border-r border-slate-900 flex flex-col h-screen fixed inset-y-0 left-0 z-50 shadow-2xl transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
            <div className="p-6 border-b border-slate-900 flex items-center gap-3">
                <div className="bg-gradient-to-br from-indigo-500 to-blue-700 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                    <span className="text-white font-black text-xl">S</span>
                </div>
                <div>
                    <h1 className="text-white font-black text-lg tracking-tighter leading-none bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">SERVIAMUS</h1>
                    <p className="text-indigo-400 text-[8px] uppercase tracking-widest font-bold mt-1 leading-tight">Foundation Inc.</p>
                </div>
            </div>

            <nav className="flex-1 p-4 space-y-2">
                {filteredItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeView === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => setActiveView(item.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group
                                ${isActive
                                    ? 'bg-brand-600/10 text-brand-400 border border-brand-600/20 shadow-[0_0_15px_-3px_rgba(74,222,128,0.15)]' // Glowing active state
                                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/50 border border-transparent'
                                }`}
                        >
                            <Icon size={18} className={`transition-colors ${isActive ? 'text-brand-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                            {item.label}
                        </button>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-slate-800">
                <div className="flex items-center gap-3 px-4 py-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white">
                        {currentUser?.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{currentUser?.name}</p>
                        <p className="text-xs text-slate-500 capitalize">{currentUser?.role}</p>
                    </div>
                </div>
                <button
                    onClick={logout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                >
                    <LogOut size={16} />
                    Sign Out
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
