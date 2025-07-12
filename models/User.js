const db = require('../config/database');
const bcrypt = require('bcrypt');

class User {
  static findById(id) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  static findByUsername(username) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  static findByEmail(email) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  static async create(userData) {
    const { username, password, fullname, email, role } = userData;
    const hashedPassword = await bcrypt.hash(password, 10);

    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO users (username, password, fullname, email, role) VALUES (?, ?, ?, ?, ?)',
        [username, hashedPassword, fullname, email, role],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id: this.lastID, username, fullname, email, role });
          }
        }
      );
    });
  }

  static update(id, userData) {
    const { fullname, email, avatar } = userData;
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE users SET fullname = ?, email = ?, avatar = ? WHERE id = ?',
        [fullname, email, avatar, id],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id, fullname, email, avatar });
          }
        }
      );
    });
  }

  static async updatePassword(id, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE users SET password = ? WHERE id = ?',
        [hashedPassword, id],
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

  static delete(id) {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM users WHERE id = ?', [id], function(err) {
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
      db.all('SELECT id, username, fullname, email, role, avatar, created_at FROM users', [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  static findByRole(role) {
    return new Promise((resolve, reject) => {
      db.all('SELECT id, username, fullname, email, role, avatar FROM users WHERE role = ?', [role], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  static async authenticate(username, password) {
    try {
      const user = await this.findByUsername(username);
      
      if (!user) {
        return null;
      }
      
      const isMatch = await bcrypt.compare(password, user.password);
      
      if (!isMatch) {
        return null;
      }
      
      return {
        id: user.id,
        username: user.username,
        fullname: user.fullname,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      };
    } catch (err) {
      console.error('Authentication error:', err);
      return null;
    }
  }
}

module.exports = User; 