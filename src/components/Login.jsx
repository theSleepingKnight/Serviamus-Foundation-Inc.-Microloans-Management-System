import React, { useState } from 'react';
import { useSystem } from '../context/AppContext';
import { Lock, Mail } from 'lucide-react';

const Login = () => {
    const { login } = useSystem();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);

    const handleSubmit = (e) => {
        e.preventDefault();
        setError(null);
        const success = login(email, password);
        if (!success) {
            setError('Invalid credentials');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black relative overflow-hidden">
            {/* Ambient Background Effects */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none mix-blend-screen animate-pulse"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none mix-blend-screen"></div>

            <div className="w-full max-w-md p-8 bg-slate-900/40 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-800 relative z-10">
                <div className="text-center mb-8">
                    <div className="mx-auto w-14 h-14 bg-gradient-to-br from-indigo-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-6 rotate-3 hover:rotate-0 transition-transform duration-300">
                        <span className="text-white font-black text-3xl drop-shadow-sm">S</span>
                    </div>
                    <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-blue-200 mb-2 tracking-tighter">
                        SERVIAMUS
                    </h1>
                    <p className="text-indigo-400 font-bold uppercase tracking-[0.2em] text-[10px] leading-relaxed">
                        Foundation Inc.<br/>
                        <span className="text-[9px] text-slate-500 tracking-widest opacity-80 font-medium">Customer Loans Management System</span>
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="p-3 text-sm text-red-400 bg-red-950/30 rounded-lg border border-red-900/50 flex items-center justify-center">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Email Address</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-slate-500 group-focus-within:text-brand-400 transition-colors" />
                            </div>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/50 outline-none transition-all"
                                placeholder="name@company.com"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Password</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-slate-500 group-focus-within:text-brand-400 transition-colors" />
                            </div>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/50 outline-none transition-all"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full py-3 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-brand-500/20 hover:shadow-brand-500/40 transform hover:-translate-y-0.5"
                    >
                        Sign In
                    </button>

                    <div className="mt-6 p-4 bg-slate-950/30 rounded-lg border border-slate-800/50">
                        <p className="text-xs text-slate-500 text-center uppercase tracking-wider font-semibold mb-2">Demo Access</p>
                        <div className="flex flex-col gap-2 text-xs text-slate-400 font-mono">
                            <div className="flex justify-between border-b border-slate-800/50 pb-1">
                                <span>admin@test.com</span>
                                <span className="text-slate-500">password</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-800/50 pb-1">
                                <span>officer@test.com</span>
                                <span className="text-slate-500">password</span>
                            </div>
                            <div className="flex justify-between">
                                <span>cashier@test.com</span>
                                <span className="text-slate-500">password</span>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
