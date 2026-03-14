import * as XLSX from 'xlsx-js-style';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Exports loan data to a professionally formatted Excel spreadsheet.
 * @param {Array} loans - Array of loan objects
 * @param {Array} customers - Array of customer objects
 * @param {Array} groups - Array of loan group objects
 * @param {Array} staff - Array of staff/officer objects
 * @param {string} filename - Desired filename
 */
export const exportLoansToExcel = (loans, customers, groups, staff, filename = 'Serviamus_Loans_Report.xlsx') => {
    // Helper to get names
    const getCustomer = (id) => customers.find(c => c.id === id);
    const getGroup = (id) => groups.find(g => g.id === id);
    const getOfficer = (id) => staff.find(s => s.id === id);

    // 1. Format Active Loans
    const activeLoans = loans.filter(l => l.status === 'Active').map(l => {
        const c = getCustomer(l.customerId);
        const g = getGroup(l.groupId);
        const o = getOfficer(l.officerId);
        return {
            'Loan ID': l.id,
            'Customer Name': c?.name || 'Unknown',
            'Barangay': c?.barangay || 'N/A',
            'Group/Cluster': g?.name || 'Individual',
            'Loan Type': l.loanType,
            'Principal Amount': l.amount,
            'Interest Rate %': l.interestRate,
            'Remaining Balance': l.remainingBalance,
            'Loan Tenor (Weeks)': l.term,
            'Start Date': l.startDate,
            'Loan Officer': o?.name || 'N/A',
            'Status': l.status
        };
    });

    // 2. Format All Loans (History)
    const historyLoans = loans.map(l => {
        const c = getCustomer(l.customerId);
        const g = getGroup(l.groupId);
        const o = getOfficer(l.officerId);
        return {
            'Loan ID': l.id,
            'Customer Name': c?.name || 'Unknown',
            'Barangay': c?.barangay || 'N/A',
            'Group/Cluster': g?.name || 'Individual',
            'Loan Type': l.loanType,
            'Original Amount': l.amount,
            'Current Balance': l.remainingBalance,
            'Start Date': l.startDate,
            'Officer': o?.name || 'N/A',
            'Status': l.status
        };
    });

    // 3. Summary Sheet
    const totalDisbursed = loans.reduce((sum, l) => sum + l.amount, 0);
    const totalOutstanding = loans.reduce((sum, l) => sum + l.remainingBalance, 0);
    const summaryData = [
        { 'Metric': 'Total Loans Issued', 'Value': loans.length },
        { 'Metric': 'Total Disbursed Amount', 'Value': `PHP ${totalDisbursed.toLocaleString()}` },
        { 'Metric': 'Total Outstanding Balance', 'Value': `PHP ${totalOutstanding.toLocaleString()}` },
        { 'Metric': 'Active Accounts', 'Value': activeLoans.length },
        { 'Metric': 'Report Date', 'Value': new Date().toLocaleDateString() }
    ];

    // Create workbook and add sheets
    const wb = XLSX.utils.book_new();

    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, "Dashboard Summary");

    const wsActive = XLSX.utils.json_to_sheet(activeLoans);
    XLSX.utils.book_append_sheet(wb, wsActive, "Active Loans");

    const wsHistory = XLSX.utils.json_to_sheet(historyLoans);
    XLSX.utils.book_append_sheet(wb, wsHistory, "Complete History");

    // Standardize column widths (roughly)
    const wscols = [
        { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 20 }, { wch: 15 },
        { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 18 }, { wch: 15 }
    ];
    wsActive['!cols'] = wscols;
    wsHistory['!cols'] = wscols;

    // Save File
    XLSX.writeFile(wb, filename);
};

