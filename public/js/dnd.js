import { state } from './state.js';
import { auth } from './auth.js';
import { api } from './api.js';

let draggedTaskId = null;
let draggedColumnId = null;
let activeDropIndicator = null;

export const dnd = {
  initCard(cardElement, task) {
    const canMove = auth.can('move_task');

    if (!canMove) {
      cardElement.setAttribute('draggable', 'false');
      cardElement.classList.add('cursor-default');
      return;
    }

    cardElement.setAttribute('draggable', 'true');
    cardElement.classList.add('cursor-grab');

    cardElement.addEventListener('dragstart', (e) => {
      if (!auth.can('move_task')) {
        e.preventDefault();
        window.showToast?.('Permission Denied: Viewer role cannot move tasks.', 'warning');
        return;
      }

      draggedTaskId = task.id;
      draggedColumnId = null;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'task', id: task.id }));

      setTimeout(() => {
        cardElement.classList.add('dragging');
      }, 0);
    });

    cardElement.addEventListener('dragend', () => {
      cardElement.classList.remove('dragging');
      draggedTaskId = null;
      removeDropIndicator();
      document.querySelectorAll('.kanban-column').forEach(col => col.classList.remove('drag-over'));
    });
  },

  initColumnDropZone(columnElement, listId) {
    const cardListContainer = columnElement.querySelector('.card-list-container') || columnElement;

    columnElement.addEventListener('dragover', (e) => {
      if (!draggedTaskId) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      columnElement.classList.add('drag-over');

      const afterElement = getDragAfterElement(cardListContainer, e.clientY);
      updateDropIndicator(cardListContainer, afterElement);
    });

    columnElement.addEventListener('dragleave', (e) => {
      if (!columnElement.contains(e.relatedTarget)) {
        columnElement.classList.remove('drag-over');
      }
    });

    columnElement.addEventListener('drop', async (e) => {
      if (!draggedTaskId) return;
      e.preventDefault();
      columnElement.classList.remove('drag-over');

      const taskId = draggedTaskId;
      draggedTaskId = null;

      const afterElement = getDragAfterElement(cardListContainer, e.clientY);
      removeDropIndicator();

      if (!auth.can('move_task')) {
        window.showToast?.('Permission Denied: Viewers cannot move tasks.', 'error');
        return;
      }

      const targetListTasks = (state.activeBoard.tasks || [])
        .filter(t => t.listId === listId && t.id !== taskId)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

      let targetIndex = targetListTasks.length;
      if (afterElement) {
        const afterTaskId = afterElement.getAttribute('data-task-id');
        const foundIdx = targetListTasks.findIndex(t => t.id === afterTaskId);
        if (foundIdx !== -1) {
          targetIndex = foundIdx;
        }
      }

      const task = state.activeBoard.tasks.find(t => t.id === taskId);
      if (task) {
        const prevListId = task.listId;
        task.listId = listId;

        state.notify('board_changed');

        try {
          const user = auth.getCurrentUser();
          await api.moveTask(state.activeBoard.id, taskId, listId, targetIndex, user.id);
          window.showToast?.(`Task moved successfully`, 'success');
          await state.refreshBoard();
        } catch (err) {
          console.error('Failed to persist task move:', err);
          task.listId = prevListId;
          state.notify('board_changed');
          window.showToast?.(`Error moving task: ${err.message}`, 'error');
        }
      }
    });
  },

  initColumnHeaderDrag(headerElement, columnElement, listId) {
    if (!auth.can('reorder_list')) return;

    headerElement.setAttribute('draggable', 'true');
    headerElement.classList.add('cursor-move');

    headerElement.addEventListener('dragstart', (e) => {
      draggedColumnId = listId;
      draggedTaskId = null;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'column', id: listId }));
      columnElement.classList.add('column-dragging');
    });

    headerElement.addEventListener('dragend', () => {
      columnElement.classList.remove('column-dragging');
      draggedColumnId = null;
    });

    columnElement.addEventListener('dragover', (e) => {
      if (!draggedColumnId || draggedColumnId === listId) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    });

    columnElement.addEventListener('drop', async (e) => {
      if (!draggedColumnId || draggedColumnId === listId) return;
      e.preventDefault();

      const sourceId = draggedColumnId;
      draggedColumnId = null;

      const currentLists = [...state.activeBoard.lists].sort((a, b) => a.order - b.order);
      const sourceIdx = currentLists.findIndex(l => l.id === sourceId);
      const targetIdx = currentLists.findIndex(l => l.id === listId);

      if (sourceIdx === -1 || targetIdx === -1) return;

      const [removed] = currentLists.splice(sourceIdx, 1);
      currentLists.splice(targetIdx, 0, removed);

      const listIds = currentLists.map(l => l.id);
      state.activeBoard.lists = currentLists.map((l, idx) => ({ ...l, order: idx }));
      state.notify('board_changed');

      try {
        const user = auth.getCurrentUser();
        await api.reorderLists(state.activeBoard.id, listIds, user.id);
        window.showToast?.('Columns reordered', 'success');
      } catch (err) {
        console.error('Failed to reorder columns:', err);
        window.showToast?.(err.message, 'error');
        await state.refreshBoard();
      }
    });
  }
};

function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll('.task-card:not(.dragging)')];

  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) {
      return { offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function updateDropIndicator(container, afterElement) {
  removeDropIndicator();

  const indicator = document.createElement('div');
  indicator.className = 'drop-indicator';
  activeDropIndicator = indicator;

  if (afterElement) {
    container.insertBefore(indicator, afterElement);
  } else {
    container.appendChild(indicator);
  }
}

function removeDropIndicator() {
  if (activeDropIndicator && activeDropIndicator.parentNode) {
    activeDropIndicator.parentNode.removeChild(activeDropIndicator);
    activeDropIndicator = null;
  }
}
