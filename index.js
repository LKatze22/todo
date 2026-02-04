function sanitizeHTML(text) {
  if (typeof text !== "string") {
    return "";
  }

  const div = document.createElement("div");
  div.textContent = text;

  return div.innerHTML
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

function processTextForMentions(text) {
  const sanitizedText = sanitizeHTML(text);

  const mentionRegex = /@(\w+)/g;

  return sanitizedText.replace(mentionRegex, (match, username) => {
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return match;
    }

    return `<span class="mention">@${username}</span>`;
  });
}
// --- Hilfsfunktionen für Local Storage ---
const STORAGE_KEY = "todolists_data";

function saveToStorage(lists) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lists));
  } catch (e) {
    /* ignore */
  }
  updateDashboard();
}
document.addEventListener("DOMContentLoaded", () => {
  updateDashboard();
  loadTheme();
});

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

// ** Theme etc. **
function toggleTheme() {
  const body = document.body;
  const themeLabel = document.getElementById("theme-label");
  const themeCheckbox = document.getElementById("theme-checkbox");
  const mobileThemeCheckbox = document.getElementById("mobile-theme-checkbox");

  body.classList.toggle("light-mode");

  const isLightMode = body.classList.contains("light-mode");

  if (themeLabel) {
    themeLabel.textContent = isLightMode ? "Light Mode" : "Dark Mode";
  }

  // Sync checkbox states
  if (themeCheckbox) {
    themeCheckbox.checked = isLightMode;
  }
  if (mobileThemeCheckbox) {
    mobileThemeCheckbox.checked = isLightMode;
  }

  try {
    localStorage.setItem("theme", isLightMode ? "light" : "dark");
  } catch (e) {
    console.error("Failed to save theme preference:", e);
  }
}

// Load saved theme on page load
function loadTheme() {
  try {
    const savedTheme = localStorage.getItem("theme");
    const themeLabel = document.getElementById("theme-label");
    const themeCheckbox = document.getElementById("theme-checkbox");
    const mobileThemeCheckbox = document.getElementById(
      "mobile-theme-checkbox",
    );

    if (savedTheme === "light") {
      document.body.classList.add("light-mode");
      if (themeLabel) {
        themeLabel.textContent = "Light Mode";
      }
      if (themeCheckbox) {
        themeCheckbox.checked = true;
      }
      if (mobileThemeCheckbox) {
        mobileThemeCheckbox.checked = true;
      }
    } else {
      if (themeLabel) {
        themeLabel.textContent = "Dark Mode";
      }
      if (themeCheckbox) {
        themeCheckbox.checked = false;
      }
      if (mobileThemeCheckbox) {
        mobileThemeCheckbox.checked = false;
      }
    }
  } catch (e) {
    console.error("Failed to load theme preference:", e);
  }
}

function openPopup() {
  document.getElementById("popup").classList.add("open-popup");
}
function closePopup() {
  document.getElementById("popup").classList.remove("open-popup");
}

// Move openListModal function to global scope
function openListModal() {
  document.getElementById("listModal").style.display = "flex";
  document.getElementById("newListName").focus();
}

