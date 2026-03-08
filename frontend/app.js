const API_URL = 'http://localhost:5000/api/expenses';

// DOM Elements
const expenseForm = document.getElementById('expense-form');
const expenseList = document.getElementById('expense-list');
const totalAmountEl = document.getElementById('total-amount');
const submitBtn = document.getElementById('submit-btn');
const toastEl = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');
const categoryChartCtx = document.getElementById('categoryChart');
const noDataMsg = document.getElementById('no-data-msg');

let categoryChartInstance = null;
let expensesData = [];

// Format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

// Format Date
const formatDate = (dateString) => {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
};

// Map Categories to Icons
const getCategoryIcon = (category) => {
  const icons = {
    'Food': 'fa-utensils',
    'Travel': 'fa-plane',
    'Shopping': 'fa-cart-shopping',
    'Bills': 'fa-file-invoice-dollar',
    'Other': 'fa-ellipsis-h'
  };
  return icons[category] || icons['Other'];
};

// Show Toast
const showToast = (message, isError = false) => {
  toastMessage.textContent = message;
  toastEl.style.borderLeftColor = isError ? 'var(--danger-color)' : 'var(--success-color)';
  const icon = toastEl.querySelector('i');
  icon.className = isError ? 'fa-solid fa-circle-exclamation' : 'fa-solid fa-circle-check';
  icon.style.color = isError ? 'var(--danger-color)' : 'var(--success-color)';
  
  toastEl.classList.remove('hidden');
  toastEl.classList.add('show');
  
  setTimeout(() => {
    toastEl.classList.remove('show');
  }, 3000);
};

// Fetch all expenses from backend
const fetchExpenses = async () => {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error('Failed to fetch expenses');
    
    expensesData = await response.json();
    updateDashboard();
  } catch (error) {
    console.error('Error fetching data:', error);
    expenseList.innerHTML = `<tr><td colspan="4" class="text-center loading-text">Failed to load expenses. Is the server running?</td></tr>`;
  }
};

// Add new expense
expenseForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const title = document.getElementById('title').value;
  const amount = document.getElementById('amount').value;
  const category = document.getElementById('category').value;
  const dateStr = document.getElementById('date').value;
  
  if (!title || !amount || !category) return;
  
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Adding...';
  
  try {
    const expenseData = { title, amount: Number(amount), category, date: dateStr || undefined };
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(expenseData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error saving expense');
    }
    
    const newExpense = await response.json();
    expensesData.unshift(newExpense); // Add to beginning
    
    // Reset form
    expenseForm.reset();
    
    // Update dashboard
    updateDashboard();
    showToast('Expense added successfully!');
    
  } catch (error) {
    console.error(error);
    showToast(error.message, true);
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<span>Add Expense</span><i class="fa-solid fa-plus"></i>';
  }
});

// Update the full dashboard (Total, List, Chart)
const updateDashboard = () => {
  updateTotalAmount();
  renderExpenseList();
  renderChart();
};

const updateTotalAmount = () => {
  const total = expensesData.reduce((acc, expense) => acc + expense.amount, 0);
  totalAmountEl.textContent = formatCurrency(total);
};

const renderExpenseList = () => {
  expenseList.innerHTML = '';
  
  if (expensesData.length === 0) {
    expenseList.innerHTML = `<tr><td colspan="4" class="text-center loading-text">No expenses found. Add your first expense above!</td></tr>`;
    return;
  }
  
  // Show only top 5 recent for dashboard view
  const displayExpenses = expensesData.slice(0, 5);
  
  displayExpenses.forEach(expense => {
    const tr = document.createElement('tr');
    
    // Map category to enum used in CSS for color
    const catClass = `cat-${expense.category.replace('&', '').replace(' ', '')}`;
    
    tr.innerHTML = `
      <td>
        <div class="expense-item-wrapper">
          <div class="expense-icon ${catClass}">
            <i class="fa-solid ${getCategoryIcon(expense.category)}"></i>
          </div>
          <span class="expense-title">${expense.title}</span>
        </div>
      </td>
      <td><span class="category-badge ${catClass}">${expense.category}</span></td>
      <td>${formatDate(expense.date)}</td>
      <td class="expense-amount">${formatCurrency(expense.amount)}</td>
    `;
    
    expenseList.appendChild(tr);
  });
};

const renderChart = () => {
  if (expensesData.length === 0) {
    categoryChartCtx.style.display = 'none';
    noDataMsg.classList.remove('hidden');
    return;
  }
  
  categoryChartCtx.style.display = 'block';
  noDataMsg.classList.add('hidden');
  
  // Aggregate data by category
  const categoryTotals = expensesData.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {});
  
  const labels = Object.keys(categoryTotals);
  const data = Object.values(categoryTotals);
  
  const backgroundColors = labels.map(label => {
    switch(label) {
      case 'Food': return '#f87171'; // Red
      case 'Travel': return '#38bdf8'; // Blue
      case 'Shopping': return '#c084fc'; // Purple
      case 'Bills': return '#fbbf24'; // Yellow
      case 'Other': return '#94a3b8'; // Grey
      default: return '#4A90E2';
    }
  });

  if (categoryChartInstance) {
    categoryChartInstance.destroy(); // Destroy previous chart to redraw
  }

  categoryChartInstance = new Chart(categoryChartCtx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: backgroundColors,
        borderWidth: 0,
        hoverOffset: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '70%',
      plugins: {
        legend: {
          position: 'right',
          labels: {
            usePointStyle: true,
            padding: 20,
            font: {
              family: "'Inter', sans-serif"
            }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              let label = context.label || '';
              if (label) {
                label += ': ';
              }
              if (context.parsed !== null) {
                label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(context.parsed);
              }
              return label;
            }
          }
        }
      }
    }
  });
};

// Set default date input to today
document.getElementById('date').valueAsDate = new Date();

// Init
fetchExpenses();
