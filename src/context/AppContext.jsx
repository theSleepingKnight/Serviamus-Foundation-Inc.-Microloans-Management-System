import React, { createContext, useContext, useState, useEffect } from 'react';
import { USERS, INITIAL_CUSTOMERS, INITIAL_LOANS, INITIAL_TRANSACTIONS, INITIAL_LOGS, INITIAL_LOAN_GROUPS } from '../data/mockData';

const AppContext = createContext();

// Storage Keys
const STORAGE_KEYS = {
    CUSTOMERS: 'ms_customers',
    LOANS: 'ms_loans',
    STAFF: 'ms_staff',
    TRANSACTIONS: 'ms_transactions',
    LOGS: 'ms_audit_logs',
    USER: 'ms_session',
    GROUPS: 'ms_loan_groups',
    SETTINGS: 'ms_system_settings'
};

export const SystemProvider = ({ children }) => {
    // Helper to load from localStorage
    const loadFromStorage = (key, defaultValue) => {
        try {
            const saved = localStorage.getItem(key);
            return saved ? JSON.parse(saved) : defaultValue;
        } catch (e) {
            console.error(`Error loading ${key} from storage:`, e);
            return defaultValue;
        }
    };

    const [currentUser, setCurrentUser] = useState(() => loadFromStorage(STORAGE_KEYS.USER, null));
    const [customers, setCustomers] = useState(() => {
        const saved = loadFromStorage(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
        return saved.map(c => ({
            ...c,
            cbuBalance: c.cbuBalance || 0,
            sdBalance: c.sdBalance || 0
        }));
    });
    const [loans, setLoans] = useState(() => loadFromStorage(STORAGE_KEYS.LOANS, INITIAL_LOANS));
    const [staffAccounts, setStaffAccounts] = useState(() => loadFromStorage(STORAGE_KEYS.STAFF, USERS));
    const [transactions, setTransactions] = useState(() => loadFromStorage(STORAGE_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS));
    const [auditLogs, setAuditLogs] = useState(() => loadFromStorage(STORAGE_KEYS.LOGS, INITIAL_LOGS));
    const [loanGroups, setLoanGroups] = useState(() => {
        const saved = loadFromStorage(STORAGE_KEYS.GROUPS, INITIAL_LOAN_GROUPS);
        return saved.map(g => ({
            ...g,
            status: g.status || 'Active'
        }));
    });
    const [settings, setSettings] = useState(() => loadFromStorage(STORAGE_KEYS.SETTINGS, {
        adminFeePercent: 2,
        cbuPercent: 1, // Traditional 1%
        afPercent: 0.5, // Insurance/Admin Fee
        sdPercent: 1.5 // Mandatory Savings
    }));

    // Persist to localStorage whenever state changes
    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
    }, [customers]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.LOANS, JSON.stringify(loans));
    }, [loans]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(staffAccounts));
    }, [staffAccounts]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    }, [transactions]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(auditLogs));
    }, [auditLogs]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(loanGroups));
    }, [loanGroups]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    }, [settings]);

    useEffect(() => {
        if (currentUser) {
            localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser));
        } else {
            localStorage.removeItem(STORAGE_KEYS.USER);
        }
    }, [currentUser]);

    const login = (email, password) => {
        const user = staffAccounts.find(u => u.email === email && u.password === password);
        if (user) {
            setCurrentUser(user);
            return true;
        }
        return false;
    };

    const logout = () => {
        setCurrentUser(null);
    };

    const resetSystemData = () => {
        if (window.confirm("CRITICAL: This will delete ALL current loans, groups, customers, and transactions and reset them to factory defaults. This action cannot be undone. Continue?")) {
            // Clear all database keys except the session
            Object.values(STORAGE_KEYS).forEach(key => {
                if (key !== STORAGE_KEYS.USER) {
                    localStorage.removeItem(key);
                }
            });
            // Refresh to re-initialize state from mockData.js
            window.location.reload();
        }
    };

    const canAccess = (requiredRole) => {
        if (!currentUser) return false;
        if (Array.isArray(requiredRole)) {
            return requiredRole.includes(currentUser.role);
        }
        return currentUser.role === requiredRole;
    };

    const logAction = (action) => {
        const newLog = {
            id: `log_${Date.now()}`,
            action,
            user: currentUser ? currentUser.name : 'System',
            timestamp: new Date().toISOString()
        };
        setAuditLogs(prev => [newLog, ...prev]);
    };

    // --- Loan Groups & Capacity ---

    const createLoanGroup = (groupData) => {
        const newGroup = {
            ...groupData,
            id: `group_${Date.now()}`,
            status: 'Active',
            loanIds: [],
            createdAt: new Date().toISOString()
        };
        setLoanGroups([...loanGroups, newGroup]);
        logAction(`Created loan group: ${newGroup.name}`);
        return newGroup;
    };

    const getOfficerCapacity = (officerId, barangay) => {
        // Return 5 - active loans in active groups for this officer in this barangay
        const activeGroups = loanGroups.filter(g => g.officerId === officerId && g.barangay === barangay && g.status === 'Active');
        // This is tricky. User said "5 loans per group". 
        // So we need to show slots available IN the group? 
        // Or slots available for the officer to START a new group?
        // User clarified: "show the current loan officer available in that barangay... 4/5 slots available"
        // Let's interpret as: current slot availability in the most recently created active group, or 5 if no group exists.
        
        const currentGroup = activeGroups.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
        if (!currentGroup) return { group: null, slots: 5 };
        
        return { 
            group: currentGroup, 
            slots: 5 - currentGroup.loanIds.length 
        };
    };

    const updateLoanGroup = (groupId, updates) => {
        setLoanGroups(prev => prev.map(g => g.id === groupId ? { ...g, ...updates } : g));
    };

    // --- Transactions & Loans ---

    const processPayment = (loanId, amount) => {
        const loan = loans.find(l => l.id === loanId);
        if (!loan) return;

        // 1. Update Loan Balance
        setLoans(prevLoans => prevLoans.map(l => {
            if (l.id === loanId) {
                const newBalance = Math.max(0, l.remainingBalance - amount);
                const newStatus = newBalance === 0 ? 'Paid' : l.status;
                
                if (newStatus === 'Paid' && l.groupId) {
                    setTimeout(() => checkAndCloseGroup(l.groupId), 100);
                }
                
                return { ...l, remainingBalance: newBalance, status: newStatus };
            }
            return l;
        }));

        // 2. Automate CBU and SD (Savings)
        // We define that a portion of the payment goes to savings/capital
        // Based on the percentages in our settings
        const cbuContribution = amount * ((settings.cbuPercent || 1) / 100);
        const sdContribution = amount * ((settings.sdPercent || 1.5) / 100);

        setCustomers(prev => prev.map(c => {
            if (c.id === loan.customerId) {
                return {
                    ...c,
                    cbuBalance: (c.cbuBalance || 0) + cbuContribution,
                    sdBalance: (c.sdBalance || 0) + sdContribution
                };
            }
            return c;
        }));

        // 3. Add Transaction Record
        const newTransaction = {
            id: `txn_${Date.now()}`,
            loanId,
            amount,
            cbu: cbuContribution,
            sd: sdContribution,
            date: new Date().toISOString().split('T')[0],
            processedBy: currentUser ? currentUser.id : 'Unknown'
        };
        setTransactions(prev => [newTransaction, ...prev]);

        // 4. Log Action
        logAction(`Processed payment of ₱${amount} for Loan #${loanId}. (CBU: +₱${Math.round(cbuContribution)}, SD: +₱${Math.round(sdContribution)})`);
    };

    const checkAndCloseGroup = (groupId) => {
        const groupLoans = loans.filter(l => l.groupId === groupId);
        if (groupLoans.length > 0 && groupLoans.every(l => l.status === 'Paid')) {
            updateLoanGroup(groupId, { status: 'Closed' });
            logAction(`Loan Group ${groupId} has been closed (all loans paid).`);
        }
    };

    const createLoan = (loanData) => {
        const newLoanId = `l_${Date.now()}`;
        const newLoan = {
            ...loanData,
            id: newLoanId,
            status: 'Pending',
            remainingBalance: loanData.amount,
            startDate: new Date().toISOString().split('T')[0]
        };

        setLoans([...loans, newLoan]);

        // Update Group if provided
        if (loanData.groupId) {
            setLoanGroups(prev => prev.map(g => {
                if (g.id === loanData.groupId) {
                    return { ...g, loanIds: [...g.loanIds, newLoanId] };
                }
                return g;
            }));
        }

        logAction(`Created loan application for ₱${loanData.amount}`);
        return newLoan;
    };

    const updateLoanStatus = (loanId, status) => {
        setLoans(prev => prev.map(l => l.id === loanId ? { ...l, status } : l));
        logAction(`Updated Loan #${loanId} status to ${status}`);
    };

    const updateLoan = (loanId, updates) => {
        setLoans(prev => prev.map(l => l.id === loanId ? { ...l, ...updates } : l));
        logAction(`Updated details for Loan #${loanId}`);
    };

    // --- Customers ---

    const addNewCustomer = (customerData) => {
        const newCustomer = {
            ...customerData,
            id: `c_${Date.now()}`,
            joinedDate: new Date().toISOString().split('T')[0],
            status: 'Active',
            cbuBalance: Number(customerData.cbuBalance) || 0,
            sdBalance: Number(customerData.sdBalance) || 0
        };
        setCustomers([...customers, newCustomer]);
        logAction(`Registered new customer: ${customerData.name} (Initial CBU: ${newCustomer.cbuBalance}, SD: ${newCustomer.sdBalance})`);
        return newCustomer;
    };

    const updateCustomer = (customerId, updates) => {
        setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, ...updates } : c));
        logAction(`Updated customer profile: ${customerId}`);
    };

    const toggleCustomerStatus = (customerId) => {
        setCustomers(prevCustomers => prevCustomers.map(c => {
            if (c.id === customerId) {
                const newStatus = c.status === 'Active' ? 'Disabled' : 'Active';
                logAction(`Changed customer ${c.name} status to ${newStatus}`);
                return { ...c, status: newStatus };
            }
            return c;
        }));
    };

    const transferCustomer = (customerId, targetBarangay, targetGroupId) => {
        const customer = customers.find(c => c.id === customerId);
        if (!customer) return;

        // 1. Update Customer Profile
        setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, barangay: targetBarangay } : c));
        
        // 2. Handle Active Loan if exists
        const activeLoan = loans.find(l => l.customerId === customerId && (l.status === 'Active' || l.status === 'Pending'));
        
        if (activeLoan) {
            const oldGroupId = activeLoan.groupId;
            const targetGroup = loanGroups.find(g => g.id === targetGroupId);
            
            // Remove from old group
            if (oldGroupId) {
                setLoanGroups(prev => prev.map(g => {
                    if (g.id === oldGroupId) {
                        return { ...g, loanIds: g.loanIds.filter(id => id !== activeLoan.id) };
                    }
                    return g;
                }));
            }
            
            // Update Loan
            setLoans(prev => prev.map(l => {
                if (l.id === activeLoan.id) {
                    return { 
                        ...l, 
                        groupId: targetGroupId || '', 
                        officerId: targetGroup?.officerId || l.officerId 
                    };
                }
                return l;
            }));
            
            // Add to new group
            if (targetGroupId) {
                setLoanGroups(prev => prev.map(g => {
                    if (g.id === targetGroupId) {
                        return { ...g, loanIds: [...g.loanIds, activeLoan.id] };
                    }
                    return g;
                }));
            }
            
            logAction(`TRANSFER: ${customer.name} moved to ${targetBarangay}. Loan #${activeLoan.id} reassigned to Group: ${targetGroup?.name || 'N/A'}`);
        } else {
            logAction(`TRANSFER: ${customer.name} moved to ${targetBarangay}. (Profile only)`);
        }
    };

    // --- Staff Accounts ---

    const createStaffAccount = (newAccount) => {
        if (staffAccounts.some(u => u.email === newAccount.email)) {
            throw new Error('Email already exists');
        }
        setStaffAccounts([...staffAccounts, { ...newAccount, id: `staff_${Date.now()}`, status: 'Active' }]);
        logAction(`Created staff account: ${newAccount.email}`);
    };

    const updateStaffAccount = (accountId, updates) => {
        setStaffAccounts(prevAccounts => prevAccounts.map(account => {
            if (account.id === accountId) {
                return { ...account, ...updates };
            }
            return account;
        }));
        logAction(`Updated staff account: ${accountId}`);
    };

    const deleteStaffAccount = (accountId) => {
        setStaffAccounts(prevAccounts => prevAccounts.filter(account => account.id !== accountId));
        logAction(`Deleted staff account: ${accountId}`);
    };

    return (
        <AppContext.Provider value={{
            currentUser,
            customers,
            loans,
            staffAccounts,
            transactions,
            auditLogs,
            loanGroups,
            login,
            logout,
            canAccess,
            processPayment,
            createLoan,
            updateLoanStatus,
            updateLoan,
            addNewCustomer,
            updateCustomer,
            toggleCustomerStatus,
            transferCustomer,
            createStaffAccount,
            updateStaffAccount,
            deleteStaffAccount,
            createLoanGroup,
            getOfficerCapacity,
            updateLoanGroup,
            logAction,
            settings,
            resetSystemData,
            updateSettings: (newSettings) => setSettings(prev => ({ ...prev, ...newSettings }))
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useSystem = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useSystem must be used within a SystemProvider');
    }
    return context;
};
