"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.dataset.page;
  const activeLink = document.querySelector(`[data-nav="${page}"]`);
  if (activeLink) activeLink.setAttribute("aria-current", "page");

  document.querySelectorAll("[data-year]").forEach((year) => {
    year.textContent = new Date().getFullYear();
  });

  const menuButton = document.querySelector(".menu-toggle");
  const siteNav = document.querySelector(".site-nav");
  if (menuButton && siteNav) {
    menuButton.addEventListener("click", () => {
      const expanded = menuButton.getAttribute("aria-expanded") === "true";
      menuButton.setAttribute("aria-expanded", String(!expanded));
      menuButton.setAttribute("aria-label", expanded ? "Open navigation" : "Close navigation");
      siteNav.classList.toggle("is-open", !expanded);
    });
    siteNav.addEventListener("click", (event) => {
      if (event.target.closest("a")) {
        menuButton.setAttribute("aria-expanded", "false");
        menuButton.setAttribute("aria-label", "Open navigation");
        siteNav.classList.remove("is-open");
      }
    });
  }

  if (page === "planner") initializePlanner();
  if (page === "contact") initializeContactForm();
});

function initializePlanner() {
  const storageKey = "student-portfolio-academic-tasks-v1";
  const taskForm = document.getElementById("task-form");
  const taskList = document.getElementById("task-list");
  const emptyState = document.getElementById("empty-state");
  const taskCount = document.getElementById("task-count");
  const clearCompletedButton = document.getElementById("clear-completed");
  let currentFilter = "all";
  let tasks = loadTasks();

  function loadTasks() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "[]");
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  }

  function saveTasks() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(tasks));
    } catch {
      // The planner still works for the current page if browser storage is unavailable.
    }
  }

  function makeTaskElement(task) {
    const item = document.createElement("li");
    item.className = `task-item${task.completed ? " is-complete" : ""}`;
    item.dataset.taskId = task.id;

    const completeButton = document.createElement("button");
    completeButton.className = "task-check";
    completeButton.type = "button";
    completeButton.dataset-action = "toggle";
    completeButton.setAttribute("aria-label", task.completed ? `Mark ${task.title} as not completed` : `Mark ${task.title} as completed`);
    completeButton.setAttribute("aria-pressed", String(task.completed));
    completeButton.textContent = task.completed ? "✓" : "";

    const detail = document.createElement("div");
    detail.className = "task-detail";
    const title = document.createElement("span");
    title.className = "task-title";
    title.textContent = task.title;
    const meta = document.createElement("span");
    meta.className = "task-meta";
    const metaParts = [];
    if (task.course) metaParts.push(task.course);
    if (task.dueDate) {
      const date = new Date(`${task.dueDate}T12:00:00`);
      metaParts.push(`Due ${date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`);
    }
    meta.textContent = metaParts.join("  ·  ") || "Academic task";
    detail.append(title, meta);

    const deleteButton = document.createElement("button");
    deleteButton.className = "task-delete";
    deleteButton.type = "button";
    deleteButton.dataset.action = "delete";
    deleteButton.setAttribute("aria-label", `Delete ${task.title}`);
    deleteButton.textContent = "×";

    item.append(completeButton, detail, deleteButton);
    return item;
  }

  function renderTasks() {
    const visibleTasks = tasks.filter((task) => {
      if (currentFilter === "active") return !task.completed;
      if (currentFilter === "completed") return task.completed;
      return true;
    });
    taskList.replaceChildren(...visibleTasks.map(makeTaskElement));
    const remaining = tasks.filter((task) => !task.completed).length;
    taskCount.textContent = String(remaining);
    emptyState.hidden = visibleTasks.length > 0;
    const emptyHeading = emptyState.querySelector("h3");
    const emptyMessage = emptyState.querySelector("p");
    if (tasks.length === 0) {
      emptyHeading.textContent = "You’ve got a fresh page.";
      emptyMessage.textContent = "Add a task above and give your next study session a starting point.";
    } else if (visibleTasks.length === 0) {
      emptyHeading.textContent = "No tasks in this view.";
      emptyMessage.textContent = "Choose another filter to see your tasks.";
    }
    clearCompletedButton.disabled = !tasks.some((task) => task.completed);
  }

  taskForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(taskForm);
    const title = String(formData.get("title") || "").trim();
    if (!title) return;
    tasks.unshift({
      id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      title,
      course: String(formData.get("course") || "").trim(),
      dueDate: String(formData.get("dueDate") || ""),
      completed: false,
      createdAt: new Date().toISOString()
    });
    saveTasks();
    currentFilter = "all";
    document.querySelectorAll(".filter-button").forEach((button) => {
      const selected = button.dataset.filter === currentFilter;
      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
    renderTasks();
    taskForm.reset();
    document.getElementById("task-title").focus();
  });

  document.querySelectorAll(".filter-button").forEach((button) => {
    button.addEventListener("click", () => {
      currentFilter = button.dataset.filter;
      document.querySelectorAll(".filter-button").forEach((tab) => {
        const selected = tab === button;
        tab.classList.toggle("is-selected", selected);
        tab.setAttribute("aria-pressed", String(selected));
      });
      renderTasks();
    });
  });

  taskList.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const item = button.closest("[data-task-id]");
    const task = tasks.find((entry) => entry.id === item.dataset.taskId);
    if (!task) return;
    if (button.dataset.action === "toggle") task.completed = !task.completed;
    if (button.dataset.action === "delete") tasks = tasks.filter((entry) => entry.id !== task.id);
    saveTasks();
    renderTasks();
  });

  clearCompletedButton.addEventListener("click", () => {
    tasks = tasks.filter((task) => !task.completed);
    saveTasks();
    renderTasks();
  });

  renderTasks();
}

function initializeContactForm() {
  const form = document.getElementById("contact-form");
  const status = document.getElementById("form-status");
  const fields = {
    name: document.getElementById("contact-name"),
    email: document.getElementById("contact-email"),
    phone: document.getElementById("contact-phone"),
    message: document.getElementById("contact-message")
  };
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phonePattern = /^\d+$/;
  const errorIds = { name: "name-error", email: "email-error", phone: "phone-error", message: "message-error" };

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const errors = {};
    Object.entries(fields).forEach(([key, field]) => {
      if (!field.value.trim()) errors[key] = "This field is required.";
    });
    if (!errors.email && !emailPattern.test(fields.email.value.trim())) errors.email = "Enter a valid email address.";
    if (!errors.phone && !phonePattern.test(fields.phone.value.trim())) errors.phone = "Use digits only for the phone number.";

    Object.entries(fields).forEach(([key, field]) => {
      const error = errors[key] || "";
      document.getElementById(errorIds[key]).textContent = error;
      field.setAttribute("aria-invalid", String(Boolean(error)));
      if (error) field.setAttribute("aria-describedby", errorIds[key]);
      else field.removeAttribute("aria-describedby");
    });

    if (Object.keys(errors).length) {
      status.textContent = "Please correct the highlighted fields and try again.";
      status.classList.add("has-error");
      fields[Object.keys(errors)[0]].focus();
      return;
    }

    status.textContent = "Your details look good. This demo does not send messages yet.";
    status.classList.remove("has-error");
    Object.values(fields).forEach((field) => {
      field.removeAttribute("aria-invalid");
      field.removeAttribute("aria-describedby");
    });
  });

  Object.values(fields).forEach((field) => {
    field.addEventListener("input", () => {
      const error = document.getElementById(errorIds[field.name]);
      if (error) error.textContent = "";
      field.removeAttribute("aria-invalid");
      status.textContent = "";
      status.classList.remove("has-error");
    });
  });
}
