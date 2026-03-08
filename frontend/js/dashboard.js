// --- Init & Auth Check ---
const user = api.getUser();
if (!user || !api.getToken()) {
    window.location.href = 'login.html';
}
document.getElementById('userInfo').innerHTML = `<strong>${user.name}</strong><br><span style="color:var(--text-muted);font-size:0.8rem">${user.email}</span>`;

// --- Global State ---
let expenses = [];
let budgets = [];
let goals = [];
let gsts = [];
let trendChartInstance = null;
let categoryChartInstance = null;
let barChartInstance = null;

const CATEGORY_KEYWORDS = {
  'Food': ['swiggy', 'zomato', 'restaurant', 'cafe', 'mcdonalds', 'kfc', 'food', 'grocery'],
  'Transport': ['uber', 'ola', 'petrol', 'train', 'flight', 'metro', 'bus', 'fuel'],
  'Shopping': ['amazon', 'flipkart', 'myntra', 'zara', 'shopping', 'mall', 'store'],
  'Bills': ['electricity', 'water', 'internet', 'broadband', 'jio', 'airtel', 'recharge', 'bill', 'rent'],
  'Health': ['hospital', 'clinic', 'pharmacy', 'apollo', 'med', 'doctor'],
  'Entertainment': ['netflix', 'prime', 'spotify', 'movie', 'cinema', 'bookmyshow', 'game'],
  'Education': ['udemy', 'coursera', 'college', 'school', 'fee', 'tuition', 'books']
};

// --- App Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initModals();
    initForms();
    
    // Set default month inputs
    const today = new Date();
    const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    document.getElementById('budgetMonth').value = currentMonthStr;
    document.getElementById('viewBudgetMonth').value = currentMonthStr;
    document.getElementById('gstDate').valueAsDate = new Date();
    
    // Auto calculate GST total
    document.getElementById('gstPurchase').addEventListener('input', updateGstTotal);
    document.getElementById('gstAmount').addEventListener('input', updateGstTotal);
    
    fetchAllData();
    
    document.getElementById('viewBudgetMonth').addEventListener('change', (e) => loadBudgets(e.target.value));
});

// --- Toast Notifications ---
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    let icon = 'check-circle';
    if(type === 'warning') icon = 'exclamation-triangle';
    if(type === 'danger') icon = 'times-circle';
    toast.innerHTML = `<i class="fa-solid fa-${icon}"></i> ${message}`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'slideInRight 0.3s ease-out reverse';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// --- Navigation ---
function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-links li');
    const tabs = document.querySelectorAll('.tab-content');
    
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            const target = link.dataset.target;
            tabs.forEach(tab => {
                tab.classList.remove('active');
                if (tab.id === target) tab.classList.add('active');
            });
            
            const titles = {
                'dashboard-tab': 'Dashboard Overview',
                'transactions-tab': 'Transaction History',
                'goals-tab': 'Financial Goals & Budgets',
                'gst-tab': 'GST Input Tracker',
                'insights-tab': 'Smart AI Insights'
            };
            document.getElementById('pageTitle').textContent = titles[target] || 'Overview';
        });
    });
    
    document.getElementById('logoutBtn').addEventListener('click', () => {
        api.clearAuth();
        window.location.href = 'index.html';
    });
}

// --- Modals & UI Bindings ---
function initModals() {
    // Expense Modal
    const expModal = document.getElementById('expenseModal');
    document.getElementById('addExpenseBtnModal').addEventListener('click', () => {
        document.getElementById('expDate').valueAsDate = new Date();
        expModal.classList.add('active');
    });
    
    // Import Modal
    const impModal = document.getElementById('importModal');
    document.getElementById('importBankBtn').addEventListener('click', () => {
        impModal.classList.add('active');
    });
    
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.target.closest('.modal-overlay').classList.remove('active');
        });
    });
    
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if(e.target === modal) modal.classList.remove('active');
        });
    });

    // Filters & Sorting for Transactions
    document.getElementById('searchInput').addEventListener('input', updateTransactionsTable);
    document.getElementById('filterCategory').addEventListener('change', updateTransactionsTable);
    document.getElementById('filterDate').addEventListener('change', updateTransactionsTable);
    document.getElementById('sortOrder').addEventListener('change', updateTransactionsTable);

    // CSV Parsing
    document.getElementById('processCsvBtn').addEventListener('click', handleCsvImport);

    // PDF Export
    document.getElementById('exportPdfBtn').addEventListener('click', () => {
        document.querySelectorAll('.actions-col, .action-btn').forEach(el => el.style.display = 'none');
        const element = document.getElementById('pdfTargetTable');
        html2pdf().from(element).save('trackwise_transactions.pdf').then(() => {
            document.querySelectorAll('.actions-col, .action-btn').forEach(el => el.style.display = '');
            showToast('PDF Exported', 'success');
        });
    });
    

    
    // Export CSV
    document.getElementById('exportCsvBtn').addEventListener('click', () => {
        if(!expenses.length) return showToast('No data to export', 'warning');
        const headers = ['Date', 'Title', 'Category', 'Amount', 'Notes'];
        const rows = expenses.map(e => [
            new Date(e.date).toLocaleDateString(),
            `"${e.title}"`,
            e.category,
            e.amount,
            `"${e.notes || ''}"`
        ]);
        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `transactions_${new Date().getTime()}.csv`;
        link.click();
        showToast('CSV Exported', 'success');
    });
}

