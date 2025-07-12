document.addEventListener('DOMContentLoaded', function() {
  const htmlElement = document.documentElement;
  const themeToggle = document.getElementById('theme-toggle');
  const savedTheme = localStorage.getItem('theme') || 'light';
  if (savedTheme === 'dark') {
    htmlElement.classList.add('dark');
  } else {
    htmlElement.classList.remove('dark');
  }
  if (themeToggle) {
    themeToggle.addEventListener('click', function() {
      const currentTheme = htmlElement.classList.contains('dark') ? 'dark' : 'light';
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      
      if (newTheme === 'dark') {
        htmlElement.classList.add('dark');
      } else {
        htmlElement.classList.remove('dark');
      }
      
      localStorage.setItem('theme', newTheme);
    });
  }
  const taskStatusSelects = document.querySelectorAll('.task-status-select');
  taskStatusSelects.forEach(select => {
    select.addEventListener('change', function() {
      const taskId = this.dataset.taskId;
      const projectId = this.dataset.projectId;
      const status = this.value;
      
      fetch(`/pm/tasks/${taskId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          updateTaskStatusUI(taskId, status);
          showNotification({
            title: 'Status Updated',
            text: 'Task status has been successfully updated',
            type: 'success'
          });
        }
      })
      .catch(error => {
        console.error('Error updating task status:', error);
        showNotification({
          title: 'Update Failed',
          text: 'Failed to update task status',
          type: 'error'
        });
      });
    });
  });
  
  const taskProgressInputs = document.querySelectorAll('.task-progress-input');
  taskProgressInputs.forEach(input => {
    input.addEventListener('change', function() {
      const taskId = this.dataset.taskId;
      const progress = this.value;
      
      fetch(`/pm/tasks/${taskId}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ progress }),
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          updateTaskProgressUI(taskId, progress);
          showNotification({
            title: 'Progress Updated',
            text: 'Task progress has been successfully updated',
            type: 'success'
          });
        }
      })
      .catch(error => {
        console.error('Error updating task progress:', error);
        showNotification({
          title: 'Update Failed',
          text: 'Failed to update task progress',
          type: 'error'
        });
      });
    });
  });
  
  const kanbanBoard = document.getElementById('kanban-board');
  if (kanbanBoard) {
    initializeKanban();
  }
});

function updateTaskStatusUI(taskId, status) {
  const statusBadge = document.querySelector(`.task-card[data-task-id="${taskId}"] .status-badge`);
  if (statusBadge) {
    statusBadge.classList.remove('bg-yellow-100', 'text-yellow-800', 'bg-blue-100', 'text-blue-800', 'bg-green-100', 'text-green-800');
    
    switch(status) {
      case 'pending':
        statusBadge.classList.add('bg-yellow-100', 'text-yellow-800');
        statusBadge.textContent = 'Pending';
        break;
      case 'in_progress':
        statusBadge.classList.add('bg-blue-100', 'text-blue-800');
        statusBadge.textContent = 'In Progress';
        break;
      case 'completed':
        statusBadge.classList.add('bg-green-100', 'text-green-800');
        statusBadge.textContent = 'Completed';
        break;
    }
  }
  
  const statusSelect = document.querySelector(`.task-status-select[data-task-id="${taskId}"]`);
  if (statusSelect && statusSelect.value !== status) {
    statusSelect.value = status;
  }
  
  moveTaskCard(taskId, status);
}

function updateTaskProgressUI(taskId, progress) {
  const progressBar = document.querySelector(`.task-card[data-task-id="${taskId}"] .progress-bar`);
  if (progressBar) {
    progressBar.style.width = `${progress}%`;
  }
  
  const progressText = document.querySelector(`.task-card[data-task-id="${taskId}"] .progress-text`);
  if (progressText) {
    progressText.textContent = `${progress}%`;
  }
  
  const progressInput = document.querySelector(`.task-progress-input[data-task-id="${taskId}"]`);
  if (progressInput && progressInput.value !== progress) {
    progressInput.value = progress;
  }
}

function showNotification(options) {
  const { title, text, type } = options;
  
  Swal.fire({
    title: title,
    text: text,
    icon: type || 'info',
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true
  });
}

