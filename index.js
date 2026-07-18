const STORAGE_KEY = "task-tracker-state";
const LEGACY_TODO_KEY = "todos";
const FILTERS = ["all", "active", "completed"];
const DEFAULT_FILTER = "all";
const TODO_ANIMATION_DURATION = 220;
const DEFAULT_SHEET_PREFIX = "Book";

const todoForm = document.querySelector(".task-form");
const todoInput = document.getElementById("todo_input");
const todoList = document.getElementById("todo_list");
const todoSummary = document.getElementById("todo_summary");
const emptyState = document.getElementById("empty_state");
const filterButtons = document.querySelectorAll(".filter_btn");
const clearCompletedButton = document.getElementById("clear_completed_btn");
const sheetTabs = document.getElementById("sheet_tabs");
const sheetTitle = document.getElementById("sheet_title");
const currentMonth = document.getElementById("current_month");
const currentDate = document.getElementById("current_date");
const createSheetButton = document.getElementById("create_sheet_btn");
const renameSheetButton = document.getElementById("rename_sheet_btn");
const deleteSheetButton = document.getElementById("delete_sheet_btn");
const moveSheetLeftButton = document.getElementById("move_sheet_left_btn");
const moveSheetRightButton = document.getElementById("move_sheet_right_btn");

const removingTodoIds = new Set();
const today = new Date();

currentMonth.textContent = new Intl.DateTimeFormat("en-US", { month: "long" })
  .format(today)
  .toUpperCase();
currentDate.textContent = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
  year: "numeric",
}).format(today).toUpperCase();

let state = loadState();
let sheets = state.sheets;
let activeSheetId = state.activeSheetId;

ensureActiveSheetExists();
renderApp();

todoForm.addEventListener("submit", (event) => {
  event.preventDefault();
  addTodo();
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const activeSheet = getActiveSheet();
    activeSheet.filter = button.dataset.filter;
    saveState();
    renderApp();
  });
});

clearCompletedButton.addEventListener("click", () => {
  const activeSheet = getActiveSheet();
  activeSheet.todos = activeSheet.todos.filter((todo) => !todo.completed);
  saveState();
  renderApp();
});

createSheetButton.addEventListener("click", () => {
  createSheet();
});

renameSheetButton.addEventListener("click", () => {
  renameActiveSheet();
});

deleteSheetButton.addEventListener("click", () => {
  deleteActiveSheet();
});

moveSheetLeftButton.addEventListener("click", () => {
  moveActiveSheet(-1);
});

moveSheetRightButton.addEventListener("click", () => {
  moveActiveSheet(1);
});

function renderApp() {
  const activeSheet = getActiveSheet();

  renderSheetTabs();
  renderTodos();
  updateHeader(activeSheet);
  updateFilterButtons(activeSheet.filter);
  updateSheetActionState();
}

function renderSheetTabs() {
  sheetTabs.innerHTML = "";

  sheets.forEach((sheet) => {
    const tabButton = document.createElement("button");
    const isActive = sheet.id === activeSheetId;

    tabButton.type = "button";
    tabButton.className = "sheet-tab";
    if (isActive) {
      tabButton.classList.add("sheet-tab--active");
      tabButton.setAttribute("aria-current", "page");
    }

    tabButton.innerHTML = `
      <span class="sheet-tab__name">${escapeHtml(sheet.name)}</span>
      <span class="sheet-tab__count">${sheet.todos.length}</span>
    `;

    tabButton.addEventListener("click", () => {
      setActiveSheet(sheet.id);
    });

    sheetTabs.append(tabButton);
  });
}

function renderTodos(options = {}) {
  const activeSheet = getActiveSheet();
  todoList.innerHTML = "";

  activeSheet.todos.forEach((todo) => {
    if (!shouldRenderTodo(todo, activeSheet.filter)) {
      return;
    }

    const shouldAnimate = shouldAnimateTodo(todo.id, options.animateLastItem, activeSheet);
    const todoItem = createTodoItem(todo, activeSheet, shouldAnimate);
    todoList.append(todoItem);
  });

  updateSummary(activeSheet);
  updateEmptyState(activeSheet);
}

function updateHeader(activeSheet) {
  sheetTitle.textContent = activeSheet.name;
}

function updateSheetActionState() {
  const activeIndex = sheets.findIndex((sheet) => sheet.id === activeSheetId);

  moveSheetLeftButton.disabled = activeIndex <= 0;
  moveSheetRightButton.disabled = activeIndex === -1 || activeIndex >= sheets.length - 1;
}