// --- Data Fetching ---
async function fetchAllData() {
    try {
        expenses = await api.expenses.getAll();
        gsts = await api.gst.getAll();
        goals = await api.goals.getAll();
        
        updateDashboardView();
        updateTransactionsTable();
        updateGstView();
        updateGoalsProgress();
        
        generateSmartInsights();
        
        const currentMonth = document.getElementById('viewBudgetMonth').value;
        await loadBudgets(currentMonth);
    } catch (error) {
        showToast('Failed to load data', 'danger');
    }
}

async function loadBudgets(month) {
    try {
        budgets = await api.budgets.getAll(month);
        document.getElementById('currentBudgetMonthDisplay').textContent = month;
        updateBudgetProgress();
        generateSmartInsights(); // Refresh insights with updated budgets
    } catch (error) {
        console.error(error);
    }
}

// --- Health Score Math & UI ---
function updateDashboardView() {
    const today = new Date();
    
    // Aggregations
    const monthExpenses = expenses.filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
    });
    const totalMonthSpent = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
    
    // Get distinct days with expenses
    const numDays = today.getDate(); // Use current day as denominator for daily avg month-to-date
    const dailyAvg = totalMonthSpent / numDays;
    
    // Monthly average (all time)
    const monthSet = new Set(expenses.map(e => `${new Date(e.date).getFullYear()}-${new Date(e.date).getMonth()}`));
    const numMonths = Math.max(monthSet.size, 1);
    const totalAllTime = expenses.reduce((sum, e) => sum + e.amount, 0);
    const monthlyAvg = totalAllTime / numMonths;
    
    // Categories
    const categories = {};
    monthExpenses.forEach(e => {
        categories[e.category] = (categories[e.category] || 0) + e.amount;
    });
    let highestCat = '-', highestAmt = 0;
    for(const [c, a] of Object.entries(categories)) {
        if(a > highestAmt) { highestAmt = a; highestCat = c; }
    }
    const savingsEst = highestAmt * 0.15; // Simple 15% assumption of highest cat

    document.getElementById('metricMonthSpent').textContent = `₹${totalMonthSpent.toFixed(2)}`;
    document.getElementById('metricDailyAvg').textContent = `₹${dailyAvg.toFixed(2)}`;
    document.getElementById('metricMonthlyAvg').textContent = `₹${monthlyAvg.toFixed(2)}`;
    document.getElementById('metricHighestCat').textContent = highestCat !== '-' ? `${highestCat} (₹${highestAmt})` : '-';
    document.getElementById('metricSavings').textContent = `₹${savingsEst.toFixed(2)}`;
    
    // Prediction (avg of last 3 months)
    let prediction = 0;
    if(numMonths >= 3) {
        // approx
        prediction = monthlyAvg * 1.05; 
    } else {
        prediction = monthlyAvg;
    }
    
    document.getElementById('metricHealth').innerHTML = `${calcHealthScore()}<span style="font-size:0.4em; color:var(--text-muted); display:block; line-height:1; transform:translateY(-8px);">Pred: ₹${prediction.toFixed(0)}</span>`;
    
    updateCharts();
    
    // Recent Tx
    const tbody = document.getElementById('recentExpensesTableBody');
    tbody.innerHTML = '';
    expenses.slice(0, 5).forEach(e => {
        tbody.innerHTML += `
            <tr>
                <td>${new Date(e.date).toLocaleDateString()}</td>
                <td><strong>${e.title}</strong></td>
                <td><span style="padding:4px 8px; border-radius:4px; background:#e2e8f0; font-size:0.8rem;">${e.category}</span></td>
                <td style="font-weight:600;">₹${e.amount.toFixed(2)}</td>
            </tr>`;
    });
}

