const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const auth = require("../middleware/auth");

const router = express.Router();
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function sign(user) {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
}
function publicUser(user) {
  return { id: user._id, name: user.name, email: user.email };
}

router.post("/register", async (req, res) => {
  const { name, email, password } = req.body || {};
  if (![name, email, password].every((v) => typeof v === "string" && v.trim())) {
    return res.status(400).json({ error: "Name, email and password are required." });
  }
  if (!emailPattern.test(email.trim())) {
    return res.status(400).json({ error: "Please enter a valid email address." });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters." });
  }
  try {
    const exists = await User.findOne({ email: email.trim().toLowerCase() });
    if (exists) return res.status(409).json({ error: "An account with this email already exists." });
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hash });
    res.status(201).json({ token: sign(user), user: publicUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not create your account." });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (typeof email !== "string" || typeof password !== "string") {
    return res.status(400).json({ error: "Email and password are required." });
  }
  try {
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    const ok = user && (await bcrypt.compare(password, user.password));
    if (!ok) return res.status(401).json({ error: "Wrong email or password." });
    res.json({ token: sign(user), user: publicUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not log you in." });
  }
});

router.get("/me", auth, async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(401).json({ error: "Account not found." });
  res.json({ user: publicUser(user) });
});

module.exports = router;
