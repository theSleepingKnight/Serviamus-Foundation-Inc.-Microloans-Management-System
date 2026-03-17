# Serviamus-Foundation-Inc.-Microloans-Management-System

A high-fidelity, comprehensive Customer and Loans Management System designed for microfinance institutions. Built with modern web technologies to ensure performance, responsiveness, and a premium "paper-lite" user experience.

## 🚀 Key Features

### 1. **Role-Based Access Control (RBAC)**
   - **Admin**: Full system control, including fee settings, staff management, and all financial overrides.
   - **Loan Officer**: Geographic-focused access. Can manage members, create loans, and approve applications within their assigned **Barangays**.
   - **Cashier**: Specialized **Collection Dashboard** view. Handles payment processing and fund disbursements without access to member data modification.

### 2. **Verified Disbursement Workflow**
   - **Modern Lifecycle**: Moves from `Pending` → `Approved` (Officer/Admin) → `Active` (Cashier Disbursed).
   - **Late-Start Interest**: The repayment schedule and interest calculation only begin the moment the Cashier marks the loan as "Disbursed" and releases the funds.
   - **Pending Releases Monitor**: A dedicated queue for Cashiers to see exactly which loans are ready for cash release.

### 3. **Smart Overdue & Delinquency Monitoring**
   - **Overdue Monitor**: A specialized tab identifying loans with no payments for >7 days.
   - **Transaction Review**: Quick-access modals to review a delinquent member's full payment history directly from the monitor.
   - **Visual Warnings**: Individual members are highlighted in **Red/Orange** with "DELINQUENT" warnings in group lists to support joint-liability models.

### 4. **Executive & Collection Dashboards**
   - **Executive (Admin/Officer)**: Real-time KPI tracking of Projected Revenue, Outstanding Debt, and Growth Metrics.
   - **Collection (Cashier)**: Tactical view of Today's Total Collections, Count of Payments, and Pending Disbursements.

### 5. **Structured Group Management**
   - **Geographic Organization**: Loans are organized by **Barangays** and specific **Groups**.
   - **Officer Capacity**: Visual indicators of how many slots are remaining in a group (e.g., 4/5 slots used).

### 6. **Collection Desk (Payments)**
   - **Batch Processing**: High-efficiency "Payment Sheet" for processing entire group collections in a single workflow.
   - **Individual Tracking**: Precision processing for specific member payments and immediate receipt generation.

## 📖 Quick Start Guide

### For Loan Officers
1. **Register Member**: Go to the **Customers** tab and click "Register New Customer".
2. **Create Loan**: Once registered, go to **Loans**, click "New Loan", and assign them to a Group in your Barangay.
3. **Approval**: After verification, mark the application as **Approved**. It will now move to the Cashier's queue.

### For Cashiers
1. **Disbursement**: Go to **Payments**. Look at the "Pending Disbursements" section. Click "Disburse Funds" when the borrower is ready.
2. **Payment**: Select a member or group, enter the amount, and click "Process Payment". The system updates the remaining balance instantly.

### For Admins
1. **System Health**: Monitor the **Dashboard** for overall growth trends.
2. **Settings**: Use the gear icon in the **Loans** tab to adjust CBU, Savings, or Admin fee percentages.

## 🛠 Tech Stack

- **Core**: React 18 (Vite)
- **Styling**: Vanilla CSS + Tailwind CSS (Custom Design System)
- **Icons**: Lucide React
- **Charts**: Recharts
- **State Management**: React Context API

## 📦 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)

### Installation

1. **Clone & Navigate**
   ```bash
   git clone https://github.com/theSleepingKnight/Serviamus-Foundation-Inc.-Microloans-Management-System.git
   cd microloan-servicing
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Launch Development Server**
   ```bash
   npm run dev
   ```

---
*Created for the Moncada Microloan Servicing Project*
