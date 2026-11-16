const express = require("express");
const mongoose = require("mongoose");
const Task = require("../models/Task");
const auth = require("../middleware/auth");

const router = express.Router();
router.use(auth); // every task route needs a logged-in user

const STATUSES = ["todo", "in-progress", "done"];
const PRIORITIES = ["low", "medium", "high"];

// Only take the fields we allow, and check them
function readBody(body, partial) {
  const out = {};
  if (body.title !== undefined || !partial) {
    if (typeof body.title !== "string" || !body.title.trim()) return { error: "Title is required." };
    if (body.title.length > 120) return { error: "Title is too long." };
    out.title = body.title.trim();
  }
  if (body.description !== undefined) {
    if (typeof body.description !== "string" || body.description.length > 1000) {
      return { error: "Description is too long." };
    }
    out.description = body.description.trim();
  }
  if (body.status !== undefined) {
    if (!STATUSES.includes(body.status)) return { error: "Invalid status." };
    out.status = body.status;
  }
  if (body.priority !== undefined) {
    if (!PRIORITIES.includes(body.priority)) return { error: "Invalid priority." };
    out.priority = body.priority;
  }
  if (body.dueDate !== undefined) {
    if (body.dueDate === "" || body.dueDate === null) out.dueDate = null;
    else if (isNaN(Date.parse(body.dueDate))) return { error: "Invalid due date." };
    else out.dueDate = new Date(body.dueDate);
  }
  return { data: out };
}

function checkId(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: "Invalid task id." });
  next();
}

// List my tasks (optional ?status=todo|in-progress|done)
router.get("/", async (req, res) => {
  const filter = { user: req.userId };
  if (STATUSES.includes(req.query.status)) filter.status = req.query.status;
  const tasks = await Task.find(filter).sort({ createdAt: -1 });
  res.json(tasks);
});

// Create
router.post("/", async (req, res) => {
  const { data, error } = readBody(req.body || {}, false);
  if (error) return res.status(400).json({ error });
  const task = await Task.create({ ...data, user: req.userId });
  res.status(201).json(task);
});

// Update (only my own task)
router.put("/:id", checkId, async (req, res) => {
  const { data, error } = readBody(req.body || {}, true);
  if (error) return res.status(400).json({ error });
  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, user: req.userId },
    data,
    { new: true, runValidators: true }
  );
  if (!task) return res.status(404).json({ error: "Task not found." });
  res.json(task);
});

// Delete (only my own task)
router.delete("/:id", checkId, async (req, res) => {
  const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.userId });
  if (!task) return res.status(404).json({ error: "Task not found." });
  res.json({ ok: true });
});

module.exports = router;
