const express = require("express");
const { pool } = require("../database");
const router = express.Router();

// Get complete board data
router.get("/", async (req, res) => {
  try {
    // Get all columns
    const columnsResult = await pool.query(
      "SELECT * FROM columns ORDER BY position"
    );

    // Get all tasks with their column info
    const tasksResult = await pool.query(`
    SELECT 
      t.*,
      c.name as column_name,
      c.color as column_color
    FROM tasks t
    JOIN columns c ON t.column_id = c.id
    ORDER BY t.created_at DESC
  `);

    // Group tasks by column
    const boardData = columnsResult.rows.map((column) => ({
      ...column,
      tasks: tasksResult.rows.filter((task) => task.column_id === column.id),
    }));

    res.json({
      success: true,
      data: boardData,
    });
  } catch (error) {
    console.error("Error fetching board data:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get board statistics
router.get("/stats", async (req, res) => {
  try {
    const stats = await pool.query(`
    SELECT 
      c.name as column_name,
      COUNT(t.id) as task_count,
      c.color
    FROM columns c
    LEFT JOIN tasks t ON c.id = t.column_id
    GROUP BY c.id, c.name, c.color
    ORDER BY c.position
  `);

    const repoStats = await pool.query(`
    SELECT 
      github_repo,
      COUNT(*) as task_count,
      COUNT(CASE WHEN c.name = 'Done' THEN 1 END) as completed_count
    FROM tasks t
    JOIN columns c ON t.column_id = c.id
    WHERE github_repo IS NOT NULL
    GROUP BY github_repo
  `);

    res.json({
      success: true,
      data: {
        columnStats: stats.rows,
        repoStats: repoStats.rows,
        totalTasks: stats.rows.reduce(
          (sum, row) => sum + parseInt(row.task_count),
          0
        ),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
