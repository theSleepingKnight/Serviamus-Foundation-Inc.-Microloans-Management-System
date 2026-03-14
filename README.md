# Serviamus-Foundation-Inc.-Microloans-Management-System

A high-fidelity, comprehensive Customer and Loans Management System designed for microfinance institutions. Built with modern web technologies to ensure performance, responsiveness, and a premium "paper-lite" user experience.

## 🚀 Key Features

### 1. **Executive Dashboard**
   - **Real-Time KPI Tracking**: Instant visibility of Projected Revenue, Outstanding Debt, and Growth Metrics.
   - **Dynamic Data Visualization**:
     - **Revenue Trends**: Historical performance tracking via interactive area charts.
     - **Portfolio Health**: Visual breakdown of loan statuses (Active, Pending, Paid, Defaulted).
     - **Loan Distribution**: Categorical analysis of loan types.
   - **Temporal Filtering**: Switch between Weekly, Monthly, Yearly, and All-Time views to analyze trends.

### 2. **Structured Group Management**
   - **Geographic Organization**: Loans are organized by **Barangays** and specific **Groups**.
   - **Officer Assignment**: Dedicated Loan Officers assigned to specific groups for better accountability.
   - **Smart Archiving**: Custom workflow to "Archive" completed loan groups, ghosting them from active lists while preserving historical data.
   - **Status Badging**: Visual indicators for Active, Pending, and Archived groups to prevent operational confusion.

### 3. **Sophisticated Loan Origination**
   - **Multi-Product Support**:
     - **Regular Loans**: 3% Monthly interest rate.
     - **Housing Loans**: 2% Monthly interest rate.
     - **Multi-Purpose Loans (MPL)**: 0% interest with a **2.5% upfront processing fee** deduction.
   - **Automated Calculations**: Instant generation of net proceeds, processing fees, and weekly amortization schedules.
   - **Approval Workflow**: Dual-stage verification for pending applications.

### 4. **Enhanced Customer Management**
   - **Summary Intelligence**: Dash-header featuring Total Members, Active Accounts, Total CBU (Capital Build-Up), and Total SD (Savings Deposit) stats.
   - **Barangay Filtering**: Optimized search functionality with geographic filtering.
   - **Full Profile View**: Detailed customer dossiers including financial standing, family/work references, and historical loan links.
   - **Transfer Logic**: Ability to relocate customers between barangays and groups, automatically updating associated loan officers.

### 5. **Collection Desk (Payments)**
   - **Dual Collection Modes**:
     - **Individual**: Precision processing for specific member payments.
     - **Group Batch**: High-efficiency "Payment Sheet" for processing entire group collections in a single workflow.
   - **Daily Metrics**: Tracking of today's total collections and receipts issued.
   - **Payment History**: Immutable ledgers for every loan, tracking payment dates and processing staff.

### 6. **System Configuration**
   - **Dynamic Parameters**: Real-time updating of system fees (CBU, Savings, Penalties, and Insurances) via the Administrative Settings.

## 🛠 Tech Stack

- **Core**: React 18 (Vite)
- **Styling**: Vanilla CSS + Tailwind CSS (Custom Design System with Glassmorphism)
- **Icons**: Lucide React
- **Charts**: Recharts
- **State Management**: React Context API (Centralized Business Logic)

## 📦 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)

### Installation

1. **Clone & Navigate**
   ```bash
   git clone <repository-url>
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