function createTodoItem(todo, sheet, shouldAnimate = false) {
  const todoItem = document.createElement("li");
  const todoId = `todo-${todo.id}`;
  const isRemoving = removingTodoIds.has(todo.id);

  todoItem.className = "todo";
  if (shouldAnimate) {
    todoItem.classList.add("todo--enter");
  }
  if (isRemoving) {
    todoItem.classList.add("todo--removing");
  }

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.id = todoId;
  checkbox.checked = todo.completed;
  checkbox.disabled = isRemoving;

  const customCheckbox = document.createElement("label");
  customCheckbox.className = "custom_checkbox";
  customCheckbox.htmlFor = todoId;
  customCheckbox.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" aria-hidden="true">
      <path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z" />
    </svg>
  `;

  const todoText = document.createElement("label");
  todoText.className = "todo_text";
  todoText.htmlFor = todoId;
  todoText.textContent = todo.text;

  const deleteButton = document.createElement("button");
  deleteButton.className = "delete_btn";
  deleteButton.type = "button";
  deleteButton.setAttribute("aria-label", `Delete ${todo.text}`);
  deleteButton.disabled = isRemoving;
  deleteButton.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" aria-hidden="true">
      <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" />
    </svg>
  `;

  checkbox.addEventListener("change", () => {
    const currentTodo = sheet.todos.find((item) => item.id === todo.id);
    if (!currentTodo) {
      return;
    }

    currentTodo.completed = checkbox.checked;
    saveState();
    renderApp();
  });

  deleteButton.addEventListener("click", () => {
    deleteTodo(todo.id);
  });

  todoItem.append(checkbox, customCheckbox, todoText, deleteButton);
  return todoItem;
}

function shouldRenderTodo(todo, filter) {
  if (filter === "active") {
    return !todo.completed;
  }

  if (filter === "completed") {
    return todo.completed;
  }

  return true;
}

function shouldAnimateTodo(todoId, animateLastItem, sheet) {
  if (!animateLastItem || sheet.filter === "completed") {
    return false;
  }

  return todoId === sheet.todos[sheet.todos.length - 1]?.id;
}

function updateSummary(sheet) {
  const completedCount = sheet.todos.filter((todo) => todo.completed).length;
  const activeCount = sheet.todos.length - completedCount;
  const taskLabel = activeCount === 1 ? "task" : "tasks";

  todoSummary.textContent = `${activeCount} ${taskLabel} left • ${completedCount} completed`;
  clearCompletedButton.disabled = completedCount === 0;
}

function updateFilterButtons(filter) {
  filterButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.filter === filter);
  });
}

function updateEmptyState(sheet) {
  const hasVisibleTodos = [...todoList.children].length > 0;
  emptyState.hidden = hasVisibleTodos;

  if (sheet.todos.length === 0) {
    emptyState.textContent = "No tasks yet in this book. Add something to get started.";
    return;
  }

  emptyState.textContent = `No ${sheet.filter} tasks right now.`;
}

function addTodo() {
  const todoText = todoInput.value.trim();

  if (!todoText) {
    return;
  }

  const activeSheet = getActiveSheet();
  activeSheet.todos.push({
    id: createId(),
    text: todoText,
    completed: false,
  });

  saveState();
  renderApp();
  todoInput.value = "";
  todoInput.focus();
}

function createSheet() {
  const nextName = getUniqueSheetName(`${DEFAULT_SHEET_PREFIX} ${sheets.length + 1}`);
  const activeIndex = sheets.findIndex((sheet) => sheet.id === activeSheetId);
  const newSheet = {
    id: createId(),
    name: nextName,
    filter: DEFAULT_FILTER,
    todos: [],
  };

  if (activeIndex === -1) {
    sheets.push(newSheet);
  } else {
    sheets.splice(activeIndex + 1, 0, newSheet);
  }

  activeSheetId = newSheet.id;
  saveState();
  renderApp();
}

function renameActiveSheet() {
  const activeSheet = getActiveSheet();
  const nextName = window.prompt("Rename this book", activeSheet.name);

  if (!nextName || !nextName.trim()) {
    return;
  }

  const normalizedName = getUniqueSheetName(nextName, activeSheet.id);
  if (normalizedName === activeSheet.name) {
    return;
  }

  activeSheet.name = normalizedName;
  saveState();
  renderApp();
}

function deleteActiveSheet() {
  const activeSheet = getActiveSheet();
  const confirmMessage = sheets.length === 1
    ? `Delete ${activeSheet.name}? A new empty book will be created.`
    : `Delete ${activeSheet.name}?`;

  if (!window.confirm(confirmMessage)) {
    return;
  }

  if (sheets.length === 1) {
    sheets = [createSheetRecord(1)];
    activeSheetId = sheets[0].id;
  } else {
    const activeIndex = sheets.findIndex((sheet) => sheet.id === activeSheetId);
    sheets.splice(activeIndex, 1);
    const nextIndex = Math.min(activeIndex, sheets.length - 1);
    activeSheetId = sheets[nextIndex].id;
  }

  saveState();
  renderApp();
}

