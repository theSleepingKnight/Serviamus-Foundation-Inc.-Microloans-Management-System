export const LOAN_TYPES = {
    REGULAR: { label: 'Regular Loan', rate: 3, max: 300000 },
    HOUSING: { label: 'Housing Loan', rate: 2, max: 3000000 }, // Fixed max to be realistic for housing
    MULTI: { label: 'Multi-Purpose Loan', rate: 0, max: 15000, fee: 2.5 }
};

export const BARANGAYS = [
    'Balangasan', 'Balintawak', 'Banale', 'Buenavista', 'Dao', 
    'Dumagoc', 'Gatas', 'Kawit', 'Lumbia', 'Napolan', 
    'San Francisco', 'San Jose', 'San Pedro', 'Santa Lucia', 
    'Santa Maria', 'Santiago', 'Santo Niño', 'Tiguma', 'Tuburan'
];

export const ALERTS = {
    CONFIRM_DELETE: 'Are you sure you want to delete this record?',
    CONFIRM_ACTION: 'Are you sure you want to proceed?',
};

export const LOAN_STATUS_COLORS = {
    Active: 'bg-green-50 text-green-700 border-green-100',
    Pending: 'bg-yellow-50 text-yellow-700 border-yellow-100',
    Paid: 'bg-blue-50 text-blue-700 border-blue-100',
    Defaulted: 'bg-red-50 text-red-700 border-red-100',
    Rejected: 'bg-slate-50 text-slate-700 border-slate-100'
};
