export const USERS = [
    { id: 'admin1', email: 'admin@test.com', name: 'Juan Dela Cruz', role: 'admin', password: 'password' },
    { id: 'officer1', email: 'officer@test.com', name: 'Maria Santos', role: 'officer', password: 'password', barangays: ['San Jose', 'San Pedro', 'Santo Niño'] },
    { id: 'officer2', email: 'officer2@test.com', name: 'Ricardo Dalisay', role: 'officer', password: 'password', barangays: ['Balangasan', 'Balintawak', 'Buenavista'] },
    { id: 'cashier1', email: 'cashier@test.com', name: 'Jose Rizal', role: 'cashier', password: 'password' },
];

export const INITIAL_CUSTOMERS = [
    { id: 'c1', name: 'Baltazar, Francisco', email: 'kiko@example.com', phone: '0917-123-4567', status: 'Active', joinedDate: '2025-01-15', address: 'Tondo, Manila', barangay: 'San Jose', cbuBalance: 1250, sdBalance: 850, afBalance: 125 },
    { id: 'c2', name: 'Silang, Gabriela', email: 'gabby@example.com', phone: '0918-234-5678', status: 'Active', joinedDate: '2025-02-20', address: 'Vigan, Ilocos Sur', barangay: 'San Pedro', cbuBalance: 2100, sdBalance: 1450, afBalance: 210 },
    { id: 'c3', name: 'Bonifacio, Andres', email: 'andres@example.com', phone: '0919-345-6789', status: 'Disabled', joinedDate: '2025-03-10', address: 'Tondo, Manila', barangay: 'San Jose', cbuBalance: 500, sdBalance: 300, afBalance: 50 },
    { id: 'c4', name: 'Aquino, Melchora', email: 'tandang.sora@example.com', phone: '0920-456-7890', status: 'Active', joinedDate: '2025-04-05', address: 'Santo Niño, Pagadian', barangay: 'Santo Niño', cbuBalance: 3400, sdBalance: 2200, afBalance: 340 },
    { id: 'c5', name: 'Aguinaldo, Emilio', email: 'emilio@example.com', phone: '0921-567-8901', status: 'Active', joinedDate: '2025-05-12', address: 'Kawit, Cavite', barangay: 'San Jose', cbuBalance: 1800, sdBalance: 1100, afBalance: 180 },
    { id: 'c6', name: 'Mabini, Apolinario', email: 'poli@example.com', phone: '0922-678-9012', status: 'Active', joinedDate: '2025-06-18', address: 'Balangasan, Pagadian', barangay: 'Balangasan', cbuBalance: 2900, sdBalance: 1750, afBalance: 290 },
];

export const INITIAL_LOAN_GROUPS = [
    { 
        id: 'group_1', 
        name: 'San Jose_Group 1_03_2026', 
        barangay: 'San Jose', 
        officerId: 'officer1', 
        status: 'Active', 
        loanIds: ['l1', 'l5'],
        createdAt: '2026-03-01T10:00:00Z'
    },
    { 
        id: 'group_2', 
        name: 'Santo Niño_Group 1_03_2026', 
        barangay: 'Santo Niño', 
        officerId: 'officer1', 
        status: 'Active', 
        loanIds: ['l3'],
        createdAt: '2026-03-10T14:30:00Z'
    },
    { 
        id: 'group_3', 
        name: 'Balangasan_Group 1_03_2026', 
        barangay: 'Balangasan', 
        officerId: 'officer2', 
        status: 'Active', 
        loanIds: ['l6'],
        createdAt: '2026-03-12T09:00:00Z'
    }
];

export const INITIAL_LOANS = [
    { id: 'l1', customerId: 'c1', loanType: 'Regular Loan', amount: 25000, interestRate: 3, term: 12, status: 'Active', remainingBalance: 21000, startDate: '2025-06-01', groupId: 'group_1', officerId: 'officer1' },
    { id: 'l2', customerId: 'c2', loanType: 'Housing Loan', amount: 30000, interestRate: 2, term: 24, status: 'Active', remainingBalance: 30000, startDate: '2026-03-01', officerId: 'officer1' },
    { id: 'l3', customerId: 'c4', loanType: 'Multi-Purpose Loan', amount: 10000, interestRate: 0, term: 6, status: 'Active', remainingBalance: 8000, startDate: '2026-01-10', groupId: 'group_2', officerId: 'officer1' },
    { id: 'l4', customerId: 'c5', loanType: 'Regular Loan', amount: 35000, interestRate: 3.5, term: 18, status: 'Active', remainingBalance: 32000, startDate: '2026-02-20', officerId: 'officer1' },
    { id: 'l5', customerId: 'c1', loanType: 'Multi-Purpose Loan', amount: 5000, interestRate: 0, term: 6, status: 'Pending', remainingBalance: 5000, startDate: '2026-03-01', groupId: 'group_1', officerId: 'officer1' },
    { id: 'l6', customerId: 'c6', loanType: 'Regular Loan', amount: 15000, interestRate: 3, term: 12, status: 'Active', remainingBalance: 15000, startDate: '2026-03-15', groupId: 'group_3', officerId: 'officer2' },
];

export const INITIAL_TRANSACTIONS = [
    { id: 't1', loanId: 'l1', amount: 4000, date: '2025-07-01', processedBy: 'cashier1' }, // Delinquent Francisco Baltazar
    { id: 't2', loanId: 'l3', amount: 2000, date: '2026-03-16', processedBy: 'cashier1' }, // On-time Melchora Aquino
    { id: 't3', loanId: 'l2', amount: 1000, date: '2026-03-17', processedBy: 'cashier1' }, // On-time Gabriela Silang
    { id: 't4', loanId: 'l4', amount: 3000, date: '2026-03-15', processedBy: 'cashier1' }, // On-time Emilio Aguinaldo
    { id: 't5', loanId: 'l6', amount: 1000, date: '2026-03-16', processedBy: 'cashier1' }, // On-time Apolinario Mabini
];

export const INITIAL_LOGS = [
    { id: 'log1', action: 'Created Loan #l1', user: 'officer1', timestamp: '2025-06-01T08:30:00' },
    { id: 'log2', action: 'Approved Loan #l1', user: 'admin1', timestamp: '2025-06-02T09:15:00' },
];
