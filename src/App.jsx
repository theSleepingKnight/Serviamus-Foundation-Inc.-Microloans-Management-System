import React, { useState } from 'react';
import { Menu } from 'lucide-react';
import { SystemProvider, useSystem } from './context/AppContext';
import Sidebar from './components/Sidebar';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Customers from './components/Customers';
import Loans from './components/Loans';
import Payments from './components/Payments';
import Accounts from './components/Accounts';
import Analytics from './components/Analytics';
import Overdue from './components/Overdue';

// AppContent - Internal component to use context
const AppContent = () => {
    const { currentUser } = useSystem();
    const [activeView, setActiveView] = React.useState(() => {
        return localStorage.getItem('ms_active_view') || 'dashboard';
    });
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Persist active view
    React.useEffect(() => {
        localStorage.setItem('ms_active_view', activeView);
    }, [activeView]);

    // Reset view to dashboard on logout
    React.useEffect(() => {
        if (!currentUser) {
            localStorage.setItem('ms_active_view', 'dashboard');
            setActiveView('dashboard');
        }
    }, [currentUser]);

    if (!currentUser) {
        return <Login />;
    }

    // Determine which component to render
    const renderView = () => {
        switch (activeView) {
            case 'dashboard':
                return <Dashboard />;
            case 'analytics':
                return <Analytics />;
            case 'customers':
                return <Customers />;
            case 'loans':
                return <Loans />;
            case 'payments':
                return <Payments />;
            case 'overdue':
                return <Overdue />;
            case 'accounts':
                return <Accounts />;
            default:
                return <Dashboard />;
        }
    };

    return (
        <div className="flex bg-slate-50 min-h-screen font-sans relative">
            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            <Sidebar
                activeView={activeView}
                setActiveView={(view) => {
                    setActiveView(view);
                    setIsSidebarOpen(false); // Close sidebar on mobile when item clicked
                }}
                isOpen={isSidebarOpen}
            />

            <div className="flex-1 flex flex-col min-h-screen md:ml-64 transition-all duration-300">
                {/* Mobile Header */}
                <header className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-30 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-green-400 to-emerald-600 w-8 h-8 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <span className="text-white font-black text-lg">M</span>
                        </div>
                        <span className="font-bold text-slate-800 tracking-tight">Moncada</span>
                    </div>
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <Menu size={24} />
                    </button>
                </header>

                <main className="flex-1 p-4 md:p-8 animate-in fade-in duration-300">
                    <div className="max-w-7xl mx-auto">
                        {renderView()}
                    </div>
                </main>
            </div>
        </div>
    );
};

const App = () => {
    return (
        <SystemProvider>
            <AppContent />
        </SystemProvider>
    );
};

export default App;