// ** SVG Checkbox **
function createCheckbox(completed = false) {
  const wrapper = document.createElement("div");
  wrapper.className = "checkbox-wrapper";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.className = "todo__state";
  checkbox.checked = completed;

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 25 25");
  svg.className = "todo__icon";

  const boxPath = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "path",
  );
  boxPath.setAttribute(
    "d",
    "M21 12.7v5c0 1.3-1 2.3-2.3 2.3H8.3C7 20 6 19 6 17.7V7.3C6 6 7 5 8.3 5h10.4C20 5 21 6 21 7.3v5.4",
  );
  boxPath.setAttribute("stroke", "url(#boxGradient)");
  boxPath.setAttribute("fill", "none");
  boxPath.setAttribute("stroke-width", "2");
  boxPath.className = "todo__box";
  boxPath.style.strokeDasharray = "56.1053";
  boxPath.style.strokeDashoffset = completed ? "56.1053" : "0";
  boxPath.style.transition = "stroke-dashoffset 0.8s ease";

  const checkPath = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "path",
  );
  checkPath.setAttribute("d", "M10 13l2 2 5-5");
  checkPath.setAttribute("stroke", "url(#boxGradient)");
  checkPath.setAttribute("fill", "none");
  checkPath.setAttribute("stroke-width", "3");
  checkPath.setAttribute("stroke-linecap", "round");
  checkPath.setAttribute("stroke-linejoin", "round");
  checkPath.className = "todo__check";
  checkPath.style.strokeDasharray = "9.8995";
  checkPath.style.strokeDashoffset = completed ? "0" : "9.8995";
  checkPath.style.transition = "stroke-dashoffset 0.8s ease";

  svg.appendChild(boxPath);
  svg.appendChild(checkPath);

  function animateCheckbox() {
    if (checkbox.checked) {
      boxPath.style.strokeDashoffset = "56.1053";
      boxPath.style.transitionDelay = "0s";
      setTimeout(() => {
        checkPath.style.strokeDashoffset = "0";
        checkPath.style.transitionDelay = "0s";
      }, 200);
    } else {
      checkPath.style.strokeDashoffset = "9.8995";
      checkPath.style.transitionDelay = "0s";
      setTimeout(() => {
        boxPath.style.strokeDashoffset = "0";
        boxPath.style.transitionDelay = "0s";
      }, 200);
    }
  }

  checkbox.addEventListener("change", animateCheckbox);

  wrapper.appendChild(checkbox);
  wrapper.appendChild(svg);

  return { wrapper, checkbox };
}

let listsData = [];
let currentRenameListId = null;

function findList(id) {
  return listsData.find((l) => l.id === id);
}

// Search functionality
function initializeSearch() {
  const searchInput = document.getElementById("searchInput");
  const clearBtn = document.getElementById("clearSearchBtn");

  searchInput.addEventListener("input", performSearch);
  clearBtn.addEventListener("click", clearSearch);
}

function performSearch() {
  const query = document
    .getElementById("searchInput")
    .value.toLowerCase()
    .trim();
  const containers = document.querySelectorAll(".todo-list-container");

  if (!query) {
    // Show all lists and todos
    containers.forEach((container) => {
      container.classList.remove("hidden");
      const todos = container.querySelectorAll(".todo");
      todos.forEach((todo) => todo.classList.remove("hidden"));
    });
    removeSearchHighlights();
    return;
  }

  let hasResults = false;

  containers.forEach((container) => {
    const todos = container.querySelectorAll(".todo");
    let listHasVisibleTodos = false;

    todos.forEach((todo) => {
      const text = todo.querySelector(".todo__text").textContent.toLowerCase();
      const notes = todo.querySelector(".notes-display");
      const notesText = notes ? notes.textContent.toLowerCase() : "";

      if (text.includes(query) || notesText.includes(query)) {
        todo.classList.remove("hidden");
        listHasVisibleTodos = true;
        hasResults = true;
        highlightSearchTerm(todo, query);
      } else {
        todo.classList.add("hidden");
      }
    });

    container.classList.toggle("hidden", !listHasVisibleTodos);
  });

  if (!hasResults) {
    showNoResults();
  }
}

function highlightSearchTerm(todoElement, query) {
  removeSearchHighlights();
  const textElement = todoElement.querySelector(".todo__text");
  const notesElement = todoElement.querySelector(".notes-display");

  [textElement, notesElement].filter(Boolean).forEach((element) => {
    const text = element.textContent;
    const regex = new RegExp(`(${query})`, "gi");
    element.innerHTML = text.replace(
      regex,
      '<span class="search-highlight">$1</span>',
    );
  });
}

function removeSearchHighlights() {
  document.querySelectorAll(".search-highlight").forEach((highlight) => {
    highlight.outerHTML = highlight.textContent;
  });
}

function clearSearch() {
  document.getElementById("searchInput").value = "";
  performSearch();
  // Hide the no-results message when clearing search
  const noResultsDiv = document.querySelector(".no-results");
  if (noResultsDiv) {
    noResultsDiv.remove();
  }
}

