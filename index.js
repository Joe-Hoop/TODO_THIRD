const { MongoClient } = require("mongodb");
const { v4: uuidv4 } = require("uuid"); // Import the UUID library
const express = require("express");
const path = require("path");
const app = express();
const port = 3000;
// Middleware to parse JSON bodies
app.use(express.json());
// Replace the uri string with your connection string.
const uri =
  "mongodb+srv://joeyhooper10:MDAHM0wliI5O5c03@cluster0.3sf6i.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    const database = client.db("Todo_App");
    const users = database.collection("users");

    // Query for a movie that has the title 'Back to the Future'
    const query = { username: "Larrguy" };
    const user = await users.findOne(query);

    console.log(user);
  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
run().catch(console.dir);

app.post("/todos", async (req, res) => {
  const { todo } = req.body;
  const { userId } = req.body;
  try {
    const database = client.db("Todo_App");
    const collection = database.collection("users");
    const newTodo = {
      _id: uuidv4(), // Generate a new unique ID
      text: todo,
      complete: false,
    };

    // Update the user's todos array by adding a new todo item
    const result = await collection.updateOne(
      { _id: userId }, // Find the user by UUID
      { $push: { todos: newTodo } } // Add the new todo to the todos array
    );

    if (result.modifiedCount > 0) {
      res
        .status(201)
        .json({ message: "Todo added successfully.", todo: newTodo }); // Include the new todo in the response
    } else {
      res.status(404).send({ message: "User not found." });
    }
  } catch (error) {
    console.error("Error adding todo:", error);
    res.status(500).send({ message: "Error adding todo." });
  }
});

app.put("/todos/:_id", async (req, res) => {
  const { _id } = req.params;
  const { text, complete } = req.body;
  console.log("Body: ", req.body);
  console.log("Complete: ", complete);
  const { userId } = req.body; // Replace with the actual UUID of the user
  await client
    .db("Todo_App")
    .collection("users")
    .updateOne(
      { _id: userId, "todos._id": _id }, // Match user and todo ID
      { $set: { "todos.$.text": text, "todos.$.complete": complete } } // Update the text of the specific todo
    );
  res.sendStatus(204); // No content
});

app.delete("/todos/:_id", async (req, res) => {
  const { _id } = req.params;
  const { userId } = req.body;
  await client
    .db("Todo_App")
    .collection("users")
    .updateOne(
      { _id: userId }, // Find the user by ID
      { $pull: { todos: { _id: _id } } } // Remove the todo
    );
  res.sendStatus(204); // No content
});

app.get("/todos", async (req, res) => {
  try {
    const userId = req.query.userId;
    const database = client.db("Todo_App");
    const usersCollection = database.collection("users");

    // Find the user by ID and return their todos
    const user = await usersCollection.findOne({ _id: userId });
    if (user) {
      res.status(200).json(user.todos);
    } else {
      res.status(404).send("User not found");
    }
  } catch (error) {
    console.error("Error fetching todos:", error);
    res.status(500).send("Internal server error");
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await client
      .db("Todo_App")
      .collection("users")
      .findOne({ username: username });

    console.log(user);
    if (!user) {
      // If no user is found, send a "user not found" response
      return res.status(404).json({ message: "User not found" });
    }

    // Check if the password matches (if stored as plain text or hash comparison)
    if (user.password !== password) {
      // If password does not match, send an "invalid password" response
      return res.status(401).json({ message: "Invalid password" });
    }

    // If both username and password match, return the userId
    res.json({ userId: user._id });
  } catch (error) {
    // Handle any errors that occur during login
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .send({ message: "Username and password are required." });
  }

  // Check if the username already exists
  const existingUser = await client
    .db("Todo_App")
    .collection("users")
    .findOne({ username });
  if (existingUser) {
    return res.status(409).send({ message: "Username already exists." });
  }

  // Create the new user
  const newUser = {
    _id: uuidv4(),
    username,
    password, // Consider hashing the password before storing it for security
    todos: [], // Initialize with an empty todo list
  };

  await client.db("Todo_App").collection("users").insertOne(newUser);
  res.status(201).send({ message: "User registered successfully." });
});

app.use(express.static(path.join(__dirname)));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html")); // Serve index.html from the same directory
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
