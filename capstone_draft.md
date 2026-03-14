# Capstone Project Documentation: Serviamus Microloans Management System

**Project Title:** Serviamus Foundation Inc. - Advanced Microloans Management System  
**Objective:** Transitioning from Manual Ledger and Spreadsheet Dependency to a "Paper-Lite" Digital Ecosystem.

---

## 1. Executive Summary
The Serviamus Microloans Management System is a state-of-the-art digital solution designed to modernize the operations of microfinance institutions. For years, the foundation has relied on manual ledger entries and fragmented spreadsheet tracking, which often leads to data silos and slow operational turnaround. This system introduces a centralized, high-fidelity platform that prioritizes accountability, data integrity, and user efficiency.

---

## 2. System Objectives
- **Efficiency**: Reduction of manual data entry time by over 60% through batch processing.
- **Accuracy**: Automated interest and penalty calculations to eliminate human error.
- **Transparency**: Real-time auditing via immutable transaction ledgers.
- **Scalability**: A structured data model capable of handling multiple barangays and thousands of members.

---

## 3. Core Modules & Features

### 3.1 Executive Dashboard
The cockpit of the system. It provides high-level metrics for management to monitor the health of the lending portfolio.
- **Key Cards**: Projected Revenue, Outstanding Debt, and Growth Trends.
- **Visual Analytics**: Interactive charts showing loan status distribution and revenue over time.

### 3.2 Customer Management
A robust database for maintaining "Know Your Customer" (KYC) compliance.
- **Summary Header**: Real-time counts of members and total savings (CBU/SD).
- **Pro-Profile View**: A comprehensive digital dossier for every member, replacing paper folders.

### 3.3 Loan & Group Management
The core business engine.
- **Group Hierarchy**: Organizing members by geography (Barangay) and group for easier collection.
- **Smart Archiving**: A unique feature to keep the workspace clean by "ghosting" completed groups while maintaining records for auditing.

### 3.4 Collection Desk (Payments)
The primary operational touchpoint for cashiers.
- **Individual Mode**: For walk-in repayments.
- **Batch Mode**: A revolutionary spreadsheet-style interface that allows a cashier to process 5-10 group members in seconds.

---

## 4. Procedures Manual (User Guide)

### 4.1 Navigating the Dashboard
Upon login, users are greeted by the Analytics Overview.
1. Observe the **Global KPI cards** for instant business health checks.
2. Use the **Time Filter** (Weekly/Monthly) to see performance trends.
3. Check the **Recent Activity** feed to see recent registrations or payments.

### 4.2 Managing Customer Profiles
1. Go to the **Customers** tab.
2. Use the **Barangay Filter** to narrow down your search.
3. Click **View Profile** on any customer to see their financial history and contact references.
4. To update information, click **Edit Basic Info** within the profile view.

### 4.3 Handling Loan Groups
1. Navigate to the **Loans** tab to see all active groups and their assigned officers.
2. For groups that have fully paid their cycles, click **Archive Group**. This preserves the data but mutes the UI for those members.
3. Groups can be **Restored** at any time if a new cycle is needed.

### 4.4 Processing Group Collections
1. Go to the **Payments** tab.
2. Toggle to **Group Batch** mode.
3. Select the group being collected.
4. Enter the amounts collected from each member in the **Digital Ledger**.
5. Click **Confirm Batch** to update all member balances and generate internal receipts.

---

## 5. Technical Specifications
- **Frontend**: React 18 with Vite for lightning-fast responsiveness.
- **Design**: Specialized Tailwind CSS theme utilizing glassmorphism and modern typography.
- **State Engine**: Centralized React Context API for consistent data flow across all modules.
- **Architecture**: Modular component-based design allowing for future feature expansion.