function updateProjectElement(projectElement, projectData) {
  const projectNameElem = projectElement.querySelector('.project-name');
  if (projectNameElem) {
    projectNameElem.textContent = projectData.name;
  }
  
  const projectDescElem = projectElement.querySelector('.project-description');
  if (projectDescElem) {
    projectDescElem.textContent = projectData.description;
  }
  
  const projectStatusElem = projectElement.querySelector('.project-status');
  if (projectStatusElem) {
    projectStatusElem.textContent = projectData.status;
    
    if (projectData.status === 'active') {
      projectStatusElem.classList.add('bg-green-100', 'text-green-800');
      projectStatusElem.classList.remove('bg-gray-100', 'text-gray-800');
    } else {
      projectStatusElem.classList.add('bg-gray-100', 'text-gray-800');
      projectStatusElem.classList.remove('bg-green-100', 'text-green-800');
    }
  }
  
  showNotification({
    title: 'Project Updated',
    text: `Project "${projectData.name}" has been updated`,
    type: 'info'
  });
}

function updateTaskElement(taskElement, data) {
  switch(data.type) {
    case 'status':
      updateTaskStatusUI(data.taskId, data.status);
      break;
    case 'progress':
      updateTaskProgressUI(data.taskId, data.progress);
      break;
    case 'update':
      const taskNameElem = taskElement.querySelector('.task-name');
      if (taskNameElem) {
        taskNameElem.textContent = data.task.name;
      }
      
      const taskDescElem = taskElement.querySelector('.task-description');
      if (taskDescElem) {
        taskDescElem.textContent = data.task.description;
      }
      
      if (data.task.status) {
        updateTaskStatusUI(data.taskId, data.task.status);
      }
      
      if (data.task.progress !== undefined) {
        updateTaskProgressUI(data.taskId, data.task.progress);
      }
      
      showNotification({
        title: 'Task Updated',
        text: `Task "${data.task.name}" has been updated`,
        type: 'info'
      });
      break;
    case 'delete':
      if (taskElement) {
        taskElement.remove();
        
        showNotification({
          title: 'Task Deleted',
          text: 'The task has been deleted',
          type: 'info'
        });
      }
      break;
  }
}

function initializeKanban() {
  const columns = document.querySelectorAll('.kanban-column');
  
  columns.forEach(column => {
    column.addEventListener('dragover', e => {
      e.preventDefault();
      column.classList.add('bg-gray-50');
    });
    
    column.addEventListener('dragleave', e => {
      column.classList.remove('bg-gray-50');
    });
    
    column.addEventListener('drop', e => {
      e.preventDefault();
      column.classList.remove('bg-gray-50');
      
      const taskId = e.dataTransfer.getData('text/plain');
      const taskCard = document.getElementById(`task-${taskId}`);
      const newStatus = column.dataset.status;
      
      if (taskCard) {
        column.querySelector('.kanban-tasks').appendChild(taskCard);
        
        fetch(`/pm/tasks/${taskId}/status`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: newStatus }),
        })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            updateTaskStatusUI(taskId, newStatus);
            
            showNotification({
              title: 'Status Updated',
              text: 'Task status has been successfully updated',
              type: 'success'
            });
          }
        })
        .catch(error => {
          console.error('Error updating task status:', error);
          showNotification({
            title: 'Update Failed',
            text: 'Failed to update task status',
            type: 'error'
          });
        });
      }
    });
  });
  
  const taskCards = document.querySelectorAll('.kanban-task');
  taskCards.forEach(card => {
    card.setAttribute('draggable', true);
    
    card.addEventListener('dragstart', e => {
      e.dataTransfer.setData('text/plain', card.dataset.taskId);
      card.classList.add('opacity-50');
    });
    
    card.addEventListener('dragend', e => {
      card.classList.remove('opacity-50');
    });
  });
}

function moveTaskCard(taskId, status) {
  const kanbanBoard = document.getElementById('kanban-board');
  if (!kanbanBoard) return;
  
  const taskCard = document.querySelector(`.kanban-task[data-task-id="${taskId}"]`);
  if (!taskCard) return;
  
  const targetColumn = document.querySelector(`.kanban-column[data-status="${status}"] .kanban-tasks`);
  if (targetColumn) {
    targetColumn.appendChild(taskCard);
  }
}