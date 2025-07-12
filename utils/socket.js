module.exports = function(io) {
  const userConnections = {};
  
  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);
    socket.on('auth', (userId) => {
      if (userId) {
        socket.join(`user-${userId}`);
        if (!userConnections[userId]) {
          userConnections[userId] = [];
        }
        userConnections[userId].push(socket.id);
        
        console.log(`User ${userId} authenticated with socket ${socket.id}`);
      }
    });

    socket.on('join-project', (projectId) => {
      if (projectId) {
        socket.join(`project-${projectId}`);
        console.log(`Socket ${socket.id} joined project-${projectId}`);
      }
    });
    
    socket.on('leave-project', (projectId) => {
      if (projectId) {
        socket.leave(`project-${projectId}`);
        console.log(`Socket ${socket.id} left project-${projectId}`);
      }
    });
    
    socket.on('join-task', (taskId) => {
      if (taskId) {
        socket.join(`task-${taskId}`);
        console.log(`Socket ${socket.id} joined task-${taskId}`);
      }
    });
    
    socket.on('leave-task', (taskId) => {
      if (taskId) {
        socket.leave(`task-${taskId}`);
        console.log(`Socket ${socket.id} left task-${taskId}`);
      }
    });
    
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      
      for (const userId in userConnections) {
        const index = userConnections[userId].indexOf(socket.id);
        if (index !== -1) {
          userConnections[userId].splice(index, 1);
          console.log(`Removed socket ${socket.id} from user ${userId}`);
          if (userConnections[userId].length === 0) {
            delete userConnections[userId];
          }
          break;
        }
      }
    });
  });
  return {
    emitProjectUpdate: (projectId, data) => {
      io.to(`project-${projectId}`).emit('project-update', data);
    },
    emitTaskUpdate: (taskId, projectId, data) => {
      io.to(`task-${taskId}`).emit('task-update', data);
      io.to(`project-${projectId}`).emit('project-task-update', {
        taskId,
        ...data
      });
    },
    emitNewComment: (taskId, projectId, commentData) => {
      io.to(`task-${taskId}`).emit('new-comment', commentData);
      io.to(`project-${projectId}`).emit('project-notification', {
        type: 'comment',
        taskId,
        ...commentData
      });
    },
    emitUserNotification: (userId, notification) => {
      io.to(`user-${userId}`).emit('notification', notification);
    },
    emitTaskAssignment: (userId, taskData) => {
      io.to(`user-${userId}`).emit('task-assigned', taskData);
    },
    emitProjectInvitation: (userId, projectData) => {
      io.to(`user-${userId}`).emit('project-invitation', projectData);
    }
  };
}; 