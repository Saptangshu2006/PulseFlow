import { state } from './state.js';
import { auth, ROLE_CONFIG } from './auth.js';
import { kanbanView } from './views/kanban.js';
import { tableView } from './views/table.js';
import { timelineView } from './views/timeline.js';
import { metricsView } from './views/metrics.js';
import { cardModal } from './modals/cardModal.js';
import { boardModal } from './modals/boardModal.js';
import { userModal } from './modals/userModal.js';
import { backupModal } from './modals/backupModal.js';

window.showToast = function(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  const typeStyles = {
    success: 'bg-emerald-600 text-white',
    error: 'bg-rose-600 text-white',
    warning: 'bg-amber-500 text-white',
    info: 'bg-slate-800 text-white'
  };

  const icons = {
    success: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>',
    error: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>',
    warning: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>',
    info: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>'
  };

  toast.className = `toast shadow-xl px-4 py-2.5 rounded-2xl flex items-center gap-2.5 text-xs font-semibold ${typeStyles[type] || typeStyles.info}`;
  toast.innerHTML = `
    ${icons[type] || icons.info}
    <span>${message}</span>
  `;

  container.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 250);
  }, 3500);
};

class App {
  async init() {
    console.log('⚡ Initializing PulseFlow Project Management Dashboard...');

    state.subscribe((event) => {
      this.render();
      if (event === 'board_changed' || event === 'all' || event === 'user_switched') {
        this.updateHeader();
      }
    });

    auth.subscribe(() => {
      this.updateHeader();
      this.render();
    });

    this.bindHeaderEvents();
    this.bindKeyboardShortcuts();

    await state.loadInitialData();
  }

  updateHeader() {
    const board = state.activeBoard;
    const currentUser = auth.getCurrentUser();
    const boards = state.boards || [];
    const users = state.users || [];

    const boardDropdown = document.getElementById('board-selector-dropdown');
    if (boardDropdown && board) {
      boardDropdown.innerHTML = `
        <button id="board-dropdown-btn" class="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 transition text-slate-800 font-bold text-xs">
          <span class="w-2.5 h-2.5 rounded-full" style="background-color: ${board.color || '#4f46e5'}"></span>
          <span class="truncate max-w-[160px]">${board.title}</span>
          <svg class="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </button>

        <div id="board-dropdown-menu" class="hidden absolute top-full left-0 mt-1 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50">
          <div class="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Switch Board</div>
          ${boards.map(b => `
            <button class="w-full text-left px-3 py-2 text-xs font-semibold hover:bg-slate-50 flex items-center justify-between text-slate-700 board-switch-option ${b.id === board.id ? 'text-indigo-600 bg-indigo-50/50' : ''}"
                    data-board-id="${b.id}">
              <div class="flex items-center gap-2 truncate">
                <span class="w-2 h-2 rounded-full" style="background-color: ${b.color || '#4f46e5'}"></span>
                <span class="truncate">${b.title}</span>
              </div>
              <span class="text-[10px] font-mono text-slate-400">${b.taskCount || 0}</span>
            </button>
          `).join('')}
          <div class="border-t border-slate-100 mt-1 pt-1 px-2">
            <button id="create-new-board-btn" class="w-full text-left px-2 py-1.5 text-xs font-bold text-indigo-600 hover:bg-indigo-50 rounded-xl flex items-center gap-1.5">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
              </svg>
              New Board
            </button>
          </div>
        </div>
      `;

      const btn = boardDropdown.querySelector('#board-dropdown-btn');
      const menu = boardDropdown.querySelector('#board-dropdown-menu');
      btn?.addEventListener('click', (e) => {
        e.stopPropagation();
        menu?.classList.toggle('hidden');
      });

      boardDropdown.querySelectorAll('.board-switch-option').forEach(opt => {
        opt.addEventListener('click', () => {
          const bId = opt.getAttribute('data-board-id');
          state.selectBoard(bId);
          menu?.classList.add('hidden');
        });
      });

      boardDropdown.querySelector('#create-new-board-btn')?.addEventListener('click', () => {
        menu?.classList.add('hidden');
        boardModal.openNew();
      });
    }

    const userProfileContainer = document.getElementById('user-profile-widget');
    if (userProfileContainer && currentUser) {
      const roleCfg = ROLE_CONFIG[currentUser.role] || ROLE_CONFIG.viewer;

      userProfileContainer.innerHTML = `
        <div class="relative">
          <button id="user-persona-btn" class="flex items-center gap-2 p-1.5 pl-2 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 shadow-sm transition">
            <img src="${currentUser.avatar}" class="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200" />
            <div class="text-left hidden sm:block">
              <div class="text-xs font-bold text-slate-800 leading-none">${currentUser.name}</div>
              <div class="text-[10px] font-bold uppercase mt-0.5 inline-block px-1.5 py-0.2 rounded ${roleCfg.badgeClass}">
                ${currentUser.role}
              </div>
            </div>
            <svg class="w-3.5 h-3.5 text-slate-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </button>

          <div id="user-switcher-menu" class="hidden absolute right-0 top-full mt-1.5 w-72 bg-white border border-slate-200 rounded-3xl shadow-2xl py-3 z-50">
            <div class="px-4 pb-2 border-b border-slate-100">
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Test Role-Based Access</p>
              <p class="text-xs text-slate-600 mt-0.5">Switch user to preview permissions live:</p>
            </div>

            <div class="py-2 space-y-1">
              ${users.map(u => {
                const uRoleCfg = ROLE_CONFIG[u.role] || ROLE_CONFIG.viewer;
                const isSelected = u.id === currentUser.id;
                return `
                  <button class="w-full text-left px-4 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition switch-persona-option ${isSelected ? 'bg-indigo-50/60 font-bold text-indigo-700' : 'text-slate-700'}"
                          data-user-id="${u.id}">
                    <div class="flex items-center gap-2.5">
                      <img src="${u.avatar}" class="w-6 h-6 rounded-full object-cover" />
                      <div>
                        <div class="font-semibold text-slate-900 leading-tight">${u.name}</div>
                        <div class="text-[10px] text-slate-400 font-mono">${u.email}</div>
                      </div>
                    </div>
                    <span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${uRoleCfg.badgeClass}">
                      ${u.role}
                    </span>
                  </button>
                `;
              }).join('')}
            </div>

            <div class="border-t border-slate-100 pt-2 px-3">
              <button id="open-team-manager-btn" class="w-full text-center py-2 text-xs font-bold text-indigo-600 hover:bg-indigo-50 rounded-xl transition flex items-center justify-center gap-1.5">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                </svg>
                Manage Team & Permissions
              </button>
            </div>
          </div>
        </div>
      `;

      const btn = userProfileContainer.querySelector('#user-persona-btn');
      const menu = userProfileContainer.querySelector('#user-switcher-menu');
      btn?.addEventListener('click', (e) => {
        e.stopPropagation();
        menu?.classList.toggle('hidden');
      });

      userProfileContainer.querySelectorAll('.switch-persona-option').forEach(opt => {
        opt.addEventListener('click', () => {
          const uId = opt.getAttribute('data-user-id');
          auth.switchUser(uId, state.users);
          window.showToast?.(`Switched session to ${auth.getCurrentUser().name} (${auth.getCurrentUser().role})`, 'success');
          menu?.classList.add('hidden');
        });
      });

      userProfileContainer.querySelector('#open-team-manager-btn')?.addEventListener('click', () => {
        menu?.classList.add('hidden');
        userModal.open();
      });
    }

    const assigneeFilter = document.getElementById('filter-assignee-select');
    if (assigneeFilter) {
      assigneeFilter.innerHTML = `
        <option value="all">All Members</option>
        <option value="unassigned">Unassigned</option>
        ${users.map(u => `
          <option value="${u.id}" ${state.filterAssignee === u.id ? 'selected' : ''}>
            ${u.name}
          </option>
        `).join('')}
      `;
    }

    const syncBadge = document.getElementById('persistence-indicator');
    if (syncBadge) {
      if (state.isSyncing) {
        syncBadge.innerHTML = `
          <span class="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
          <span class="text-amber-700">Syncing to disk...</span>
        `;
      } else {
        syncBadge.innerHTML = `
          <span class="w-2 h-2 rounded-full bg-emerald-500 pulse-sync"></span>
          <span class="text-emerald-700">Disk Persistent</span>
        `;
      }
    }
  }