function showNoResults() {
  const container = document.getElementById("lists-container");
  let noResultsDiv = document.querySelector(".no-results");
  if (!noResultsDiv) {
    noResultsDiv = document.createElement("div");
    noResultsDiv.className = "no-results";
    noResultsDiv.textContent = "🙁 No results found";
    container.appendChild(noResultsDiv);
  }
}

function createTodoList(listId) {
  const container = document.createElement("div");
  container.className = "todo-list-container";

  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "New task...";
  input.className = "new-task";

  const dateInput = document.createElement("input");
  dateInput.type = "date";
  dateInput.className = "task-date";

  const prioritySelect = document.createElement("select");
  prioritySelect.className = "priority-select";
  ["low", "medium", "high"].forEach((level) => {
    const option = document.createElement("option");
    option.value = level;
    option.textContent = level.charAt(0).toUpperCase() + level.slice(1);
    prioritySelect.appendChild(option);
  });

  const addBtn = document.createElement("button");
  addBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
  <title>Add</title>
  <path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
</svg>`;
  addBtn.className = "add-btn";

  const ul = document.createElement("ul");
  ul.className = "todo-list";

  const progressContainer = document.createElement("div");
  progressContainer.className = "progress-container";
  const progressBar = document.createElement("div");
  progressBar.className = "progress-bar";
  const progressText = document.createElement("span");
  progressText.className = "progress-text";
  progressContainer.append(progressBar, progressText);

  let todos = [];
  let listObj = findList(listId);
  if (listObj) todos = listObj.todos || [];

  function saveTodosAndList() {
    let currentList = findList(listId);
    if (currentList) {
      currentList.todos = todos;
      saveToStorage(listsData);
    }
  }

  function renderTodos() {
    ul.innerHTML = "";
    todos.forEach((todo, idx) => {
      ul.appendChild(createTodoElement(todo, idx));
    });

    updateProgress();
  }

  function createTodoElement(todo, idx) {
    const li = document.createElement("li");
    li.className = "todo";
    if (todo.completed) li.classList.add("completed");
    li.setAttribute("tabindex", "0");

    const { wrapper, checkbox } = createCheckbox(todo.completed);

    const contentDiv = document.createElement("div");
    contentDiv.className = "todo__content";

    const mainDiv = document.createElement("div");
    mainDiv.className = "todo__main";

    const span = document.createElement("span");
    span.className = "todo__text";
    span.innerHTML = processTextForMentions(todo.text);

    const dateSpan = document.createElement("span");
    dateSpan.className = "todo__date";
    dateSpan.textContent = todo.date ? `📅 ${todo.date}` : "";

    const badge = document.createElement("span");
    badge.className =
      todo.priority === "high"
        ? "priority-badge priority-high"
        : todo.priority === "medium"
          ? "priority-badge priority-medium"
          : "priority-badge priority-low";
    badge.textContent = todo.priority
      ? todo.priority.charAt(0).toUpperCase() + todo.priority.slice(1)
      : "Low";

    const editInput = document.createElement("input");
    editInput.type = "text";
    editInput.className = "todo__edit";
    editInput.value = todo.text;

    const editDateInput = document.createElement("input");
    editDateInput.type = "date";
    editDateInput.className = "todo__edit-date";
    editDateInput.value = todo.date || "";

    const prioEditSelect = document.createElement("select");
    prioEditSelect.className = "priority-select";
    ["low", "medium", "high"].forEach((level) => {
      const option = document.createElement("option");
      option.value = level;
      option.textContent = level.charAt(0).toUpperCase() + level.slice(1);
      if (todo.priority === level) option.selected = true;
      prioEditSelect.appendChild(option);
    });
    prioEditSelect.style.display = "none";

    const notesToggleBtn = document.createElement("button");
    notesToggleBtn.className = "notes-toggle";
    notesToggleBtn.textContent = todo.notes ? "📝" : "➕📝";
    const editBtn = document.createElement("button");
    editBtn.className = "edit";
    editBtn.innerHTML = `
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <title>Edit</title>
    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
  </svg>`;

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete";
    deleteBtn.innerHTML = `
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <title>Delete</title>
    <path d="M18.3 5.71c-.39-.39-1.02-.39-1.41 0L12 10.59 7.11 5.7c-.39-.39-1.02-.39-1.41 0-.39.39-.39 1.02 0 1.41L10.59 12 5.7 16.89c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0L12 13.41l4.89 4.88c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41L13.41 12l4.89-4.89c.38-.38.38-1.02 0-1.4z"/>
  </svg>`;

    // Notes section
    const notesDiv = document.createElement("div");
    notesDiv.className = "todo__notes hidden";

    if (todo.notes) {
      const notesDisplay = document.createElement("div");
      notesDisplay.className = "notes-display";
      notesDisplay.innerHTML = processTextForMentions(todo.notes);

      const notesActions = document.createElement("div");
      notesActions.className = "notes-actions";

      const editNotesBtn = document.createElement("button");
      editNotesBtn.className = "notes-btn notes-edit";
      editNotesBtn.innerHTML = `
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <title>Edit</title>
    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
  </svg>`;

      const deleteNotesBtn = document.createElement("button");
      deleteNotesBtn.className = "notes-btn notes-delete";
      deleteNotesBtn.innerHTML = `
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <title>Delete</title>
    <path d="M18.3 5.71c-.39-.39-1.02-.39-1.41 0L12 10.59 7.11 5.7c-.39-.39-1.02-.39-1.41 0-.39.39-.39 1.02 0 1.41L10.59 12 5.7 16.89c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0L12 13.41l4.89 4.88c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41L13.41 12l4.89-4.89c.38-.38.38-1.02 0-1.4z"/>
  </svg> Delete`;

      notesActions.append(editNotesBtn, deleteNotesBtn);
      notesDiv.append(notesDisplay, notesActions);

      editNotesBtn.addEventListener("click", () =>
        editNotes(todo, idx, notesDiv),
      );
      deleteNotesBtn.addEventListener("click", () => deleteNotes(todo, idx));
    } else {
      showNotesInput(todo, idx, notesDiv);
    }

    checkbox.addEventListener("change", function () {
      todo.completed = checkbox.checked;
      li.classList.toggle("completed", todo.completed);
      saveTodosAndList();
      updateProgress();
    });

    notesToggleBtn.addEventListener("click", () => {
      notesDiv.classList.toggle("hidden");
    });

    editBtn.addEventListener("click", () => {
      if (!li.classList.contains("editing")) {
        li.classList.add("editing");
        prioEditSelect.style.display = "inline-block";
        editBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
  <title>Save</title>
  <path d="M10 4v8M6 10l4 4 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="4" y="16" width="12" height="2" rx="1" fill="currentColor"/>
</svg>Save`;
      } else {
        todo.text = editInput.value.trim() || todo.text;
        todo.date = editDateInput.value;
        todo.priority = prioEditSelect.value;
        li.classList.remove("editing");
        prioEditSelect.style.display = "none";
        editBtn.innerHTML =
          `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
          </svg>` + " Edit";
        saveTodosAndList();
        renderTodos();
      }
    });

    editInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") editBtn.click();
    });

    editDateInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") editBtn.click();
    });

    deleteBtn.addEventListener("click", () => {
      todos.splice(idx, 1);
      saveTodosAndList();
      renderTodos();
    });

    mainDiv.append(
      span,
      dateSpan,
      badge,
      editInput,
      editDateInput,
      prioEditSelect,
      notesToggleBtn,
      editBtn,
      deleteBtn,
    );
    contentDiv.append(mainDiv, notesDiv);
    li.append(wrapper, contentDiv);
    return li;
  }

  function showNotesInput(todo, idx, notesDiv) {
    notesDiv.innerHTML = "";
    const notesInput = document.createElement("textarea");
    notesInput.className = "notes-input";
    notesInput.placeholder = "Add Note...";

    const notesActions = document.createElement("div");
    notesActions.className = "notes-actions";

    const saveBtn = document.createElement("button");
    saveBtn.className = "notes-btn notes-save";
    saveBtn.innerHTML = `
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
  <title>Save</title>
  <path d="M10 4v8M6 10l4 4 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="4" y="16" width="12" height="2" rx="1" fill="currentColor"/>
</svg> Save`;

    notesActions.appendChild(saveBtn);
    notesDiv.append(notesInput, notesActions);

    saveBtn.addEventListener("click", () => {
      const noteText = notesInput.value.trim();
      if (noteText) {
        todo.notes = noteText;
        saveTodosAndList();
        renderTodos();
      }
    });
  }

  function editNotes(todo, idx, notesDiv) {
    const notesInput = document.createElement("textarea");
    notesInput.className = "notes-input";
    notesInput.value = todo.notes;

    const notesActions = document.createElement("div");
    notesActions.className = "notes-actions";

    const saveBtn = document.createElement("button");
    saveBtn.className = "notes-btn notes-save";
    saveBtn.innerHTML = `
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
  <title>Save</title>
  <path d="M10 4v8M6 10l4 4 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="4" y="16" width="12" height="2" rx="1" fill="currentColor"/>
</svg> Save`;

    const cancelBtn = document.createElement("button");
    cancelBtn.className = "notes-btn";
    cancelBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <title>Delete</title>
    <path d="M18.3 5.71c-.39-.39-1.02-.39-1.41 0L12 10.59 7.11 5.7c-.39-.39-1.02-.39-1.41 0-.39.39-.39 1.02 0 1.41L10.59 12 5.7 16.89c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0L12 13.41l4.89 4.88c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41L13.41 12l4.89-4.89c.38-.38.38-1.02 0-1.4z"/>
  </svg> Cancel`;

    notesActions.append(saveBtn, cancelBtn);
    notesDiv.innerHTML = "";
    notesDiv.append(notesInput, notesActions);

    saveBtn.addEventListener("click", () => {
      todo.notes = notesInput.value.trim();
      saveTodosAndList();
      renderTodos();
    });

    cancelBtn.addEventListener("click", () => {
      renderTodos();
    });
  }

  function deleteNotes(todo, idx) {
    todo.notes = "";
    saveTodosAndList();
    renderTodos();
  }

  function addTask() {
    const text = input.value.trim();
    const date = dateInput.value.trim();
    const priority = prioritySelect.value || "low";
    // Validierung
    if (!text) return;
    if (text.length > 200) {
      alert("Text zu lang (max 200 Zeichen)");
      return;
    }
    todos.push({
      text,
      completed: false,
      date,
      priority,
      notes: "",
    });
    saveTodosAndList();
    renderTodos();
    input.value = "";
    dateInput.value = "";
    prioritySelect.value = "low";
    showNotification("Task added successfully!");
  }
  function editTodo(todo, editInput) {
    const newText = editInput.value.trim();

    if (!newText) {
      alert("Text darf nicht leer sein");
      return false;
    }
    if (newText.length > 200) {
      alert("Text zu lang (max 200 Zeichen)");
      return false;
    }

    todo.text = newText;
    return true;
  }

  // Notizen-Validierung
  function saveNotes(todo, notesInput) {
    const noteText = notesInput.value.trim();

    if (noteText.length > 1000) {
      alert("Notizen zu lang (max 1000 Zeichen)");
      return false;
    }

    todo.notes = noteText;
    return true;
  }

  function updateProgress() {
    const done = todos.filter((t) => t.completed).length;
    const percent = todos.length ? Math.round((done / todos.length) * 100) : 0;
    progressBar.style.width = percent + "%";
    progressText.textContent = percent + "% erledigt";
  }

  addBtn.addEventListener("click", addTask);
  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") addTask();
  });

  container.append(
    input,
    dateInput,
    prioritySelect,
    addBtn,
    ul,
    progressContainer,
  );
  renderTodos();
  return container;
}

// --- Hauptapp ---
document.addEventListener("DOMContentLoaded", function () {
  const listsContainer = document.getElementById("lists-container");
  let listCount = 0;

  // Initialize search
  initializeSearch();

  // Setting theme from localStorage
  if (localStorage.getItem("favoriteColor")) {
    setBackgroundColor(localStorage.getItem("favoriteColor"));
  }
  if (localStorage.getItem("whiteTodoBg") === "1") {
    document.body.classList.add("white-todo-bg");
    document.getElementById("whiteTodosBtn").classList.add("active");
    document.getElementById("whiteTodosBtn").textContent = "Off";
  }
  if (localStorage.getItem("whiteTodoInputsBg") === "1") {
    document.body.classList.add("white-todoInputs-bg");
    document.getElementById("whiteInputsBtn").classList.add("active");
    document.getElementById("whiteInputsBtn").textContent = "Off";
  }

  // --- localStorage laden oder default --
  const saved = loadFromStorage();
  if (saved && Array.isArray(saved) && saved.length > 0) {
    listsData = saved;
  } else {
    listsData = [{ id: "todos_1", name: "My tasks", todos: [] }];
    saveToStorage(listsData);
  }

  listCount = listsData.reduce((m, l) => {
    const n = parseInt((l.id || "").split("_")[1]);
    return isNaN(n) ? m : Math.max(m, n);
  }, 0);

  function addList(id, name, todos = []) {
    if (document.getElementById("list-header-" + id)) return;
    const listNumber = parseInt(id.split("_")[1], 10);
    if (!isNaN(listNumber)) {
      listCount = Math.max(listCount, listNumber);
    }

    const header = document.createElement("div");
    header.className = "list-header";
    header.id = "list-header-" + id;
    const heading = document.createElement("h3");
    heading.textContent = `${name} `;

    const saveBtn = document.createElement("button");
    saveBtn.innerHTML = `
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <title>Edit</title>
    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
  </svg><span class="rename-text"> Rename list</span>`;
    saveBtn.className = "save-list-btn";

    const deleteBtn = document.createElement("button");
    deleteBtn.innerHTML = `
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <title>Delete</title>
    <path d="M18.3 5.71c-.39-.39-1.02-.39-1.41 0L12 10.59 7.11 5.7c-.39-.39-1.02-.39-1.41 0-.39.39-.39 1.02 0 1.41L10.59 12 5.7 16.89c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0L12 13.41l4.89 4.88c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41L13.41 12l4.89-4.89c.38-.38.38-1.02 0-1.4z"/>
  </svg><span class="delete-text"> Delete list</span>`;
    deleteBtn.className = "delete-list-btn";

    const todoListElement = createTodoList(id);

    saveBtn.addEventListener("click", () => {
      currentRenameListId = id;
      const currentList = findList(id);
      document.getElementById("renameListName").value = currentList
        ? currentList.name
        : "";
      document.getElementById("renameModal").style.display = "flex";
      document.getElementById("renameListName").focus();
    });

    deleteBtn.addEventListener("click", () => {
      // Remove from DOM
      header.remove();
      todoListElement.remove();

      // Remove from listsData array
      listsData = listsData.filter((l) => l.id !== id);

      // Save updated listsData to localStorage
      saveToStorage(listsData);

      console.log("List deleted:", id);
      console.log("Remaining lists:", listsData);
    });

    header.append(heading, saveBtn, deleteBtn);
    listsContainer.append(header, todoListElement);
  }

  // Modal handlers
  const listModal = document.getElementById("listModal");
  const renameModal = document.getElementById("renameModal");
  const createListBtn = document.getElementById("createListBtn");
  const cancelListBtn = document.getElementById("cancelListBtn");
  const saveRenameBtn = document.getElementById("saveRenameBtn");
  const cancelRenameBtn = document.getElementById("cancelRenameBtn");
  const newListNameInput = document.getElementById("newListName");
  const renameListNameInput = document.getElementById("renameListName");

  document.getElementById("newListBtn").addEventListener("click", () => {
    newListNameInput.value = "";
    listModal.style.display = "flex";
    newListNameInput.focus();
  });

  cancelListBtn.addEventListener("click", (e) => {
    e.preventDefault();
    listModal.style.display = "none";
  });

  createListBtn.addEventListener("click", (e) => {
    e.preventDefault();
    const name = newListNameInput.value.trim();
    if (!name) return;
    listCount++;
    const id = `todos_${listCount}`;
    const newList = { id, name, todos: [] };
    listsData.push(newList);
    saveToStorage(listsData);
    addList(id, name, []);
    listModal.style.display = "none";
  });

  saveRenameBtn.addEventListener("click", (e) => {
    e.preventDefault();
    const newName = renameListNameInput.value.trim();
    if (!newName || !currentRenameListId) return;

    const list = findList(currentRenameListId);
    if (list) {
      list.name = newName;
      saveToStorage(listsData);

      // Update header
      const header = document.getElementById(
        "list-header-" + currentRenameListId,
      );
      const heading = header.querySelector("h3");
      heading.textContent = `${newName} (Nr. ${
        currentRenameListId.split("_")[1]
      })`;
    }

    renameModal.style.display = "none";
    currentRenameListId = null;
  });

  cancelRenameBtn.addEventListener("click", (e) => {
    e.preventDefault();
    renameModal.style.display = "none";
    currentRenameListId = null;
  });

  newListNameInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") createListBtn.click();
  });

  renameListNameInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") saveRenameBtn.click();
  });

  window.addEventListener("click", (e) => {
    if (e.target === listModal) {
      listModal.style.display = "none";
    }
    if (e.target === renameModal) {
      renameModal.style.display = "none";
      currentRenameListId = null;
    }
  });

  // ** Listen aus Speicher rendern **
  listsData.forEach((listObj) =>
    addList(listObj.id, listObj.name, listObj.todos || []),
  );

  if (listsData.length === 0) {
    listCount = 1;
    const list = { id: "todos_1", name: "My tasks", todos: [] };
    listsData.push(list);
    saveToStorage(listsData);
    addList(list.id, list.name, []);
  }
});

function openListModal() {
  document.getElementById("listModal").style.display = "flex";
  document.getElementById("newListName").focus();
}

function showNotification(message) {
  const notification = `
                    <div class="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg fade-in z-50">
                        <i class="fas fa-check-circle mr-2"></i>${message}
                    </div>
                `;

  $("body").append(notification);

  setTimeout(() => {
    notification.fadeOut(() => notification.remove());
  }, 3000);
}

function updateDashboard() {
  const lists = loadFromStorage(); // Array von Listen holen
  if (!lists) return;

  let total = 0;
  let done = 0;

  lists.forEach((list) => {
    if (Array.isArray(list.todos)) {
      total += list.todos.length;
      done += list.todos.filter((todo) => todo.completed).length;
    }
  });

  const open = total - done;

  document.getElementById("total-count").textContent = total;
  document.getElementById("done-count").textContent = done;
  document.getElementById("open-count").textContent = open;
}

document.onkeydown = function (e) {
  // Detect if Ctrl + Shift is pressed together
  if (e.ctrlKey && e.shiftKey) {
    // Detect if L is pressed after Ctrl + Shift
    if (e.key == "L") {
      openListModal();
    }
  }
};
document.onkeydown = function (e) {
  // Detect if Ctrl + Shift is pressed together
  if (e.key === "Escape") {
    const modals = document.querySelectorAll(".modal");
    modals.forEach((modal) => {
      if (modal.style.display === "flex") {
        modal.style.display = "none";
      }
    });
  }
};

// Hamburger Menu functionality
const hamburgerButton = document.querySelector(".hamburger-button");
const mobileNav = document.querySelector(".mobile-nav");

hamburgerButton.addEventListener("click", () => {
  hamburgerButton.classList.toggle("active");
  mobileNav.classList.toggle("active");
});

// Close mobile nav when clicking mobile new list button
document.getElementById("mobileNewListBtn").addEventListener("click", () => {
  openListModal();
  hamburgerButton.classList.remove("active");
  mobileNav.classList.remove("active");
});

// Close mobile nav when clicking outside
document.addEventListener("click", (e) => {
  if (
    !e.target.closest(".mobile-nav") &&
    !e.target.closest(".hamburger-button") &&
    mobileNav.classList.contains("active")
  ) {
    hamburgerButton.classList.remove("active");
    mobileNav.classList.remove("active");
  }
});

if (window.innerWidth <= 340) {
  const saveListButton = document.querySelector(".save-list-btn");
  if (saveListButton) {
    saveListButton.textContent = ""; // Remove the description on mobile devices
  }
}
