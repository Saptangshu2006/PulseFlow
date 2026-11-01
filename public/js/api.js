const API_BASE = '/api';

export const api = {
  async getHealth() {
    const res = await fetch(`${API_BASE}/health`);
    return res.json();
  },

  async getUsers() {
    const res = await fetch(`${API_BASE}/users`);
    return res.json();
  },

  async createUser(userData, requestingUserId) {
    const res = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...userData, requestingUserId })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create user');
    }
    return res.json();
  },

  async updateUser(userId, userData, requestingUserId) {
    const res = await fetch(`${API_BASE}/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...userData, requestingUserId })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update user');
    }
    return res.json();
  },

  async getBoards() {
    const res = await fetch(`${API_BASE}/boards`);
    return res.json();
  },

  async getBoard(boardId) {
    const res = await fetch(`${API_BASE}/boards/${boardId}`);
    if (!res.ok) throw new Error('Board not found');
    return res.json();
  },

  async createBoard(boardData, requestingUserId) {
    const res = await fetch(`${API_BASE}/boards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...boardData, requestingUserId })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create board');
    }
    return res.json();
  },

  async updateBoard(boardId, boardData, requestingUserId) {
    const res = await fetch(`${API_BASE}/boards/${boardId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...boardData, requestingUserId })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update board');
    }
    return res.json();
  },

  async deleteBoard(boardId, requestingUserId) {
    const res = await fetch(`${API_BASE}/boards/${boardId}?requestingUserId=${encodeURIComponent(requestingUserId)}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to delete board');
    }
    return res.json();
  },

  async createList(boardId, listData, requestingUserId) {
    const res = await fetch(`${API_BASE}/boards/${boardId}/lists`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...listData, requestingUserId })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to add column');
    }
    return res.json();
  },

  async updateList(boardId, listId, listData, requestingUserId) {
    const res = await fetch(`${API_BASE}/boards/${boardId}/lists/${listId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...listData, requestingUserId })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update column');
    }
    return res.json();
  },

  async deleteList(boardId, listId, requestingUserId) {
    const res = await fetch(`${API_BASE}/boards/${boardId}/lists/${listId}?requestingUserId=${encodeURIComponent(requestingUserId)}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to delete column');
    }
    return res.json();
  },

  async reorderLists(boardId, listIds, requestingUserId) {
    const res = await fetch(`${API_BASE}/boards/${boardId}/lists/reorder`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listIds, requestingUserId })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to reorder columns');
    }
    return res.json();
  },

  async createTask(boardId, taskData, requestingUserId) {
    const res = await fetch(`${API_BASE}/boards/${boardId}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...taskData, requestingUserId })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create task');
    }
    return res.json();
  },

  async updateTask(boardId, taskId, taskData, requestingUserId) {
    const res = await fetch(`${API_BASE}/boards/${boardId}/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...taskData, requestingUserId })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update task');
    }
    return res.json();
  },

  async moveTask(boardId, taskId, targetListId, targetIndex, requestingUserId) {
    const res = await fetch(`${API_BASE}/boards/${boardId}/tasks/${taskId}/move`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetListId, targetIndex, requestingUserId })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to move task');
    }
    return res.json();
  },

  async deleteTask(boardId, taskId, requestingUserId) {
    const res = await fetch(`${API_BASE}/boards/${boardId}/tasks/${taskId}?requestingUserId=${encodeURIComponent(requestingUserId)}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to delete task');
    }
    return res.json();
  },

  async addComment(boardId, taskId, text, requestingUserId) {
    const res = await fetch(`${API_BASE}/boards/${boardId}/tasks/${taskId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, requestingUserId })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to add comment');
    }
    return res.json();
  },

  async getActivity() {
    const res = await fetch(`${API_BASE}/activity`);
    return res.json();
  },

  async exportData() {
    window.location.href = `${API_BASE}/export`;
  },

  async importData(backupData, requestingUserId) {
    const res = await fetch(`${API_BASE}/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ backupData, requestingUserId })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to restore backup');
    }
    return res.json();
  },

  async resetDatabase(requestingUserId) {
    const res = await fetch(`${API_BASE}/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestingUserId })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to reset database');
    }
    return res.json();
  }
};