function moveActiveSheet(direction) {
  const activeIndex = sheets.findIndex((sheet) => sheet.id === activeSheetId);
  const targetIndex = activeIndex + direction;

  if (activeIndex < 0 || targetIndex < 0 || targetIndex >= sheets.length) {
    return;
  }

  const [movedSheet] = sheets.splice(activeIndex, 1);
  sheets.splice(targetIndex, 0, movedSheet);
  saveState();
  renderApp();
}

function deleteTodo(todoId) {
  if (removingTodoIds.has(todoId)) {
    return;
  }

  removingTodoIds.add(todoId);
  renderApp();

  window.setTimeout(() => {
    removingTodoIds.delete(todoId);
    const activeSheet = getActiveSheet();
    activeSheet.todos = activeSheet.todos.filter((todo) => todo.id !== todoId);
    saveState();
    renderApp();
  }, TODO_ANIMATION_DURATION);
}

function setActiveSheet(sheetId) {
  if (sheetId === activeSheetId) {
    return;
  }

  activeSheetId = sheetId;
  saveState();
  renderApp();
}

function getActiveSheet() {
  const sheet = sheets.find((item) => item.id === activeSheetId);
  return sheet || sheets[0];
}

function ensureActiveSheetExists() {
  if (!Array.isArray(sheets) || sheets.length === 0) {
    sheets = [createSheetRecord(1)];
    activeSheetId = sheets[0].id;
    saveState();
    return;
  }

  if (!sheets.some((sheet) => sheet.id === activeSheetId)) {
    activeSheetId = sheets[0].id;
  }
}

function saveState() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      activeSheetId,
      sheets,
    })
  );
}

function loadState() {
  try {
    const savedState = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    if (Array.isArray(savedState.sheets) && savedState.sheets.length > 0) {
      const sheets = savedState.sheets
        .map((sheet, index) => normalizeSheet(sheet, index + 1))
        .filter(Boolean);

      if (sheets.length === 0) {
        return {
          sheets: [createSheetRecord(1)],
          activeSheetId: null,
        };
      }

      return {
        sheets,
        activeSheetId: sheets.some((sheet) => sheet.id === savedState.activeSheetId)
          ? savedState.activeSheetId
          : sheets[0].id,
      };
    }

    const legacyTodos = JSON.parse(localStorage.getItem(LEGACY_TODO_KEY) || "[]");
    const legacyFilter = FILTERS.includes(savedState.filter) ? savedState.filter : DEFAULT_FILTER;

    return {
      sheets: [
        {
          id: createId(),
          name: `${DEFAULT_SHEET_PREFIX} 1`,
          filter: legacyFilter,
          todos: Array.isArray(legacyTodos)
            ? legacyTodos
                .filter((todo) => todo && typeof todo.text === "string")
                .map((todo) => ({
                  id: typeof todo.id === "string" && todo.id ? todo.id : createId(),
                  text: todo.text,
                  completed: Boolean(todo.completed),
                }))
            : [],
        },
      ],
      activeSheetId: null,
    };
  } catch (error) {
    return {
      sheets: [createSheetRecord(1)],
      activeSheetId: null,
    };
  }
}

function normalizeSheet(sheet, fallbackIndex) {
  if (!sheet || typeof sheet !== "object") {
    return null;
  }

  const todos = Array.isArray(sheet.todos)
    ? sheet.todos
        .filter((todo) => todo && typeof todo.text === "string")
        .map((todo) => ({
          id: typeof todo.id === "string" && todo.id ? todo.id : createId(),
          text: todo.text,
          completed: Boolean(todo.completed),
        }))
    : [];

  return {
    id: typeof sheet.id === "string" && sheet.id ? sheet.id : createId(),
    name: typeof sheet.name === "string" && sheet.name.trim() ? sheet.name.trim() : `${DEFAULT_SHEET_PREFIX} ${fallbackIndex}`,
    filter: FILTERS.includes(sheet.filter) ? sheet.filter : DEFAULT_FILTER,
    todos,
  };
}

function createSheetRecord(index) {
  return {
    id: createId(),
    name: `${DEFAULT_SHEET_PREFIX} ${index}`,
    filter: DEFAULT_FILTER,
    todos: [],
  };
}

function getUniqueSheetName(requestedName, ignoreId) {
  const baseName = requestedName.trim();
  const existingNames = new Set(
    sheets
      .filter((sheet) => sheet.id !== ignoreId)
      .map((sheet) => sheet.name.toLowerCase())
  );
  const fallbackName = baseName || `${DEFAULT_SHEET_PREFIX} ${sheets.length + 1}`;
  let candidateName = fallbackName;
  let suffix = 2;

  while (existingNames.has(candidateName.toLowerCase())) {
    candidateName = `${fallbackName} ${suffix}`;
    suffix += 1;
  }

  return candidateName;
}

function createId() {
  if (window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}


