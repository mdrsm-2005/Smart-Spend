const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

/* ---------------- Middleware ---------------- */
app.use(cors());
app.use(express.json());

/* ---------------- PORT ---------------- */
const PORT = process.env.PORT || 5000;

/* ---------------- Test Route ---------------- */
app.get("/", (req, res) => {
  res.send("Smart Expense Tracker API Running");
});

/* ---------------- Routes ---------------- */
app.use("/api/auth", require("./routes/auth"));
app.use("/api/expenses", require("./routes/expenses"));
app.use("/api/budgets", require("./routes/budgets"));
app.use("/api/insights", require("./routes/insights"));
app.use("/api/goals", require("./routes/goals"));
app.use("/api/gst", require("./routes/gst"));

/* ---------------- Global Error Handler ---------------- */
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err);
  // Send JSON response instead of HTML for all errors
  res.status(err.status || 500).json({
    message: err.message || "An unexpected error occurred on the server",
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

/* ---------------- MongoDB Connection ---------------- */
mongoose
  .connect("mongodb://127.0.0.1:27017/smart-expense-tracker")
  .then(() => {
    console.log("Successfully connected to MongoDB");

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
  });