const db = require('./database');
const bcrypt = require('bcrypt');

async function seedDatabase() {
  console.log('Starting database seeding...');
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  db.serialize(() => {
    db.run('DELETE FROM comments');
    db.run('DELETE FROM project_members');
    db.run('DELETE FROM tasks');
    db.run('DELETE FROM projects');
    db.run('DELETE FROM users');
    db.run('DELETE FROM landing_content');
    
    db.run('DELETE FROM sqlite_sequence WHERE name="users"');
    db.run('DELETE FROM sqlite_sequence WHERE name="projects"');
    db.run('DELETE FROM sqlite_sequence WHERE name="tasks"');
    db.run('DELETE FROM sqlite_sequence WHERE name="project_members"');
    db.run('DELETE FROM sqlite_sequence WHERE name="comments"');
    db.run('DELETE FROM sqlite_sequence WHERE name="landing_content"');

    db.run(`INSERT INTO users (username, password, fullname, email, role) 
      VALUES 
      ('admin', ?, 'Admin User', 'admin@proman.com', 'admin'),
      ('pm1', ?, 'Project Manager One', 'pm1@proman.com', 'project_manager'),
      ('pm2', ?, 'Project Manager Two', 'pm2@proman.com', 'project_manager'),
      ('member1', ?, 'Team Member One', 'member1@proman.com', 'team_member'),
      ('member2', ?, 'Team Member Two', 'member2@proman.com', 'team_member'),
      ('member3', ?, 'Team Member Three', 'member3@proman.com', 'team_member')`,
      [hashedPassword, hashedPassword, hashedPassword, hashedPassword, hashedPassword, hashedPassword],
      function(err) {
        if (err) {
          console.error('Error seeding users:', err.message);
        } else {
          console.log('Users seeded successfully');
          seedProjects();
        }
      }
    );
  });

  function seedProjects() {
    db.run(`INSERT INTO projects (name, description, start_date, end_date, status, created_by) 
      VALUES 
      ('Website Redesign', 'Redesign company website with modern UI/UX', '2025-01-01', '2025-03-31', 'active', 2),
      ('Mobile App Development', 'Create a mobile app for both iOS and Android', '2025-02-15', '2025-06-30', 'active', 2),
      ('Database Migration', 'Migrate from SQL Server to PostgreSQL', '2025-03-10', '2025-04-30', 'completed', 3)`,
      function(err) {
        if (err) {
          console.error('Error seeding projects:', err.message);
        } else {
          console.log('Projects seeded successfully');
          seedTasks();
        }
      }
    );
  }

  function seedTasks() {
    db.run(`INSERT INTO tasks (project_id, name, description, status, priority, start_date, due_date, created_by, assigned_to, progress) 
      VALUES 
      (1, 'Design Homepage', 'Create wireframe and design for homepage', 'in_progress', 'high', '2025-01-05', '2025-01-20', 2, 4, 75),
      (1, 'Develop Homepage', 'Implement homepage design with HTML/CSS', 'pending', 'medium', '2025-01-21', '2025-02-10', 2, 5, 0),
      (1, 'Design About Page', 'Create wireframe and design for about page', 'completed', 'medium', '2025-01-05', '2025-01-15', 2, 4, 100),
      (2, 'Setup React Native', 'Initialize React Native project and dependencies', 'in_progress', 'high', '2025-02-16', '2025-02-28', 2, 6, 50),
      (2, 'Design User Interface', 'Create app UI design in Figma', 'pending', 'high', '2025-03-01', '2025-03-15', 2, 4, 0),
      (3, 'Data Schema Planning', 'Plan migration data schema', 'completed', 'high', '2025-03-10', '2025-03-20', 3, 5, 100),
      (3, 'Test Migration Script', 'Test migration script with sample data', 'completed', 'medium', '2025-03-21', '2025-04-05', 3, 6, 100)`,
      function(err) {
        if (err) {
          console.error('Error seeding tasks:', err.message);
        } else {
          console.log('Tasks seeded successfully');
          seedProjectMembers();
        }
      }
    );
  }

  function seedProjectMembers() {
    db.run(`INSERT INTO project_members (project_id, user_id, role) 
      VALUES 
      (1, 2, 'manager'),
      (1, 4, 'member'),
      (1, 5, 'member'),
      (2, 2, 'manager'),
      (2, 4, 'member'),
      (2, 6, 'member'),
      (3, 3, 'manager'),
      (3, 5, 'member'),
      (3, 6, 'member')`,
      function(err) {
        if (err) {
          console.error('Error seeding project members:', err.message);
        } else {
          console.log('Project members seeded successfully');
          seedComments();
        }
      }
    );
  }

  function seedComments() {
    db.run(`INSERT INTO comments (task_id, user_id, content) 
      VALUES 
      (1, 2, 'Please make sure to follow our brand guidelines'),
      (1, 4, 'First draft completed, awaiting feedback'),
      (3, 4, 'Design completed and approved'),
      (3, 2, 'Great work, moving to development phase'),
      (6, 3, 'Schema planning completed, ready for implementation'),
      (6, 5, 'All looks good to me')`,
      function(err) {
        if (err) {
          console.error('Error seeding comments:', err.message);
        } else {
          console.log('Comments seeded successfully');
          seedLandingContent();
        }
      }
    );
  }

  function seedLandingContent() {
    db.run(`INSERT INTO landing_content (section, title, content, image, button_text, button_link, order_num, updated_by) 
      VALUES 
      ('hero', 'Project Management Made Simple', 'ProMan helps teams organize work efficiently and deliver projects on time.', 'hero.svg', 'Get Started', '/auth/register', 1, 1),
      ('feature', 'Task Tracking', 'Easily track task progress and status in real-time.', 'task-tracking.svg', 'Learn More', '#features', 2, 1),
      ('feature', 'Team Collaboration', 'Collaborate with your team members seamlessly.', 'collaboration.svg', 'Learn More', '#features', 3, 1),
      ('feature', 'Project Analytics', 'Get insights into project performance and team productivity.', 'analytics.svg', 'Learn More', '#features', 4, 1),
      ('cta', 'Ready to boost your team productivity?', 'Start using ProMan today and see the difference in how your projects are managed.', null, 'Sign Up Now', '/auth/register', 5, 1)`,
      function(err) {
        if (err) {
          console.error('Error seeding landing content:', err.message);
        } else {
          console.log('Landing content seeded successfully');
          console.log('Database seeding completed!');
        }
      }
    );
  }
}

seedDatabase().catch(err => {
  console.error('Seeding error:', err);
}); 