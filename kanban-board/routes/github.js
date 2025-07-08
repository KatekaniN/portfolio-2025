const express = require("express");
const axios = require("axios");
const { pool } = require("../database");
const router = express.Router();

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPOS = [
  "plantly",
  "cadbury-frontend",
  "spotlight-app",
  "consume-frontend",
];

// GitHub API headers
const githubHeaders = {
  Authorization: `token ${GITHUB_TOKEN}`,
  Accept: "application/vnd.github.v3+json",
};

// Sync GitHub issues to tasks
router.post("/sync", async (req, res) => {
  try {
    let syncedTasks = 0;
    let errors = [];

    for (const repo of REPOS) {
      try {
        // Get open issues from GitHub
        const response = await axios.get(
          `https://api.github.com/repos/KatekaniN/${repo}/issues`,
          {
            headers: githubHeaders,
            params: { state: "open", per_page: 50 },
          }
        );

        for (const issue of response.data) {
          // Skip pull requests (they appear as issues in GitHub API)
          if (issue.pull_request) continue;

          // Check if task already exists
          const existingTask = await pool.query(
            "SELECT id FROM tasks WHERE github_repo = $1 AND github_issue_number = $2",
            [repo, issue.number]
          );

          if (existingTask.rows.length === 0) {
            // Get appropriate column based on issue labels
            let columnName = "Backlog";
            const labels = issue.labels.map((label) => label.name);

            if (labels.includes("in-progress")) columnName = "In Progress";
            else if (labels.includes("review")) columnName = "Review";

            const columnResult = await pool.query(
              "SELECT id FROM columns WHERE name = $1",
              [columnName]
            );

            // Create new task from GitHub issue
            await pool.query(
              `
            INSERT INTO tasks (
              title, description, column_id, github_repo, 
              github_issue_number, labels, created_by, github_url
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          `,
              [
                issue.title,
                issue.body || "",
                columnResult.rows[0].id,
                repo,
                issue.number,
                labels,
                "GitHub Sync",
                issue.html_url,
              ]
            );

            syncedTasks++;
          }
        }
      } catch (repoError) {
        errors.push(`${repo}: ${repoError.message}`);
      }
    }

    res.json({
      success: true,
      message: `Synced ${syncedTasks} tasks from GitHub`,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get repository statistics
router.get("/repos/stats", async (req, res) => {
  try {
    const repoStats = [];

    for (const repo of REPOS) {
      try {
        const [repoInfo, issues, commits] = await Promise.all([
          axios.get(`https://api.github.com/repos/yourusername/${repo}`, {
            headers: githubHeaders,
          }),
          axios.get(
            `https://api.github.com/repos/yourusername/${repo}/issues?state=all&per_page=1`,
            { headers: githubHeaders }
          ),
          axios.get(
            `https://api.github.com/repos/yourusername/${repo}/commits?per_page=1`,
            { headers: githubHeaders }
          ),
        ]);

        // Get total issues count from Link header
        const totalIssues = issues.headers.link
          ? parseInt(
              issues.headers.link.match(/page=(\d+)>; rel="last"/)?.[1] || 1
            )
          : issues.data.length;

        repoStats.push({
          name: repo,
          description: repoInfo.data.description,
          language: repoInfo.data.language,
          stars: repoInfo.data.stargazers_count,
          forks: repoInfo.data.forks_count,
          openIssues: repoInfo.data.open_issues_count,
          totalIssues,
          lastCommit: commits.data[0]?.commit.author.date,
          url: repoInfo.data.html_url,
        });
      } catch (repoError) {
        repoStats.push({
          name: repo,
          error: repoError.message,
        });
      }
    }

    res.json({
      success: true,
      data: repoStats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
