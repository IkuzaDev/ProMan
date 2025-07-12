const db = require('../config/database');

class Task {
  static findById(id) {
    return new Promise((resolve, reject) => {
      db.get(`
        SELECT t.*, p.name as project_name,
          creator.fullname as creator_name,
          assignee.fullname as assignee_name,
          assignee.avatar as assignee_avatar
        FROM tasks t
        LEFT JOIN projects p ON t.project_id = p.id
        LEFT JOIN users creator ON t.created_by = creator.id
        LEFT JOIN users assignee ON t.assigned_to = assignee.id
        WHERE t.id = ?
      `, [id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  static create(taskData) {
    const { project_id, name, description, status, priority, start_date, due_date, created_by, assigned_to } = taskData;
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO tasks (
          project_id, name, description, status, priority, 
          start_date, due_date, created_by, assigned_to
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [project_id, name, description, status, priority, start_date, due_date, created_by, assigned_to],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ 
              id: this.lastID, 
              project_id, name, description, status, priority, 
              start_date, due_date, created_by, assigned_to 
            });
          }
        }
      );
    });
  }

  static update(id, taskData) {
    const { name, description, status, priority, start_date, due_date, assigned_to } = taskData;
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE tasks SET 
          name = ?, description = ?, status = ?, priority = ?, 
          start_date = ?, due_date = ?, assigned_to = ?
        WHERE id = ?`,
        [name, description, status, priority, start_date, due_date, assigned_to, id],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ 
              id, name, description, status, priority, 
              start_date, due_date, assigned_to 
            });
          }
        }
      );
    });
  }

  static updateStatus(id, status) {
    return new Promise((resolve, reject) => {
      db.run('UPDATE tasks SET status = ? WHERE id = ?', [status, id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id, status });
        }
      });
    });
  }

  static updateProgress(id, progress) {
    return new Promise((resolve, reject) => {
      db.run('UPDATE tasks SET progress = ? WHERE id = ?', [progress, id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id, progress });
        }
      });
    });
  }

  static delete(id) {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM tasks WHERE id = ?', [id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ success: true });
        }
      });
    });
  }

  static findByProjectId(projectId) {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT t.*, 
          creator.fullname as creator_name,
          assignee.fullname as assignee_name,
          assignee.avatar as assignee_avatar
        FROM tasks t
        LEFT JOIN users creator ON t.created_by = creator.id
        LEFT JOIN users assignee ON t.assigned_to = assignee.id
        WHERE t.project_id = ?
        ORDER BY t.status = 'completed', t.priority = 'high' DESC, t.due_date ASC
      `, [projectId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  static findByAssignedUser(userId) {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT t.*, p.name as project_name,
          creator.fullname as creator_name
        FROM tasks t
        LEFT JOIN projects p ON t.project_id = p.id
        LEFT JOIN users creator ON t.created_by = creator.id
        WHERE t.assigned_to = ?
        ORDER BY t.status = 'completed', t.priority = 'high' DESC, t.due_date ASC
      `, [userId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  static findByCreatedUser(userId) {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT t.*, p.name as project_name,
          assignee.fullname as assignee_name,
          assignee.avatar as assignee_avatar
        FROM tasks t
        LEFT JOIN projects p ON t.project_id = p.id
        LEFT JOIN users assignee ON t.assigned_to = assignee.id
        WHERE t.created_by = ?
        ORDER BY t.status = 'completed', t.priority = 'high' DESC, t.due_date ASC
      `, [userId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  static addComment(taskId, userId, content) {
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO comments (task_id, user_id, content) VALUES (?, ?, ?)',
        [taskId, userId, content],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id: this.lastID, task_id: taskId, user_id: userId, content });
          }
        }
      );
    });
  }

  static getComments(taskId) {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT c.*, u.fullname, u.avatar
        FROM comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.task_id = ?
        ORDER BY c.created_at DESC
      `, [taskId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  static findRecentTasks(userId, limit = 5) {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT t.*, p.name as project_name
        FROM tasks t
        LEFT JOIN projects p ON t.project_id = p.id
        LEFT JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = ?
        WHERE t.assigned_to = ? OR t.created_by = ? OR pm.user_id = ?
        ORDER BY t.created_at DESC
        LIMIT ?
      `, [userId, userId, userId, userId, limit], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }
}

module.exports = Task; 