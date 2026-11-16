const $ = (s) => document.querySelector(s);
const LABEL = { "todo": "To do", "in-progress": "In progress", "done": "Done" };

let token = localStorage.getItem("tm_token");
let user = null;
try { user = JSON.parse(localStorage.getItem("tm_user")); } catch (e) {}
let tasks = [];
let filter = "all";
let editingId = null;
let mode = "login";

async function api(path, method = "GET", body) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = "Bearer " + token;
  const res = await fetch("/api" + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  let data = {};
  try { data = await res.json(); } catch (e) {}
  if (res.status === 401 && token) { logout(); }
  if (!res.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}

/* ---------- Login / register ---------- */
function setMode(m) {
  mode = m;
  $("#tabLogin").classList.toggle("active", m === "login");
  $("#tabRegister").classList.toggle("active", m === "register");
  $("#nameRow").hidden = m === "login";
  $("#authBtn").textContent = m === "login" ? "Log in" : "Create account";
  $("#password").autocomplete = m === "login" ? "current-password" : "new-password";
  $("#authMsg").textContent = "";
}

async function submitAuth() {
  const btn = $("#authBtn");
  $("#authMsg").textContent = "";
  btn.disabled = true;
  try {
    const body = { email: $("#email").value, password: $("#password").value };
    if (mode === "register") body.name = $("#name").value;
    const data = await api(mode === "login" ? "/auth/login" : "/auth/register", "POST", body);
    token = data.token;
    user = data.user;
    localStorage.setItem("tm_token", token);
    localStorage.setItem("tm_user", JSON.stringify(user));
    $("#password").value = "";
    showApp();
  } catch (err) {
    $("#authMsg").textContent = err.message;
  }
  btn.disabled = false;
}

function logout() {
  token = null; user = null; tasks = [];
  localStorage.removeItem("tm_token");
  localStorage.removeItem("tm_user");
  $("#app").hidden = true;
  $("#who").hidden = true;
  $("#auth").hidden = false;
}

/* ---------- Tasks ---------- */
function showApp() {
  $("#auth").hidden = true;
  $("#app").hidden = false;
  $("#who").hidden = false;
  $("#userName").textContent = user ? user.name : "";
  resetForm();
  loadTasks();
}

async function loadTasks() {
  try {
    tasks = await api("/tasks");
    render();
  } catch (err) {
    $("#taskMsg").textContent = err.message;
  }
}

function resetForm() {
  editingId = null;
  ["#title", "#description", "#dueDate"].forEach((s) => ($(s).value = ""));
  $("#status").value = "todo";
  $("#priority").value = "medium";
  $("#formTitle").textContent = "Add a task";
  $("#saveBtn").textContent = "Add task";
  $("#cancelBtn").hidden = true;
  $("#taskMsg").textContent = "";
}

async function saveTask() {
  const body = {
    title: $("#title").value,
    description: $("#description").value,
    status: $("#status").value,
    priority: $("#priority").value,
    dueDate: $("#dueDate").value,
  };
  $("#taskMsg").textContent = "";
  $("#saveBtn").disabled = true;
  try {
    if (editingId) await api("/tasks/" + editingId, "PUT", body);
    else await api("/tasks", "POST", body);
    resetForm();
    await loadTasks();
  } catch (err) {
    $("#taskMsg").textContent = err.message;
  }
  $("#saveBtn").disabled = false;
}

function startEdit(task) {
  editingId = task._id;
  $("#title").value = task.title;
  $("#description").value = task.description || "";
  $("#status").value = task.status;
  $("#priority").value = task.priority;
  $("#dueDate").value = task.dueDate ? task.dueDate.slice(0, 10) : "";
  $("#formTitle").textContent = "Edit task";
  $("#saveBtn").textContent = "Save changes";
  $("#cancelBtn").hidden = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function changeStatus(task, status) {
  try { await api("/tasks/" + task._id, "PUT", { status }); await loadTasks(); }
  catch (err) { $("#taskMsg").textContent = err.message; }
}

async function removeTask(task) {
  if (!confirm("Delete \"" + task.title + "\"?")) return;
  try { await api("/tasks/" + task._id, "DELETE"); await loadTasks(); }
  catch (err) { $("#taskMsg").textContent = err.message; }
}

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text; // textContent keeps user text safe
  return e;
}

function render() {
  const shown = filter === "all" ? tasks : tasks.filter((t) => t.status === filter);
  $("#count").textContent = shown.length + (shown.length === 1 ? " task" : " tasks");
  const list = $("#list");
  list.replaceChildren();
  if (!shown.length) {
    list.append(el("li", "muted", "No tasks here yet."));
    return;
  }
  shown.forEach((t) => {
    const li = el("li", "task " + t.status);
    li.append(el("h3", "", t.title));
    if (t.description) li.append(el("p", "", t.description));

    const meta = el("div", "meta");
    meta.append(el("span", "badge", LABEL[t.status]));
    meta.append(el("span", "badge", "Priority: " + t.priority));
    if (t.dueDate) meta.append(el("span", "badge", "Due " + new Date(t.dueDate).toLocaleDateString()));
    li.append(meta);

    const row = el("div", "row");
    const sel = el("select");
    sel.setAttribute("aria-label", "Change status");
    Object.keys(LABEL).forEach((k) => {
      const o = el("option", "", LABEL[k]);
      o.value = k;
      if (k === t.status) o.selected = true;
      sel.append(o);
    });
    sel.addEventListener("change", () => changeStatus(t, sel.value));
    const edit = el("button", "ghost", "Edit");
    edit.type = "button";
    edit.addEventListener("click", () => startEdit(t));
    const del = el("button", "del", "Delete");
    del.type = "button";
    del.addEventListener("click", () => removeTask(t));
    row.append(sel, edit, del);
    li.append(row);
    list.append(li);
  });
}

/* ---------- Wire up ---------- */
$("#tabLogin").addEventListener("click", () => setMode("login"));
$("#tabRegister").addEventListener("click", () => setMode("register"));
$("#authBtn").addEventListener("click", submitAuth);
$("#authForm").addEventListener("keydown", (e) => { if (e.key === "Enter") submitAuth(); });
$("#logout").addEventListener("click", logout);
$("#saveBtn").addEventListener("click", saveTask);
$("#cancelBtn").addEventListener("click", resetForm);
$("#filters").addEventListener("click", (e) => {
  const b = e.target.closest("button[data-f]");
  if (!b) return;
  filter = b.dataset.f;
  document.querySelectorAll(".chip").forEach((c) => c.classList.toggle("active", c === b));
  render();
});

if (token) showApp();