function calcHealthScore() {
    let score = 100;
    // Detract for high spending in 'Other' or 'Entertainment'
    const total = expenses.reduce((s, e) => s + e.amount, 0);
    if(total > 0) {
        const entAmount = expenses.filter(e => e.category === 'Entertainment').reduce((s, e) => s + e.amount, 0);
        if((entAmount / total) > 0.3) score -= 15;
    }
    // Budget adherence
    budgets.forEach(b => {
        const spent = expenses.filter(e => e.category === b.category && new Date(e.date).getMonth() === new Date().getMonth()).reduce((s, e) => s + e.amount, 0);
        if(spent > b.amount) score -= 10;
        else if (spent > (b.amount * 0.9)) score -= 5;
    });
    return Math.max(0, score);
}

// --- Transactions Table ---
function updateTransactionsTable() {
    const tbody = document.getElementById('expensesTableBody');
    const search = document.getElementById('searchInput').value.toLowerCase();
    const category = document.getElementById('filterCategory').value;
    const dateFilter = document.getElementById('filterDate').value;
    const sort = document.getElementById('sortOrder').value;
    
    const today = new Date();
    
    let filtered = expenses.filter(e => {
        if(!e.title.toLowerCase().includes(search) && (!e.notes || !e.notes.toLowerCase().includes(search))) return false;
        if(category !== 'All' && e.category !== category) return false;
        
        const d = new Date(e.date);
        if(dateFilter === 'daily' && d.toDateString() !== today.toDateString()) return false;
        if(dateFilter === 'monthly' && (d.getMonth() !== today.getMonth() || d.getFullYear() !== today.getFullYear())) return false;
        if(dateFilter === 'yearly' && d.getFullYear() !== today.getFullYear()) return false;
        return true;
    });
    
    filtered.sort((a,b) => {
        if(sort === 'latest') return new Date(b.date) - new Date(a.date);
        if(sort === 'oldest') return new Date(a.date) - new Date(b.date);
        if(sort === 'highest') return b.amount - a.amount;
        if(sort === 'lowest') return a.amount - b.amount;
    });
    
    tbody.innerHTML = '';
    filtered.forEach(e => {
        tbody.innerHTML += `
            <tr>
                <td>${new Date(e.date).toLocaleDateString()}</td>
                <td><span style="padding:4px 8px; border-radius:4px; background:#e2e8f0; font-size:0.8rem;">${e.category}</span></td>
                <td><strong>${e.title}</strong></td>
                <td style="color:var(--text-muted); font-size:0.9rem;">${e.notes || '-'}</td>
                <td style="font-weight:600;">₹${e.amount.toFixed(2)}</td>
                <td class="actions-col">
                    <button class="action-btn" onclick="deleteExpense('${e._id}')"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>`;
    });
}

window.deleteExpense = async (id) => {
    if(confirm('Delete this transaction?')) {
        try {
            await api.expenses.delete(id);
            showToast('Deleted!', 'success');
            fetchAllData();
        } catch (e) { showToast(e.message, 'danger'); }
    }
};

window.deleteGST = async (id) => {
    if(confirm('Delete this GST entry?')) {
        try {
            await api.gst.delete(id);
            showToast('Deleted!', 'success');
            fetchAllData();
        } catch (e) { showToast(e.message, 'danger'); }
    }
};

window.deleteGoal = async (id) => {
    if(confirm('Delete this Goal?')) {
        try {
            await api.goals.delete(id);
            showToast('Deleted!', 'success');
            fetchAllData();
        } catch (e) { showToast(e.message, 'danger'); }
    }
};

// --- GST Logic ---
function updateGstTotal() {
    const base = parseFloat(document.getElementById('gstPurchase').value) || 0;
    const gst = parseFloat(document.getElementById('gstAmount').value) || 0;
    document.getElementById('gstTotal').value = (base + gst).toFixed(2);
}

