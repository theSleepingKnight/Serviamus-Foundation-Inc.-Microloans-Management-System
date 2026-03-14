# Serviamus-Foundation-Inc.-Microloans-Management-System

A high-fidelity, comprehensive Customer and Loans Management System designed for microfinance institutions. Built with modern web technologies to ensure performance, responsiveness, and a premium user experience.

## 🚀 Features

### 1. **Interactive Dashboard**
   - **Real-Time Metrics**: View Projected Revenue, Outstanding Debt, New Customers, and Active Loans at a glance.
   - **Data Visualization**:
     - **Revenue Trends**: Area charts showing financial performance over time.
     - **Loan Distribution**: Pie charts for loan status (Active, Pending, Paid, Defaulted).
     - **Portfolio Analysis**: Bar charts breaking down loan volume by type.
   - **Time Filtering**: Filter data by Weekly, Monthly, Yearly, or Overall views.

### 2. **Advanced Loan Management**
   - **Flexible Loan Creation**: Support for various loan types with distinct business logic:
     - **Regular Loans**: Standard interest-bearing loans (3% Monthly rate).
     - **Housing Loans**: Lower interest rate (2% Monthly) for housing improvements.
     - **Multi-Purpose Loans**: Special 0% interest loans with a **2.5% upfront processing fee** deducted from net proceeds.
   - **Weekly Terms**: All loan terms are distinctively handled in **weeks** for precise microfinance tracking.
   - **Amortization Schedules**: Automatic generation of weekly repayment schedules showing Principal, Interest, and Remaining Balance.
   - **Approval Workflow**: Secure workflow for reviewing and activating 'Pending' loan applications.

### 3. **Customer Management**
   - **Profiles**: Comprehensive customer details including contact info and status.
   - **Search & Filter**: Quickly find customers name or ID.
   - **Status Control**: Toggle customer accounts between Active and Disabled states.

### 4. **Role-Based Access Control (RBAC)**
   - **Admin**: Full system access (Staff management, System config).
   - **Loan Officer**: Focused on Customer onboarding and Loan origination/approval.
   - **Cashier**: Restricted to Payment processing and basic customer views.

## 🛠 Tech Stack

- **Core**: React 18 (Vite)
- **Styling**: Tailwind CSS (Custom Design System)
- **Icons**: Lucide React
- **Charts**: Recharts
- **State Management**: React Context API & Hooks

## 📦 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm (v8 or higher)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd microloan-servicing
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```

### Default Credentials
Use the following credentials to test different user roles:

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@test.com | password |
| **Loan Officer** | officer@test.com | password |
| **Cashier** | cashier@test.com | password |

## 📂 Project Structure

```
src/
├── components/       # Functional UI components
│   ├── ui/           # Reusable UI elements (Toast, Cards, etc.)
│   ├── Dashboard.jsx # Main analytics view
│   ├── Loans.jsx     # Loan application & management logic
│   ├── Customers.jsx # Customer database interface
│   └── ...
├── context/
│   └── AppContext.jsx # Global state (Auth, Data Store)
├── utils/
│   └── constants.js   # Configuration (Loan Types, Colors, etc.)
├── App.jsx           # Main Routing & Layout
└── index.css         # Tailwind directives & Custom styles
```

## 📝 Usage Notes

- **Volatile Storage**: This prototype uses in-memory storage (Context API). Data will reset upon page refresh.
- **Loan Logic**: 
  - *Multi-Purpose Loans* calculate the 2.5% deduction automatically.
  - *Interest Rates* are applied based on the term in weeks.

---
*Generated for GitHub Documentation*
