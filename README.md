# Smart Expense Tracker

A modern, full-stack web application designed for financial awareness. This application helps users track their daily expenses and understand their spending habits with a clean, professional "hackathon-winning" dashboard UI.

## Features
- **Add Expenses:** Log new transactions with a title, amount, category, and date.
- **Categorization:** Predefined categories (Food, Travel, Shopping, Bills, Other).
- **Dashboard Overview:** See total expenses calculated in real-time.
- **Visual Insights:** A responsive, interactive Chart.js doughnut chart depicting spending by category.
- **Modern UI:** Responsive, CSS-grid/flexbox layout featuring a polished dark/light aesthetic using Inter font and FontAwesome icons.

## Prerequisites

Before running this project, you will need:
- **Node.js** and **npm** installed on your system.
- **MongoDB** running locally. (Usually on `mongodb://127.0.0.1:27017/`)

## How to Run Locally

### 1. Start the Backend Server
First, open a terminal window and navigate to the backend directory.

```bash
cd backend

# Install dependencies
npm install

# Start the server (runs on port 5000 by default)
npm start
```
*Note: Make sure your local MongoDB service is running in the background before starting the server.*

### 2. View the Frontend Dashboard
Since the frontend uses vanilla HTML/CSS/JS, you can easily serve it using a lightweight static server (e.g., Live Server extension in VS Code) or simply open the file.

```bash
cd frontend

# If you have 'npx' available, you can use serve to host the static files:
npx serve .
```

Alternatively, you could just open the `index.html` file directly in your browser.

- Double-click `frontend/index.html` via your file explorer.

### 3. Usage
1. Open the dashboard in your web browser.
2. Under "Add New Expense", fill out the form details.
3. Click **Add Expense**.
4. The transaction will immediately populate in the "Recent Transactions" table.
5. Watch the **Total Expenses** and **Spending by Category** chart update automatically in real-time.