function updateGstView() {
    let totalPaid = 0, claimable = 0, totalPurch = 0;
    const tbody = document.getElementById('gstTableBody');
    tbody.innerHTML = '';
    
    gsts.forEach(g => {
        totalPaid += g.totalAmount;
        claimable += g.gstAmount;
        totalPurch += g.purchaseAmount;
        
        tbody.innerHTML += `
            <tr>
                <td>${new Date(g.date).toLocaleDateString()}</td>
                <td><strong>${g.vendorName}</strong></td>
                <td>₹${g.purchaseAmount.toFixed(2)}</td>
                <td style="color:var(--info);">₹${g.gstAmount.toFixed(2)}</td>
                <td style="font-weight:600;">₹${g.totalAmount.toFixed(2)}</td>
                <td><button class="action-btn" onclick="deleteGST('${g._id}')"><i class="fa-solid fa-trash"></i></button></td>
            </tr>
        `;
    });
    
    document.getElementById('gstTotalPaid').textContent = `₹${totalPaid.toFixed(2)}`;
    document.getElementById('gstClaimable').textContent = `₹${claimable.toFixed(2)}`;
    document.getElementById('gstTotalPurchases').textContent = `₹${totalPurch.toFixed(2)}`;
}

// --- Goals & Budgets ---
function updateGoalsProgress() {
    const container = document.getElementById('goalsContainer');
    container.innerHTML = '';
    if(!goals.length) {
        container.innerHTML = '<p style="color:var(--text-muted)">No goals set. Create one to start calculating timelines!</p>';
        return;
    }
    
    goals.forEach(b => {
        // Calculate estimated completion
        const monthsNeeded = Math.ceil(b.targetAmount / b.monthlySavingCapacity);
        const progressPct = 5; // Simplified visual base
        
        container.innerHTML += `
            <div class="progress-wrapper" style="margin-bottom: 2rem; border-bottom: 1px solid var(--border-color); padding-bottom:1rem;">
                <div class="progress-label" style="align-items:center;">
                    <span style="font-size:1.1rem; font-weight:700;">${b.name} <i class="fa-solid fa-trash" style="font-size:0.8rem; color:var(--text-muted); cursor:pointer; margin-left:10px;" onclick="deleteGoal('${b._id}')"></i></span>
                    <span style="font-size:0.9rem;">Target: ₹${b.targetAmount.toFixed(0)}</span>
                </div>
                <div style="font-size: 0.85rem; color:var(--text-muted); margin-bottom: 0.5rem; display:flex; justify-content:space-between;">
                    <span>Saving Capability: ₹${b.monthlySavingCapacity}/mo</span>
                    <span style="color: var(--primary-color); font-weight:bold;"><i class="fa-solid fa-clock"></i> Est. ${monthsNeeded} months to reach</span>
                </div>
                <div class="progress-bg"><div class="progress-fill" style="width: ${progressPct}%; background: var(--primary-gradient)"></div></div>
            </div>
        `;
    });
}

function updateBudgetProgress() {
    const container = document.getElementById('budgetProgressContainer');
    container.innerHTML = '';
    const currentMonth = document.getElementById('viewBudgetMonth').value;
    const [yStr, mStr] = currentMonth.split('-');
    
    const categorySpent = {};
    expenses.forEach(e => {
        const d = new Date(e.date);
        if(d.getFullYear() == yStr && d.getMonth() + 1 == mStr) {
            categorySpent[e.category] = (categorySpent[e.category] || 0) + e.amount;
        }
    });
    
    if (budgets.length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted)">No budget alerts set for this month.</p>';
        return;
    }
    
    budgets.forEach(b => {
        const spent = categorySpent[b.category] || 0;
        const percent = Math.min((spent / b.amount) * 100, 100);
        
        let colorClass = 'var(--success)';
        if(percent > 80) colorClass = 'var(--warning)';
        if(percent >= 100) colorClass = 'var(--danger)';
        
        container.innerHTML += `
            <div class="progress-wrapper">
                <div class="progress-label">
                    <span style="font-weight:600">${b.category}</span>
                    <span>₹${spent.toFixed(2)} / ₹${b.amount.toFixed(2)} (${Math.round(percent)}%)</span>
                </div>
                <div class="progress-bg"><div class="progress-fill" style="width: ${percent}%; background-color: ${colorClass}"></div></div>
            </div>
        `;
    });
}

