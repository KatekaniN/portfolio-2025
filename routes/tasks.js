const express = require("express");
const { pool } = require("../database");
const router = express.Router();

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

// Create new task (visitor can add to backlog)
router.post("/", async (req, res) => {
  try {
    const {
      title,
      description,
      github_repo,
      priority = "medium",
      created_by = "Visitor",
      labels = [],
    } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        error: "Title is required",
      });
    }

    // Get backlog column ID
    const backlogResult = await pool.query(
      "SELECT id FROM columns WHERE name = $1",
      ["Backlog"]
    );

    if (backlogResult.rows.length === 0) {
      return res.status(500).json({
        success: false,
        error: "Backlog column not found",
      });
    }

    const result = await pool.query(
      `
    INSERT INTO tasks (title, description, column_id, github_repo, priority, created_by, labels)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `,
      [
        title,
        description,
        backlogResult.rows[0].id,
        github_repo,
        priority,
        created_by,
        labels,
      ]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: "Task added to backlog successfully!",
    });
  } catch (error) {
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
    const { column_id, title, description, priority, labels } = req.body;

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
      [column_id, title, description, priority, labels, id]
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

module.exports = router;
