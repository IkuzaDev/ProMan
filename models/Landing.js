const db = require('../config/database');

class Landing {
  static getAllContent() {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT * FROM landing_content
        ORDER BY order_num ASC
      `, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  static getContentBySection(section) {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT * FROM landing_content
        WHERE section = ?
        ORDER BY order_num ASC
      `, [section], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  static getContentById(id) {
    return new Promise((resolve, reject) => {
      db.get(`
        SELECT * FROM landing_content
        WHERE id = ?
      `, [id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  static createContent(contentData) {
    const { section, title, content, image, button_text, button_link, order_num, updated_by } = contentData;
    
    return new Promise((resolve, reject) => {
      db.run(`
        INSERT INTO landing_content (
          section, title, content, image, button_text, button_link, order_num, updated_by, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `, [section, title, content, image, button_text, button_link, order_num, updated_by], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, section, title, content, image, button_text, button_link, order_num });
        }
      });
    });
  }

  static updateContent(id, contentData) {
    const { title, content, image, button_text, button_link, updated_by } = contentData;
    
    return new Promise((resolve, reject) => {
      db.run(`
        UPDATE landing_content SET
          title = ?, content = ?, image = ?, button_text = ?, button_link = ?,
          updated_by = ?, updated_at = datetime('now')
        WHERE id = ?
      `, [title, content, image, button_text, button_link, updated_by, id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id, title, content, image, button_text, button_link });
        }
      });
    });
  }

  static updateOrder(id, order_num, updated_by) {
    return new Promise((resolve, reject) => {
      db.run(`
        UPDATE landing_content SET
          order_num = ?, updated_by = ?, updated_at = datetime('now')
        WHERE id = ?
      `, [order_num, updated_by, id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id, order_num });
        }
      });
    });
  }

  static deleteContent(id) {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM landing_content WHERE id = ?', [id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ success: true });
        }
      });
    });
  }

  static getHeroSection() {
    return new Promise((resolve, reject) => {
      db.get(`
        SELECT * FROM landing_content
        WHERE section = 'hero'
        ORDER BY order_num ASC
        LIMIT 1
      `, [], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  static getFeatures() {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT * FROM landing_content
        WHERE section = 'feature'
        ORDER BY order_num ASC
      `, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  static getCtaSection() {
    return new Promise((resolve, reject) => {
      db.get(`
        SELECT * FROM landing_content
        WHERE section = 'cta'
        ORDER BY order_num ASC
        LIMIT 1
      `, [], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }
}

module.exports = Landing; 