// --- Smart Financial Insights Engine ---
function generateSmartInsights() {
    const container = document.getElementById('insightsContainer');
    container.innerHTML = '';
    
    const issues = [];
    
    const today = new Date();
    const curMonthExp = expenses.filter(e => new Date(e.date).getMonth() === today.getMonth());
    const prevMonthExp = expenses.filter(e => new Date(e.date).getMonth() === today.getMonth() - 1);
    
    // 1. Budget Alerts
    budgets.forEach(b => {
        const spent = curMonthExp.filter(e => e.category === b.category).reduce((s, e) => s + e.amount, 0);
        if (spent > b.amount) issues.push({ type: 'danger', icon: 'times-circle', text: `Budget Exceeded: You spent ₹${spent} on ${b.category} out of your ₹${b.amount} budget!` });
        else if (spent > b.amount * 0.8) issues.push({ type: 'warning', icon: 'exclamation-triangle', text: `Nearing Limit: You have consumed ${Math.round((spent/b.amount)*100)}% of your ${b.category} budget.` });
    });
    
    // 2. Trend Alert (Compare to last month)
    const curTotal = curMonthExp.reduce((s, e) => s + e.amount, 0);
    const prevTotal = prevMonthExp.reduce((s, e) => s + e.amount, 0);
    if(prevTotal > 0 && curTotal > prevTotal * 1.2) {
        issues.push({ type: 'warning', icon: 'chart-line', text: `High Spending: You have spent 20%+ more this month compared to last month.` });
    }
    
    // 3. Category Suggestion
    const categories = {};
    curMonthExp.forEach(e => categories[e.category] = (categories[e.category]||0) + e.amount);
    let topCat = '', topAmt = 0;
    for(const [c, a] of Object.entries(categories)) if(a > topAmt) { topAmt = a; topCat = c; }
    
    if(topAmt > 0) {
        const savePot = (topAmt * 0.10).toFixed(0);
        issues.push({ type: 'success', icon: 'lightbulb', text: `Smart Suggestion: Reducing your ${topCat} spending by 10% could save you ₹${savePot} monthly.` });
        
        const pct = Math.round((topAmt / curTotal) * 100);
        issues.push({ type: 'info', icon: 'info-circle', text: `Spending Habit: You spend ${pct}% of your money on ${topCat}.` });
    }
    
    if(!issues.length) {
        container.innerHTML = '<p style="color:var(--text-muted)">Not enough data to generate smart insights yet.</p>';
        return;
    }
    
    issues.forEach(i => {
        container.innerHTML += `<div class="insight-item ${i.type}"><div class="insight-icon"><i class="fa-solid fa-${i.icon}"></i></div><div>${i.text}</div></div>`;
    });
}

// --- CSV Bank Statement Import ---
function handleCsvImport() {
    const file = document.getElementById('csvFileInput').files[0];
    if(!file) return showToast('Please select a CSV file', 'danger');
    
    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async function(results) {
            const data = results.data;
            const formatted = [];
            
            for(let row of data) {
                // expecting Date, Description, Amount
                const desc = (row.Description || row.description || row.Title || '').toLowerCase();
                let amt = parseFloat(row.Amount || row.amount || 0);
                if(isNaN(amt)) continue;
                
                // Auto categorize
                let cat = 'Other';
                for(const [cName, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
                    if(keywords.some(kw => desc.includes(kw))) { cat = cName; break; }
                }
                
                // Parse date (assumes common formats, fallback to today)
                let d = row.Date ? new Date(row.Date) : new Date();
                if(isNaN(d)) d = new Date();
                
                formatted.push({ title: row.Description || 'Imported Transaction', amount: amt, category: cat, date: d });
            }
            
            if(formatted.length === 0) return showToast('Failed to parse any valid transactions', 'warning');
            
            try {
                document.getElementById('processCsvBtn').textContent = 'Uploading...';
                await api.expenses.import(formatted);
                showToast(`Successfully imported ${formatted.length} transactions!`, 'success');
                document.getElementById('importModal').classList.remove('active');
                document.getElementById('csvFileInput').value = '';
                fetchAllData();
            } catch(e) { showToast(e.message, 'danger'); }
            finally { document.getElementById('processCsvBtn').textContent = 'Parse & Import Data'; }
        }
    });
}

