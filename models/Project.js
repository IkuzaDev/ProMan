const db = require('../config/database');

class Project {
  static findById(id) {
    return new Promise((resolve, reject) => {
      db.get(`
        SELECT p.*, u.fullname as creator_name 
        FROM projects p
        LEFT JOIN users u ON p.created_by = u.id
        WHERE p.id = ?
      `, [id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  static create(projectData) {
    const { name, description, start_date, end_date, created_by } = projectData;
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO projects (name, description, start_date, end_date, created_by) VALUES (?, ?, ?, ?, ?)',
        [name, description, start_date, end_date, created_by],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id: this.lastID, name, description, start_date, end_date, created_by });
          }
        }
      );
    });
  }

  static update(id, projectData) {
    const { name, description, start_date, end_date, status } = projectData;
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE projects SET name = ?, description = ?, start_date = ?, end_date = ?, status = ? WHERE id = ?',
        [name, description, start_date, end_date, status, id],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id, name, description, start_date, end_date, status });
          }
        }
      );
    });
  }

  static delete(id) {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM projects WHERE id = ?', [id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ success: true });
        }
      });
    });
  }

  static findAll() {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT p.*, u.fullname as creator_name,
          (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count,
          (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'completed') as completed_tasks
        FROM projects p
        LEFT JOIN users u ON p.created_by = u.id
        ORDER BY p.created_at DESC
      `, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  static findByUserId(userId) {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT p.*, u.fullname as creator_name,
          (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count,
          (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'completed') as completed_tasks
        FROM projects p
        LEFT JOIN users u ON p.created_by = u.id
        LEFT JOIN project_members pm ON p.id = pm.project_id
        WHERE p.created_by = ? OR pm.user_id = ?
        GROUP BY p.id
        ORDER BY p.created_at DESC
      `, [userId, userId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  static findMembers(projectId) {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT u.id, u.username, u.fullname, u.email, u.avatar, pm.role as project_role
        FROM users u
        JOIN project_members pm ON u.id = pm.user_id
        WHERE pm.project_id = ?
        ORDER BY pm.role DESC, u.fullname ASC
      `, [projectId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  static addMember(projectId, userId, role = 'member') {
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)',
        [projectId, userId, role],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id: this.lastID, project_id: projectId, user_id: userId, role });
          }
        }
      );
    });
  }

  static removeMember(projectId, userId) {
    return new Promise((resolve, reject) => {
      db.run(
        'DELETE FROM project_members WHERE project_id = ? AND user_id = ?',
        [projectId, userId],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ success: true });
          }
        }
      );
    });
  }

  static getProgress(projectId) {
    return new Promise((resolve, reject) => {
      db.get(`
        SELECT 
          COUNT(*) as total_tasks,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
          CASE
            WHEN COUNT(*) > 0 THEN ROUND((SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) * 100.0 / COUNT(*)), 0)
            ELSE 0
          END as progress_percentage
        FROM tasks
        WHERE project_id = ?
      `, [projectId], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  static findUserProjects(userId) {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT p.id, p.name
        FROM projects p
        LEFT JOIN project_members pm ON p.id = pm.project_id
        WHERE p.created_by = ? OR pm.user_id = ?
        GROUP BY p.id
        ORDER BY p.name ASC
      `, [userId, userId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }
}

module.exports = Project; 