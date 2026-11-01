import { api } from './api.js';
import { auth } from './auth.js';

class StateStore {
  constructor() {
    this.boards = [];
    this.activeBoard = null;
    this.users = [];
    this.currentView = 'kanban';
    this.searchQuery = '';
    this.filterPriority = 'all';
    this.filterAssignee = 'all';
    this.filterTag = 'all';
    this.activities = [];
    this.isSyncing = false;
    this.listeners = [];
  }

  async loadInitialData() {
    this.isSyncing = true;
    this.notify('sync');

    try {
      const [users, boards, activities] = await Promise.all([
        api.getUsers(),
        api.getBoards(),
        api.getActivity()
      ]);

      this.users = users;
      this.boards = boards;
      this.activities = activities;

      auth.init(users);

      const savedBoardId = localStorage.getItem('pulseflow_board_id');
      const targetBoard = boards.find(b => b.id === savedBoardId) || boards[0];

      if (targetBoard) {
        await this.selectBoard(targetBoard.id);
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
    } finally {
      this.isSyncing = false;
      this.notify('all');
    }
  }

  async selectBoard(boardId) {
    this.isSyncing = true;
    this.notify('sync');

    try {
      const board = await api.getBoard(boardId);
      this.activeBoard = board;
      localStorage.setItem('pulseflow_board_id', boardId);
      this.notify('board_changed');
    } catch (err) {
      console.error('Error selecting board:', err);
    } finally {
      this.isSyncing = false;
      this.notify('sync');
    }
  }

  async refreshBoard() {
    if (!this.activeBoard) return;
    try {
      this.isSyncing = true;
      this.notify('sync');
      const board = await api.getBoard(this.activeBoard.id);
      this.activeBoard = board;
      this.boards = await api.getBoards();
      this.activities = await api.getActivity();
      this.notify('board_changed');
    } catch (err) {
      console.error('Error refreshing board:', err);
    } finally {
      this.isSyncing = false;
      this.notify('sync');
    }
  }

  setView(viewName) {
    if (['kanban', 'table', 'timeline', 'metrics'].includes(viewName)) {
      this.currentView = viewName;
      this.notify('view_changed');
    }
  }

  setSearch(query) {
    this.searchQuery = (query || '').toLowerCase().trim();
    this.notify('filter_changed');
  }

  setFilterPriority(priority) {
    this.filterPriority = priority;
    this.notify('filter_changed');
  }

  setFilterAssignee(assigneeId) {
    this.filterAssignee = assigneeId;
    this.notify('filter_changed');
  }

  setFilterTag(tag) {
    this.filterTag = tag;
    this.notify('filter_changed');
  }

  resetFilters() {
    this.searchQuery = '';
    this.filterPriority = 'all';
    this.filterAssignee = 'all';
    this.filterTag = 'all';
    this.notify('filter_changed');
  }

  getFilteredTasks() {
    if (!this.activeBoard || !this.activeBoard.tasks) return [];
    return this.activeBoard.tasks.filter(task => {
      if (this.filterPriority !== 'all' && task.priority !== this.filterPriority) {
        return false;
      }
      if (this.filterAssignee !== 'all') {
        if (this.filterAssignee === 'unassigned' && task.assigneeId) return false;
        if (this.filterAssignee !== 'unassigned' && task.assigneeId !== this.filterAssignee) return false;
      }
      if (this.filterTag !== 'all') {
        if (!task.tags || !task.tags.includes(this.filterTag)) return false;
      }
      if (this.searchQuery) {
        const titleMatch = task.title.toLowerCase().includes(this.searchQuery);
        const descMatch = (task.description || '').toLowerCase().includes(this.searchQuery);
        const tagMatch = (task.tags || []).some(t => t.toLowerCase().includes(this.searchQuery));
        const assignee = this.users.find(u => u.id === task.assigneeId);
        const assigneeMatch = assignee && assignee.name.toLowerCase().includes(this.searchQuery);

        if (!titleMatch && !descMatch && !tagMatch && !assigneeMatch) {
          return false;
        }
      }
      return true;
    });
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify(event) {
    this.listeners.forEach(fn => {
      try {
        fn(event, this);
      } catch (err) {
        console.error('Listener notification error:', err);
      }
    });
  }
}

export const state = new StateStore();