// --- Form Handling ---
function initForms() {
    document.getElementById('expenseForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            title: document.getElementById('expTitle').value,
            amount: parseFloat(document.getElementById('expAmount').value),
            category: document.getElementById('expCategory').value,
            date: document.getElementById('expDate').value,
            notes: document.getElementById('expNotes').value
        };
        try {
            await api.expenses.add(payload);
            document.getElementById('expenseModal').classList.remove('active');
            document.getElementById('expenseForm').reset();
            showToast('Expense successfully tracked!', 'success');
            fetchAllData();
        } catch(error) { showToast(error.message, 'danger'); }
    });
    
    document.getElementById('budgetForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await api.budgets.set({
                month: document.getElementById('budgetMonth').value,
                category: document.getElementById('budgetCategory').value,
                amount: parseFloat(document.getElementById('budgetAmount').value)
            });
            showToast('Budget Limit saved!', 'success');
            loadBudgets(document.getElementById('viewBudgetMonth').value);
            document.getElementById('budgetAmount').value = '';
        } catch(error) { showToast(error.message, 'danger'); }
    });
    
    document.getElementById('goalForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await api.goals.add({
                name: document.getElementById('goalName').value,
                targetAmount: parseFloat(document.getElementById('goalAmount').value),
                monthlySavingCapacity: parseFloat(document.getElementById('goalSaving').value)
            });
            showToast('Smart Goal Created!', 'success');
            document.getElementById('goalForm').reset();
            fetchAllData();
        } catch(error) { showToast(error.message, 'danger'); }
    });
    
    document.getElementById('gstForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await api.gst.add({
                vendorName: document.getElementById('gstVendor').value,
                purchaseAmount: parseFloat(document.getElementById('gstPurchase').value),
                gstAmount: parseFloat(document.getElementById('gstAmount').value),
                totalAmount: parseFloat(document.getElementById('gstTotal').value),
                date: document.getElementById('gstDate').value
            });
            showToast('GST Logged!', 'success');
            document.getElementById('gstForm').reset();
            document.getElementById('gstDate').valueAsDate = new Date();
            fetchAllData();
        } catch(error) { showToast(error.message, 'danger'); }
    });
}

// --- Charts Logic ---
function updateCharts() {
    Chart.defaults.font.family = "'Outfit', sans-serif";
    Chart.defaults.color = "#64748b";
    const bgColors = ['#0284c7', '#0d9488', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#38bdf8', '#64748b'];

    // 1. Category Pie Chart
    const categories = {};
    expenses.forEach(e => categories[e.category] = (categories[e.category] || 0) + e.amount);
    if(categoryChartInstance) categoryChartInstance.destroy();
    categoryChartInstance = new Chart(document.getElementById('categoryChart').getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: Object.keys(categories).length ? Object.keys(categories) : ['No Data'],
            datasets: [{ data: Object.values(categories).length ? Object.values(categories) : [1], backgroundColor: Object.values(categories).length ? bgColors : ['#e2e8f0'], borderWidth: 0 }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }
    });
    
    // 2. Trend Line Chart
    const monthsData = {};
    const monthsRaw = parseInt(document.getElementById('trendTimeRange').value);
    const today = new Date();
    for(let i = monthsRaw - 1; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        monthsData[`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`] = 0;
    }
    expenses.forEach(e => {
        const d = new Date(e.date);
        const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
        if(monthsData[k] !== undefined) monthsData[k] += e.amount;
    });

    const tLabels = Object.keys(monthsData).map(k => new Date(k.split('-')[0], parseInt(k.split('-')[1])-1, 1).toLocaleString('default', { month: 'short', year:'2-digit' }));
    const tData = Object.values(monthsData);
    
    if(trendChartInstance) trendChartInstance.destroy();
    trendChartInstance = new Chart(document.getElementById('trendChart').getContext('2d'), {
        type: 'line',
        data: {
            labels: tLabels,
            datasets: [{ label: 'Actual Spending', data: tData, borderColor: '#0284c7', backgroundColor: 'rgba(2, 132, 199, 0.15)', tension: 0.4, fill: true }]
        },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
    });

    // 3. Monthly Comparison Bar Chart
    const curCatData = {}, prevCatData = {};
    Object.keys(categories).forEach(c => { curCatData[c] = 0; prevCatData[c] = 0; });
    
    expenses.forEach(e => {
        const d = new Date(e.date);
        if(d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear()) curCatData[e.category] += e.amount;
        else if (d.getMonth() === today.getMonth()-1) prevCatData[e.category] += e.amount;
    });

    const compCats = Object.keys(categories).slice(0, 5);
    if(barChartInstance) barChartInstance.destroy();
    barChartInstance = new Chart(document.getElementById('barChart').getContext('2d'), {
        type: 'bar',
        data: {
            labels: compCats.length ? compCats : ['None'],
            datasets: [
                { label: 'This Month', data: compCats.length ? compCats.map(c=>curCatData[c]) : [0], backgroundColor: '#0d9488', borderRadius: 6 },
                { label: 'Last Month', data: compCats.length ? compCats.map(c=>prevCatData[c]) : [0], backgroundColor: '#e2e8f0', borderRadius: 6 }
            ]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}
document.getElementById('trendTimeRange').addEventListener('change', updateCharts);