  bindHeaderEvents() {
    document.addEventListener('click', () => {
      document.querySelectorAll('#board-dropdown-menu, #user-switcher-menu').forEach(m => m.classList.add('hidden'));
    });

    document.querySelectorAll('.view-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const view = btn.getAttribute('data-view');
        state.setView(view);

        document.querySelectorAll('.view-tab-btn').forEach(b => {
          b.classList.remove('bg-white', 'text-indigo-600', 'shadow-sm');
          b.classList.add('text-slate-600', 'hover:text-slate-900');
        });
        btn.classList.add('bg-white', 'text-indigo-600', 'shadow-sm');
        btn.classList.remove('text-slate-600');
      });
    });

    const searchInput = document.getElementById('global-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        state.setSearch(e.target.value);
      });
    }

    const prioritySelect = document.getElementById('filter-priority-select');
    if (prioritySelect) {
      prioritySelect.addEventListener('change', (e) => {
        state.setFilterPriority(e.target.value);
      });
    }

    const assigneeSelect = document.getElementById('filter-assignee-select');
    if (assigneeSelect) {
      assigneeSelect.addEventListener('change', (e) => {
        state.setFilterAssignee(e.target.value);
      });
    }

    document.getElementById('board-settings-top-btn')?.addEventListener('click', () => {
      boardModal.openEdit();
    });

    document.getElementById('open-backup-btn')?.addEventListener('click', () => {
      backupModal.open();
    });

    document.getElementById('header-new-task-btn')?.addEventListener('click', () => {
      if (!auth.can('create_task')) {
        window.showToast?.('Permission Denied: Viewer role cannot create tasks.', 'warning');
        return;
      }
      cardModal.openNew();
    });
  }

  bindKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

      if (e.key === '/') {
        e.preventDefault();
        document.getElementById('global-search-input')?.focus();
      } else if (e.key.toLowerCase() === 'n' || e.key.toLowerCase() === 'c') {
        if (auth.can('create_task')) {
          e.preventDefault();
          cardModal.openNew();
        }
      } else if (e.key === '1') {
        state.setView('kanban');
      } else if (e.key === '2') {
        state.setView('table');
      } else if (e.key === '3') {
        state.setView('timeline');
      } else if (e.key === '4') {
        state.setView('metrics');
      }
    });
  }

  render() {
    const mainViewContainer = document.getElementById('main-view-container');
    if (!mainViewContainer) return;

    switch (state.currentView) {
      case 'kanban':
        kanbanView.render(mainViewContainer);
        break;
      case 'table':
        tableView.render(mainViewContainer);
        break;
      case 'timeline':
        timelineView.render(mainViewContainer);
        break;
      case 'metrics':
        metricsView.render(mainViewContainer);
        break;
      default:
        kanbanView.render(mainViewContainer);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});
