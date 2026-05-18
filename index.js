const STORAGE_KEY = "task-tracker-state";
const FILTERS = ["all", "active", "completed"];

const todoForm = document.querySelector("form");
const todoInput = document.getElementById("todo_input");
const todoList = document.getElementById("todo_list");
const todoSummary = document.getElementById("todo_summary");
const emptyState = document.getElementById("empty_state");
const filterButtons = document.querySelectorAll(".filter_btn");
const clearCompletedButton = document.getElementById("clear_completed_btn");

let { todos: allTodos, filter: currentFilter } = loadState();

renderTodos();

todoForm.addEventListener("submit", (event) => {
  event.preventDefault();
  addTodo();
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.filter;
    saveState();
    renderTodos();
  });
});

clearCompletedButton.addEventListener("click", () => {
  allTodos = allTodos.filter((todo) => !todo.completed);
  saveState();
  renderTodos();
});

function addTodo() {
  const todoText = todoInput.value.trim();

  if (!todoText) {
    return;
  }

  allTodos.push({
    text: todoText,
    completed: false,
  });

  saveState();
  renderTodos({ animateLastItem: true });
  todoInput.value = "";
  todoInput.focus();
}

function renderTodos(options = {}) {
  todoList.innerHTML = "";

  allTodos.forEach((todo, todoIndex) => {
    if (!shouldRenderTodo(todo)) {
      return;
    }

    const shouldAnimate =
      options.animateLastItem && todoIndex === allTodos.length - 1 && currentFilter !== "completed";
    const todoItem = createTodoItem(todo, todoIndex, shouldAnimate);
    todoList.append(todoItem);
  });

  updateSummary();
  updateFilterButtons();
  updateEmptyState();
}

function createTodoItem(todo, todoIndex, shouldAnimate = false) {
  const todoItem = document.createElement("li");
  const todoId = `todo-${todoIndex}`;

  todoItem.className = "todo";
  if (shouldAnimate) {
    todoItem.classList.add("todo--enter");
  }

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.id = todoId;
  checkbox.checked = todo.completed;

  const customCheckbox = document.createElement("label");
  customCheckbox.className = "custom_checkbox";
  customCheckbox.htmlFor = todoId;
  customCheckbox.innerHTML = `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      height="24px"
      viewBox="0 -960 960 960"
      width="24px"
      fill="transparent"
    >
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
  deleteButton.innerHTML = `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      height="24px"
      viewBox="0 -960 960 960"
      width="24px"
      fill="var(--secondary)"
    >
      <path
        d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"
      />
    </svg>
  `;

  checkbox.addEventListener("change", () => {
    allTodos[todoIndex].completed = checkbox.checked;
    saveState();
    renderTodos();
  });

  deleteButton.addEventListener("click", () => {
    deleteTodo(todoIndex, todoItem);
  });

  todoItem.append(checkbox, customCheckbox, todoText, deleteButton);
  return todoItem;
}

function shouldRenderTodo(todo) {
  if (currentFilter === "active") {
    return !todo.completed;
  }

  if (currentFilter === "completed") {
    return todo.completed;
  }

  return true;
}

function updateSummary() {
  const completedCount = allTodos.filter((todo) => todo.completed).length;
  const activeCount = allTodos.length - completedCount;
  const taskLabel = activeCount === 1 ? "task" : "tasks";

  todoSummary.textContent = `${activeCount} ${taskLabel} left • ${completedCount} completed`;
  clearCompletedButton.disabled = completedCount === 0;
}

function updateFilterButtons() {
  filterButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.filter === currentFilter);
  });
}

function updateEmptyState() {
  const hasVisibleTodos = [...todoList.children].length > 0;
  emptyState.hidden = hasVisibleTodos;

  if (allTodos.length === 0) {
    emptyState.textContent = "No tasks yet. Add something to get started.";
    return;
  }

  emptyState.textContent = `No ${currentFilter} tasks right now.`;
}

function saveState() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      todos: allTodos,
      filter: currentFilter,
    })
  );
}

function loadState() {
  try {
    const savedState = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    const legacyTodos = JSON.parse(localStorage.getItem("todos") || "[]");
    const filter = FILTERS.includes(savedState.filter) ? savedState.filter : "all";
    let todos = [];

    if (Array.isArray(savedState.todos)) {
      todos = savedState.todos;
    } else if (Array.isArray(legacyTodos)) {
      todos = legacyTodos;
    }

    return {
      todos: todos.filter((todo) => todo && typeof todo.text === "string").map((todo) => ({
        text: todo.text,
        completed: Boolean(todo.completed),
      })),
      filter,
    };
  } catch (error) {
    return {
      todos: [],
      filter: "all",
    };
  }
}

function deleteTodo(todoIndex, todoElement) {
  todoElement.classList.add("todo--removing");

  window.setTimeout(() => {
    allTodos = allTodos.filter((_, index) => index !== todoIndex);
    saveState();
    renderTodos();
  }, 180);
}
