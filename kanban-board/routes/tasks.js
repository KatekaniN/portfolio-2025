const express = require("express");
const { pool } = require("../database");
const router = express.Router();

// Helper function to get column_id from status name
async function getColumnIdByName(columnName) {
  try {
    const result = await pool.query("SELECT id FROM columns WHERE name = $1", [
      columnName,
    ]);
    return result.rows.length > 0 ? result.rows[0].id : null;
  } catch (error) {
    console.error("Error getting column ID:", error);
    return null;
  }
}

// Get all tasks
router.get("/", async (req, res) => {
  try {
    const { repo, column } = req.query;
    let query = `
    SELECT t.*, c.name as column_name, c.color as column_color 
    FROM tasks t 
    JOIN columns c ON t.column_id = c.id
  `;
    let params = [];

    if (repo || column) {
      query += " WHERE ";
      const conditions = [];

      if (repo) {
        conditions.push(`t.github_repo = $${params.length + 1}`);
        params.push(repo);
      }

      if (column) {
        conditions.push(`c.name = $${params.length + 1}`);
        params.push(column);
      }

      query += conditions.join(" AND ");
    }

    query += " ORDER BY t.created_at DESC";

    const result = await pool.query(query, params);
    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Create new task - UPDATED to handle status field
router.post("/", async (req, res) => {
  try {
    const {
      title,
      description,
      github_repo,
      priority = "medium",
      created_by = "Visitor",
      labels = [],
      status = "Backlog", // Accept status from frontend
      github_issue_number,
      github_url,
      due_date,
    } = req.body;

    console.log("📝 Creating task:", { title, status, created_by });

    if (!title) {
      return res.status(400).json({
        success: false,
        error: "Title is required",
      });
    }

    // Get column ID based on status name
    let column_id = await getColumnIdByName(status);

    // If provided status doesn't exist, default to Backlog
    if (!column_id) {
      console.warn(`⚠️ Status "${status}" not found, defaulting to Backlog`);
      column_id = await getColumnIdByName("Backlog");
    }

    if (!column_id) {
      return res.status(500).json({
        success: false,
        error: "No valid columns found in database",
      });
    }

    console.log(
      `📍 Task "${title}" will be added to column_id: ${column_id} (${status})`
    );

    const result = await pool.query(
      `
    INSERT INTO tasks (
      title, description, column_id, github_repo, priority, created_by, 
      labels, github_issue_number, github_url, due_date
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *
    `,
      [
        title,
        description,
        column_id, // Now uses the correct column based on status
        github_repo,
        priority,
        created_by,
        labels,
        github_issue_number,
        github_url,
        due_date,
      ]
    );

    console.log(`✅ Task "${title}" created successfully in ${status}`);

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: `Task added to ${status} successfully!`,
    });
  } catch (error) {
    console.error("❌ Error creating task:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Update task (move between columns)
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { column_id, title, description, priority, labels, status } =
      req.body;

    let finalColumnId = column_id;

    // If status is provided instead of column_id, convert it
    if (status && !column_id) {
      finalColumnId = await getColumnIdByName(status);
    }

    const result = await pool.query(
      `
    UPDATE tasks 
    SET 
      column_id = COALESCE($1, column_id),
      title = COALESCE($2, title),
      description = COALESCE($3, description),
      priority = COALESCE($4, priority),
      labels = COALESCE($5, labels),
      updated_at = NOW()
    WHERE id = $6
    RETURNING *
    `,
      [finalColumnId, title, description, priority, labels, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Task not found",
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Delete task
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM tasks WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Task not found",
      });
    }

    res.json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// DELETE /api/tasks/clear-all - Clear all tasks
router.delete("/clear-all", async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM tasks");

    console.log(`🗑️ Cleared ${result.rowCount} tasks from database`);

    res.json({
      success: true,
      message: `Deleted ${result.rowCount} tasks`,
      deletedCount: result.rowCount,
    });
  } catch (error) {
    console.error("Error clearing all tasks:", error);
    res.status(500).json({
      success: false,
      error: "Failed to clear tasks",
    });
  }
});

// DELETE /api/tasks/clear-boilerplate - Clear only boilerplate tasks
router.delete("/clear-boilerplate", async (req, res) => {
  try {
    const boilerplateCreators = [
      "System Setup",
      "Marketing Team",
      "QA Team",
      "UI/UX Team",
      "Frontend Team",
      "Animation Team",
      "Backend Team",
      "SEO Team",
      "Performance Team",
      "DevOps Team",
    ];

    const placeholders = boilerplateCreators
      .map((_, index) => `$${index + 1}`)
      .join(", ");
    const query = `DELETE FROM tasks WHERE created_by IN (${placeholders})`;

    const result = await pool.query(query, boilerplateCreators);

    console.log(
      `🧹 Cleared ${result.rowCount} boilerplate tasks from database`
    );

    res.json({
      success: true,
      message: `Deleted ${result.rowCount} boilerplate tasks`,
      deletedCount: result.rowCount,
    });
  } catch (error) {
    console.error("Error clearing boilerplate tasks:", error);
    res.status(500).json({
      success: false,
      error: "Failed to clear boilerplate tasks",
    });
  }
});

module.exports = router;