export const exportCollectionSheet = (data, filename = 'Collection_Sheet.xlsx') => {
    const { loans, customers, groups, settings, centerName, generatedBy } = data;
    const wb = XLSX.utils.book_new();

    const ws_data = [
        [], // Row 1
        ["", "SERVIAMU FOUNDATION INC.", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "DATE:", new Date().toLocaleDateString()],
        ["", "PAGADIAN CITY", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "CENTER NAME:", centerName || "Various"],
        ["", "COLLECTION SHEET", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "COLLECTION DATE:", ""],
        [], // Row 5
        ["", "NAME OF BORROWER", "LOAN", "RELEASE", "LOAN BALANCE", "", "MAT.", "LOANS", "", "", "", "", "PENDING", "", "CBU", "", "", "AF", "", "", "SD", "", "", "TOTAL", "ACTUAL", "SIGN"],
        ["", "", "AMOUNT", "DATE", "PRINCIPAL", "ADMIN/INT", "DATE", "DUE", "ARREARS", "ACTUAL", "DUE", "DUE", "BAL", "DEPOSIT", "BAL", "DEPOSIT", "BAL", "DEPOSIT", "BAL", "DEPOSIT", "AMOUNT DUE", "PAY", ""],
        [] // Row 8 - Spacing
    ];

    let currentRow = 8;
    let grandTotalPrincipal = 0;

    groups.forEach(group => {
        // Group Header
        const groupRow = new Array(30).fill("");
        groupRow[1] = group.name;
        ws_data.push(groupRow);
        currentRow++;

        let groupTotalPrincipal = 0;

        // Members
        for (let i = 0; i < 5; i++) {
            const loanId = group.loanIds[i];
            const loan = loanId ? loans.find(l => l.id === loanId && l.status === 'Active') : null;
            const customer = loan ? customers.find(c => c.id === loan.customerId) : null;
            const memberRow = new Array(30).fill("");

            memberRow[0] = (i + 1).toString();

            if (loan && customer) {
                const adminFee = loan.amount * ((settings?.adminFeePercent || 0) / 100);
                const weeklyDue = (loan.amount * (1 + (loan.interestRate / 100))) / (loan.term || 1);

                // Arrears logic: if date > startDate + term weeks
                const start = new Date(loan.startDate);
                const now = new Date();
                const diffTime = Math.abs(now - start);
                const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
                const arrears = diffWeeks > loan.term ? loan.remainingBalance : 0;

                memberRow[1] = customer.name;
                memberRow[2] = loan.amount;
                memberRow[3] = loan.startDate;
                memberRow[4] = loan.remainingBalance;
                memberRow[5] = Math.round(adminFee);
                memberRow[7] = loan.endDate || 'N/A';
                memberRow[8] = Math.round(weeklyDue);
                memberRow[9] = arrears;
                memberRow[23] = Math.round(weeklyDue + arrears); // Total Amount Due

                groupTotalPrincipal += loan.amount;
                grandTotalPrincipal += loan.amount;
            }
            ws_data.push(memberRow);
            currentRow++;
        }

        const totalRow = new Array(30).fill("");
        totalRow[1] = "GROUP TOTAL";
        totalRow[2] = groupTotalPrincipal;
        ws_data.push(totalRow);
        ws_data.push([]); // Padding
        currentRow += 2;
    });

    // Grand Totals
    ws_data.push([]);
    ws_data.push(["", "GRAND TOTAL", grandTotalPrincipal]);

    // Footer
    ws_data.push([]);
    ws_data.push([]);
    ws_data.push(["", "REMITTED BY:", "", "", "OR NO:", "", "", "BANK DEP:", "", "", "", "CHECKED BY:", "", "", "CHECKED & POSTED BY:", "", "", "RECEIVED BY:"]);
    ws_data.push(["", generatedBy || "____________________", "", "", "____________", "", "", "____________", "", "", "", "____________________", "", "", "____________________", "", "", "____________________"]);

    const ws = XLSX.utils.aoa_to_sheet(ws_data);

    // Visual Merges
    ws['!merges'] = [
        { s: { r: 1, c: 1 }, e: { r: 1, c: 10 } },
        { s: { r: 2, c: 1 }, e: { r: 2, c: 10 } },
        { s: { r: 3, c: 1 }, e: { r: 3, c: 10 } },
        { s: { r: 1, c: 25 }, e: { r: 1, c: 27 } },
        { s: { r: 2, c: 25 }, e: { r: 2, c: 27 } },
        { s: { r: 3, c: 25 }, e: { r: 3, c: 27 } },
        // Header merges
        { s: { r: 5, c: 1 }, e: { r: 6, c: 1 } }, // Borrower
        { s: { r: 5, c: 4 }, e: { r: 5, c: 5 } }, // Balance
        { s: { r: 5, c: 8 }, e: { r: 5, c: 12 } }, // LOANS section
    ];

    ws['!cols'] = [
        { wch: 4 }, { wch: 30 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 10 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Collection Sheet");
    XLSX.writeFile(wb, filename);
};

export const exportGroupReportPDF = (group, loans, customers, staff, filename = '') => {
    const doc = new jsPDF();
    const groupLoans = loans.filter(l => l.groupId === group.id);
    const officer = staff.find(s => s.id === group.officerId);
    const timestamp = new Date().toLocaleString();
    
    // 1. Branding Header
    doc.setFillColor(15, 23, 42); // slate-950
    doc.rect(0, 0, 210, 45, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('SERVIAMUS FOUNDATION INC.', 20, 22);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Microloan Management System • Official Group Portfolio', 20, 32);
    doc.text(`Generated: ${timestamp}`, 140, 32);

    // 2. Group Context Info
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(`CLUSTER: ${group.name}`, 20, 60);
    
    doc.setFontSize(10);
    doc.text(`BARANGAY: ${group.barangay}`, 20, 68);
    doc.text(`LOAN OFFICER: ${officer?.name || 'N/A'}`, 20, 74);
    doc.text(`TOTAL MEMBERS: ${groupLoans.length}`, 140, 68);
    doc.text(`STATUS: ${group.status}`, 140, 74);

    // Dotted line separator
    doc.setDrawColor(226, 232, 240);
    doc.setLineDash([1, 1], 0);
    doc.line(20, 82, 190, 82);

    // 3. Member Table
    const tableData = groupLoans.map((loan, idx) => {
        const customer = customers.find(c => c.id === loan.customerId);
        return [
            (idx + 1).toString(),
            customer?.name || 'N/A',
            loan.loanType,
            `PHP ${loan.amount.toLocaleString()}`,
            loan.startDate,
            loan.status
        ];
    });

    autoTable(doc, {
        startY: 90,
        head: [['#', 'BORROWER NAME', 'TYPE', 'PRINCIPAL', 'RELEASE DATE', 'STATUS']],
        body: tableData,
        theme: 'striped',
        headStyles: { 
            fillColor: [79, 70, 229], // indigo-600
            textColor: [255, 255, 255],
            fontSize: 10,
            fontStyle: 'bold'
        },
        bodyStyles: { fontSize: 9 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 20, right: 20 }
    });

    // 4. Signatures Placeholder
    const finalY = doc.lastAutoTable.finalY + 30;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('__________________________', 20, finalY);
    doc.text('Prepared By (Officer)', 20, finalY + 6);
    
    doc.text('__________________________', 130, finalY);
    doc.text('Approved By (Manager)', 130, finalY + 6);

    const fName = filename || `Report_${group.name.replace(/\s+/g, '_')}.pdf`;
    doc.save(fName);
};
