let userId = "";
// Select the necessary DOM elements
const loginButton = document.getElementById("login-btn");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const loginForm = document.getElementById("login-form");
const todoSection = document.getElementById("todo-section");
const addButton = document.getElementById("add-btn");
const todoInput = document.getElementById("todo-input");
const todoList = document.getElementById("todo-list");

// Add event listener to the 'Login' button
loginButton.addEventListener("click", loginUser);
// Add event listener to the 'Add' button
addButton.addEventListener("click", addTodo);

document.getElementById("show-register").addEventListener("click", () => {
  document.getElementById("login-form").style.display = "none";
  document.getElementById("register-form").style.display = "block";
});
document.getElementById("show-login").addEventListener("click", () => {
  document.getElementById("register-form").style.display = "none";
  document.getElementById("login-form").style.display = "block";
});

document.getElementById("register-btn").addEventListener("click", async () => {
  const username = document.getElementById("new-username").value;
  const password = document.getElementById("new-password").value;

  if (!username || !password) {
    alert("Please fill in both fields");
    return;
  }

  const response = await fetch("/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (response.ok) {
    alert("Registration successful! Please log in.");
    document.getElementById("register-form").style.display = "none";
    document.getElementById("login-form").style.display = "block";
  } else {
    alert("Registration failed. Try a different username.");
  }
});

async function loginUser() {
  const username = usernameInput.value;
  const password = passwordInput.value;

  if (username.trim() === "" || password.trim() === "") {
    alert("Please enter a valid username and password.");
    return;
  }

  // Make a request to the backend to authenticate the user
  const response = await fetch("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (response.ok) {
    const data = await response.json();
    userId = data.userId; // Get the userId from the server response
    // Hide the login form and show the todo section
    loginForm.style.display = "none";
    todoSection.style.display = "block";

    // Fetch the user's todos after logging in
    fetchTodos();
  } else {
    alert("Login failed. Please check your username and password.");
  }
}

async function addTodo() {
  const todoText = todoInput.value;
  if (todoText.trim() === "") {
    alert("Please enter a valid todo!");
    return;
  }

  // Create a new todo object for the frontend (not yet saved to DB)
  const li = document.createElement("li");
  const span = document.createElement("span");
  span.textContent = todoText;
  li.appendChild(span);

  const buttonContainer = document.createElement("div"); // Container for buttons

  const editButton = document.createElement("button");
  editButton.textContent = "Edit";
  buttonContainer.appendChild(editButton);

  const deleteButton = document.createElement("button");
  deleteButton.textContent = "Delete";
  deleteButton.classList.add("delete");
  buttonContainer.appendChild(deleteButton);

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = false;

  const label = document.createElement("label");
  label.textContent = "Complete";
  label.appendChild(checkbox);

  buttonContainer.appendChild(label);

  li.appendChild(buttonContainer); // Append button container to li
  todoList.appendChild(li);
  todoInput.value = "";

  // Handle adding the todo to the database
  const response = await fetch("/todos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ todo: todoText, userId: userId }), // Send the todo text to the server
  });

  if (response.ok) {
    const data = await response.json(); // Expect to receive the todoId
    const todoId = data.todo._id; // Get the unique ID from the server response
    li.dataset.todoId = todoId; // Store the todoId in the li element for later reference
  } else {
    alert("Failed to add todo. Please try again.");
    return;
  }

  // Edit functionality
  editButton.addEventListener("click", async function () {
    if (editButton.textContent === "Edit") {
      const input = document.createElement("input");
      input.type = "text";
      input.value = span.textContent;
      li.replaceChild(input, span);
      editButton.textContent = "Save";
    } else {
      const updatedText = li.querySelector("input").value;
      span.textContent = updatedText;
      li.replaceChild(span, li.querySelector("input"));
      editButton.textContent = "Edit";

      // Send the update to the server
      const todoId = li.dataset.todoId; // Get the todoId stored in the li element
      const isComplete = checkbox.checked;
      const response = await fetch(`/todos/${todoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: updatedText,
          userId,
          complete: isComplete,
        }),
      });
    }
  });

  // Delete functionality
  deleteButton.addEventListener("click", async function () {
    const todoId = li.dataset.todoId; // Get the todoId stored in the li element
    await fetch(`/todos/${todoId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: userId }), // Include userId
    });
    todoList.removeChild(li);
  });

  checkbox.addEventListener("change", async function () {
    const todoId = li.dataset.todoId;
    const isComplete = checkbox.checked;
    const text = span.textContent;
    // Send the update to the server
    const response = await fetch(`/todos/${todoId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: text,
        userId,
        complete: isComplete,
      }),
    });
  });
}

async function fetchTodos() {
  try {
    const response = await fetch(`/todos?userId=${userId}`); // Pass userId as a query parameter, Adjust this URL if your server is running on a different port
    if (!response.ok) throw new Error("Network response was not ok");
    const todos = await response.json();

    // Assuming you have a function to render todos on the page
    renderTodos(todos);
  } catch (error) {
    console.error("Error fetching todos:", error);
  }
}

function renderTodos(todos) {
  const todoList = document.getElementById("todo-list"); // Make sure this ID matches your HTML
  todoList.innerHTML = ""; // Clear existing todos
  todos.forEach((todo) => {
    const li = document.createElement("li");
    const span = document.createElement("span");
    const todoId = todo._id; // Get the unique ID from the server response
    li.dataset.todoId = todoId;
    //li.textContent = todo["text"]; // Assuming todo is a string
    span.textContent = todo["text"];
    li.appendChild(span);
    const buttonContainer = document.createElement("div"); // Container for buttons

    const editButton = document.createElement("button");
    editButton.textContent = "Edit";
    buttonContainer.appendChild(editButton);

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.classList.add("delete");
    buttonContainer.appendChild(deleteButton);

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = todo.complete;

    const label = document.createElement("label");
    label.textContent = "Complete";
    label.appendChild(checkbox);

    buttonContainer.appendChild(label);

    li.appendChild(buttonContainer);

    editButton.addEventListener("click", async function () {
      if (editButton.textContent === "Edit") {
        const input = document.createElement("input");
        input.type = "text";
        input.value = span.textContent;
        li.replaceChild(input, span);
        editButton.textContent = "Save";
      } else {
        const updatedText = li.querySelector("input").value;
        span.textContent = updatedText;
        li.replaceChild(span, li.querySelector("input"));
        editButton.textContent = "Edit";

        // Send the update to the server
        const todoId = li.dataset.todoId; // Get the todoId stored in the li element
        const isComplete = checkbox.checked;
        const response = await fetch(`/todos/${todoId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: updatedText,
            userId,
            complete: isComplete,
          }),
        });
      }
    });

    // Delete functionality
    deleteButton.addEventListener("click", async function () {
      const todoId = li.dataset.todoId; // Get the todoId stored in the li element
      await fetch(`/todos/${todoId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userId }), // Include userId
      });
      todoList.removeChild(li);
    });

    checkbox.addEventListener("change", async function () {
      const todoId = li.dataset.todoId;
      const isComplete = checkbox.checked;
      const text = span.textContent;
      // Send the update to the server
      const response = await fetch(`/todos/${todoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text,
          userId,
          complete: isComplete,
        }),
      });
    });

    todoList.appendChild(li);
  });
}

// Call fetchTodos when the page loads
//window.onload = fetchTodos;
