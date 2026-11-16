require("dotenv").config();
const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const rateLimit = require("express-rate-limit");

const { MONGODB_URI, JWT_SECRET, PORT = 3000 } = process.env;
if (!MONGODB_URI || !JWT_SECRET) {
  console.error("Missing MONGODB_URI or JWT_SECRET. Copy .env.example to .env and fill it in.");
  process.exit(1);
}

const app = express();
app.use(express.json({ limit: "20kb" }));
app.use(express.static(path.join(__dirname, "public")));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: "Too many attempts. Please try again later." },
});

app.use("/api/auth", authLimiter, require("./routes/auth"));
app.use("/api/tasks", require("./routes/tasks"));

app.use("/api", (req, res) => res.status(404).json({ error: "Not found." }));

// Catch any unexpected error
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong." });
});

mongoose
  .connect(MONGODB_URI)
  .then(() => app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`)))
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  });
