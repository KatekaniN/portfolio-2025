const express = require("express");
const cors = require("cors"); // CORS middleware to allow cross-origin requests
const helmet = require("helmet"); // Helmet helps protect your app from some well-known web vulnerabilities by setting HTTP headers appropriately.
const rateLimit = require("express-rate-limit"); // Rate limiting middleware to limit repeated requests to public APIs and endpoints
const morgan = require("morgan"); // HTTP request logger middleware for Node.js
require("dotenv").config();

const { pool } = require("./database");
const tasksRouter = require("./routes/tasks");
const githubRouter = require("./routes/github");
const boardRouter = require("./routes/board");

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: "*", // Allow all origins for development; restrict in production
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);
app.use(express.json({ limit: "10mb" }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});
app.use("/api/", limiter);

// Routes
app.use("/api/tasks", tasksRouter);
app.use("/api/github", githubRouter);
app.use("/api/board", boardRouter);

// Health check
app.get("/api/health", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({
      status: "healthy",
      timestamp: result.rows[0].now,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    });
  } catch (error) {
    res.status(500).json({
      status: "unhealthy",
      error: error.message,
    });
  }
});

// Initialize database tables
async function initializeDatabase() {
  try {
    // Create columns table
    await pool.query(`
    CREATE TABLE IF NOT EXISTS columns (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      position INTEGER NOT NULL,
      color VARCHAR(7) DEFAULT '#0078d4',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

    // Create tasks table
    await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      column_id INTEGER REFERENCES columns(id),
      github_repo VARCHAR(100),
      github_issue_number INTEGER,
      priority VARCHAR(20) DEFAULT 'medium',
      labels TEXT[],
      created_by VARCHAR(100),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      due_date TIMESTAMP,
      github_url VARCHAR(500)
    )
  `);

    // Insert default columns if they don't exist
    const columnsResult = await pool.query("SELECT COUNT(*) FROM columns");
    if (parseInt(columnsResult.rows[0].count) === 0) {
      await pool.query(`
      INSERT INTO columns (name, position, color) VALUES
      ('Backlog', 1, '#6c757d'),
      ('In Progress', 2, '#0078d4'),
      ('Review', 3, '#f39c12'),
      ('Done', 4, '#28a745')
    `);
      console.log("✅ Default columns created");
    }

    console.log("✅ Database initialized successfully");
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
  }
}

app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  await initializeDatabase();
});
