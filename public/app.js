const rows = document.querySelector("#student-rows");
const searchInput = document.querySelector("#search-input");
const departmentSelect = document.querySelector("#department-select");
const form = document.querySelector("#student-form");
const formMessage = document.querySelector("#form-message");

let students = [];
let editingId = null;

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}

async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers }
  });
  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result.message || "The request could not be completed.");
  }
  return response.status === 204 ? null : response.json();
}

function renderDepartments() {
  const selected = departmentSelect.value;
  const departments = [...new Set(students.map((student) => student.department))]
    .sort((a, b) => a.localeCompare(b));
  departmentSelect.innerHTML = '<option value="">All departments</option>' +
    departments.map((department) =>
      `<option value="${escapeHtml(department)}">${escapeHtml(department)}</option>`
    ).join("");
  departmentSelect.value = departments.includes(selected) ? selected : "";
}

function renderRows() {
  const query = searchInput.value.trim().toLowerCase();
  const department = departmentSelect.value.toLowerCase();
  const filtered = students.filter((student) => {
    const matchesSearch = !query ||
      student.rollNumber.toLowerCase().includes(query) ||
      student.department.toLowerCase().includes(query);
    return matchesSearch && (!department || student.department.toLowerCase() === department);
  });

  rows.innerHTML = filtered.map((student) => `
    <tr>
      <td>${escapeHtml(student.fullName)}</td>
      <td>${escapeHtml(student.rollNumber)}</td>
      <td>${escapeHtml(student.email)}</td>
      <td>${escapeHtml(student.department)}</td>
      <td>${escapeHtml(student.semester)}</td>
      <td>${escapeHtml(student.phone || "—")}</td>
      <td class="actions">
        <button type="button" class="edit-button" data-id="${escapeHtml(student._id)}">Edit</button>
        <button type="button" class="delete-button" data-id="${escapeHtml(student._id)}">Delete</button>
      </td>
    </tr>`).join("");
  document.querySelector("#record-count").textContent =
    `Showing ${filtered.length} of ${students.length} student${students.length === 1 ? "" : "s"}`;
  document.querySelector("#empty-state").hidden = filtered.length !== 0;
}

async function loadStudents() {
  try {
    students = await request("/api/students");
    renderDepartments();
    renderRows();
  } catch (error) {
    document.querySelector("#record-count").textContent = error.message;
  }
}

function resetForm() {
  form.reset();
  editingId = null;
  document.querySelector("#form-title").textContent = "Add a student";
  document.querySelector("#save-button").textContent = "Add student";
  document.querySelector("#cancel-edit").hidden = true;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const body = Object.fromEntries(new FormData(form));
  body.semester = Number(body.semester);
  const saveButton = document.querySelector("#save-button");
  saveButton.disabled = true;
  formMessage.textContent = "";

  try {
    await request(editingId ? `/api/students/${encodeURIComponent(editingId)}` : "/api/students", {
      method: editingId ? "PUT" : "POST",
      body: JSON.stringify(body)
    });
    formMessage.textContent = editingId ? "Student record updated." : "Student added.";
    resetForm();
    await loadStudents();
  } catch (error) {
    formMessage.textContent = error.message;
  } finally {
    saveButton.disabled = false;
  }
});

rows.addEventListener("click", async (event) => {
  const editButton = event.target.closest(".edit-button");
  const deleteButton = event.target.closest(".delete-button");

  if (editButton) {
    const student = students.find((item) => item._id === editButton.dataset.id);
    if (!student) return;
    editingId = student._id;
    for (const [key, value] of Object.entries(student)) {
      const field = form.elements.namedItem(key);
      if (field) field.value = value;
    }
    document.querySelector("#form-title").textContent = "Edit student";
    document.querySelector("#save-button").textContent = "Save changes";
    document.querySelector("#cancel-edit").hidden = false;
    form.elements.namedItem("fullName").focus();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (deleteButton) {
    const student = students.find((item) => item._id === deleteButton.dataset.id);
    if (!student || !window.confirm(`Delete ${student.fullName}'s record?`)) return;
    try {
      await request(`/api/students/${encodeURIComponent(student._id)}`, { method: "DELETE" });
      formMessage.textContent = "Student record deleted.";
      await loadStudents();
    } catch (error) {
      formMessage.textContent = error.message;
    }
  }
});

document.querySelector("#cancel-edit").addEventListener("click", resetForm);
document.querySelector("#refresh-button").addEventListener("click", loadStudents);
searchInput.addEventListener("input", renderRows);
departmentSelect.addEventListener("change", renderRows);
loadStudents();
