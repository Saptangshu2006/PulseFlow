import { state } from '../state.js';
import { auth } from '../auth.js';
import { dnd } from '../dnd.js';
import { cardModal } from '../modals/cardModal.js';
import { api } from '../api.js';

export const kanbanView = {
  render(container) {
    if (!state.activeBoard) {
      container.innerHTML = `
        <div class="flex flex-col items-center justify-center h-96 text-slate-400">
          <svg class="w-16 h-16 mb-4 text-slate-300 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"></path>
          </svg>
          <p class="text-lg font-medium">Select or create a board to get started</p>
        </div>
      `;
      return;
    }

    const board = state.activeBoard;
    const filteredTasks = state.getFilteredTasks();
    const canCreateTask = auth.can('create_task');
    const canManageColumns = auth.can('manage_columns');
    const canMoveTask = auth.can('move_task');

    const lists = [...(board.lists || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    let html = `
      <div class="h-full flex flex-col">
        <div class="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-3">
              <span class="w-3.5 h-3.5 rounded-full ring-4 ring-indigo-50 shadow-sm" style="background-color: ${board.color || '#4f46e5'}"></span>
              <h1 class="text-2xl font-bold tracking-tight text-slate-900">${escapeHtml(board.title)}</h1>
              <span class="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                ${filteredTasks.length} ${filteredTasks.length === 1 ? 'task' : 'tasks'}
              </span>
            </div>
            ${board.description ? `<p class="text-xs text-slate-500 mt-1">${escapeHtml(board.description)}</p>` : ''}
          </div>

          <div class="flex items-center gap-2">
            ${!canMoveTask ? `
              <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium shadow-sm" title="Viewer role has read-only access">
                <svg class="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                </svg>
                <span>Read-Only View (Drag & Edits Disabled)</span>
              </div>
            ` : ''}

            ${canManageColumns ? `
              <button id="add-column-top-btn" class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 hover:text-slate-900 transition-all">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                </svg>
                Add Column
              </button>
            ` : ''}
          </div>
        </div>

        <div class="flex-1 overflow-x-auto pb-4 custom-scrollbar">
          <div class="flex items-start gap-5 min-h-[580px] pb-6" id="kanban-columns-row">
    `;

    lists.forEach(list => {
      const listTasks = filteredTasks
        .filter(t => t.listId === list.id)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

      const isOverWip = list.wipLimit > 0 && listTasks.length > list.wipLimit;

      html += `
        <div class="kanban-column flex-shrink-0 w-80 bg-slate-100/90 rounded-2xl p-3 border ${isOverWip ? 'border-rose-400 bg-rose-50/40' : 'border-slate-200'} flex flex-col max-h-[calc(100vh-210px)] transition-colors shadow-sm"
             data-list-id="${list.id}">

          <div class="column-header flex items-center justify-between pb-3 px-1 mb-2 border-b border-slate-200/70" data-list-id="${list.id}">
            <div class="flex items-center gap-2 overflow-hidden">
              <span class="w-2.5 h-2.5 rounded-full ${getColumnColorDot(list.title)}"></span>
              <h3 class="font-bold text-sm text-slate-800 truncate">${escapeHtml(list.title)}</h3>
              <span class="px-2 py-0.5 text-xs font-semibold rounded-full ${isOverWip ? 'bg-rose-100 text-rose-700 border border-rose-300' : 'bg-slate-200 text-slate-700'}">
                ${listTasks.length}${list.wipLimit > 0 ? ` / ${list.wipLimit}` : ''}
              </span>
            </div>

            <div class="flex items-center gap-1">
              ${isOverWip ? `
                <span class="text-rose-600 text-xs font-bold px-1.5 py-0.5 rounded bg-rose-100" title="Work In Progress Limit Exceeded!">
                  WIP ALERT
                </span>
              ` : ''}

              ${canManageColumns ? `
                <div class="relative column-menu-wrapper">
                  <button class="column-menu-btn p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded transition" data-list-id="${list.id}" title="Column settings">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path>
                    </svg>
                  </button>
                </div>
              ` : ''}
            </div>
          </div>

          <div class="card-list-container flex-1 overflow-y-auto space-y-3 pr-1 min-h-[140px] custom-scrollbar" data-list-id="${list.id}">
      `;

      if (listTasks.length === 0) {
        html += `
          <div class="empty-column-placeholder flex flex-col items-center justify-center h-28 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
            <span>No tasks in this list</span>
            ${canCreateTask ? `<span class="text-[11px] text-indigo-500 mt-1">Drop a card or click + below</span>` : ''}
          </div>
        `;
      } else {
        listTasks.forEach(task => {
          html += renderTaskCard(task);
        });
      }

      html += `
          </div>

          ${canCreateTask ? `
            <div class="pt-3 mt-2 border-t border-slate-200/60">
              <button class="add-task-btn w-full py-2 px-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/70 border border-transparent hover:border-indigo-200 rounded-xl transition duration-150"
                      data-list-id="${list.id}">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                </svg>
                Add Card
              </button>
            </div>
          ` : ''}
        </div>
      `;
    });

    if (canManageColumns) {
      html += `
        <div class="flex-shrink-0 w-72">
          <button id="add-column-end-btn" class="w-full h-24 border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-2xl flex flex-col items-center justify-center text-slate-500 hover:text-indigo-600 bg-white/40 hover:bg-white/80 transition-all group">
            <svg class="w-6 h-6 mb-1 text-slate-400 group-hover:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
            </svg>
            <span class="text-xs font-bold">Add Another Column</span>
          </button>
        </div>
      `;
    }

    html += `
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;
    this.attachEvents(container);
  },

  attachEvents(container) {
    const board = state.activeBoard;
    if (!board) return;

    container.querySelectorAll('.kanban-column').forEach(colEl => {
      const listId = colEl.getAttribute('data-list-id');
      dnd.initColumnDropZone(colEl, listId);

      const headerEl = colEl.querySelector('.column-header');
      if (headerEl) {
        dnd.initColumnHeaderDrag(headerEl, colEl, listId);
      }
    });

    container.querySelectorAll('.task-card').forEach(cardEl => {
      const taskId = cardEl.getAttribute('data-task-id');
      const task = board.tasks.find(t => t.id === taskId);
      if (task) {
        dnd.initCard(cardEl, task);

        cardEl.addEventListener('click', (e) => {
          if (e.target.closest('.card-action-menu') || e.target.closest('.subtask-checkbox')) return;
          cardModal.open(task);
        });
      }
    });

    container.querySelectorAll('.add-task-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const listId = btn.getAttribute('data-list-id');
        cardModal.openNew(listId);
      });
    });

    const addColTop = container.querySelector('#add-column-top-btn');
    const addColEnd = container.querySelector('#add-column-end-btn');
    const handleAddCol = () => {
      const title = prompt('Enter new column title:');
      if (title && title.trim()) {
        const user = auth.getCurrentUser();
        api.createList(board.id, { title: title.trim(), wipLimit: 0 }, user.id)
          .then(() => state.refreshBoard())
          .catch(err => alert(err.message));
      }
    };

    if (addColTop) addColTop.addEventListener('click', handleAddCol);
    if (addColEnd) addColEnd.addEventListener('click', handleAddCol);

    container.querySelectorAll('.column-menu-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const listId = btn.getAttribute('data-list-id');
        const list = board.lists.find(l => l.id === listId);
        if (!list) return;

        const choice = prompt(`Manage Column: "${list.title}"\n1. Rename Column\n2. Set WIP Limit (Current: ${list.wipLimit})\n3. Delete Column\n\nEnter 1, 2, or 3:`);
        const user = auth.getCurrentUser();

        if (choice === '1') {
          const newTitle = prompt('Enter new column title:', list.title);
          if (newTitle && newTitle.trim()) {
            api.updateList(board.id, list.id, { title: newTitle.trim() }, user.id)
              .then(() => state.refreshBoard())
              .catch(err => alert(err.message));
          }
        } else if (choice === '2') {
          const limitStr = prompt('Enter maximum Work-In-Progress limit (0 for unlimited):', list.wipLimit);
          if (limitStr !== null) {
            const limit = parseInt(limitStr, 10);
            api.updateList(board.id, list.id, { wipLimit: isNaN(limit) ? 0 : limit }, user.id)
              .then(() => state.refreshBoard())
              .catch(err => alert(err.message));
          }
        } else if (choice === '3') {
          if (confirm(`Are you sure you want to delete column "${list.title}" and all its tasks?`)) {
            api.deleteList(board.id, list.id, user.id)
              .then(() => state.refreshBoard())
              .catch(err => alert(err.message));
          }
        }
      });
    });
  }
};

function renderTaskCard(task) {
  const users = state.users || [];
  const assignee = users.find(u => u.id === task.assigneeId);
  const checklist = task.checklist || [];
  const completedChecklist = checklist.filter(c => c.completed).length;
  const hasChecklist = checklist.length > 0;
  const checklistPercent = hasChecklist ? Math.round((completedChecklist / checklist.length) * 100) : 0;

  let dueDateBadge = '';
  if (task.dueDate) {
    const dueTime = new Date(task.dueDate + 'T23:59:59').getTime();
    const now = Date.now();
    const diffDays = Math.ceil((dueTime - now) / 86400000);

    if (diffDays < 0) {
      dueDateBadge = `<span class="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        Overdue
      </span>`;
    } else if (diffDays === 0) {
      dueDateBadge = `<span class="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
        Due Today
      </span>`;
    } else {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const d = new Date(task.dueDate + 'T00:00:00');
      const formatted = `${monthNames[d.getMonth()]} ${d.getDate()}`;
      dueDateBadge = `<span class="inline-flex items-center gap-1 text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
        ${formatted}
      </span>`;
    }
  }

  const priorityClass = getPriorityBadgeClass(task.priority);
  const commentsCount = task.comments ? task.comments.length : 0;

  return `
    <div class="task-card bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-300 relative group"
         data-task-id="${task.id}">

      <div class="flex items-center justify-between gap-2 mb-2">
        <div class="flex flex-wrap items-center gap-1.5">
          <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${priorityClass}">
            ${task.priority || 'medium'}
          </span>
          ${(task.tags || []).slice(0, 2).map(tag => `
            <span class="text-[10px] font-medium px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
              ${escapeHtml(tag)}
            </span>
          `).join('')}
          ${(task.tags || []).length > 2 ? `<span class="text-[10px] text-slate-400 font-semibold">+${task.tags.length - 2}</span>` : ''}
        </div>

        <button class="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded" title="Open task details">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
          </svg>
        </button>
      </div>

      <h4 class="font-semibold text-slate-900 text-sm leading-snug mb-1 hover:text-indigo-600 transition-colors cursor-pointer">
        ${escapeHtml(task.title)}
      </h4>

      ${task.description ? `
        <p class="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">
          ${escapeHtml(task.description)}
        </p>
      ` : ''}

      ${hasChecklist ? `
        <div class="mb-3 pt-1">
          <div class="flex items-center justify-between text-[11px] text-slate-500 mb-1">
            <span class="flex items-center gap-1 font-medium">
              <svg class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              Subtasks
            </span>
            <span class="font-semibold">${completedChecklist}/${checklist.length} (${checklistPct}%)</span>
          </div>
          <div class="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div class="bg-indigo-600 h-1.5 rounded-full transition-all duration-300" style="width: ${checklistPercent}%"></div>
          </div>
        </div>
      ` : ''}

      <div class="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
        <div class="flex items-center gap-2">
          ${dueDateBadge}

          ${commentsCount > 0 ? `
            <span class="flex items-center gap-1 text-[11px] text-slate-500 font-medium" title="${commentsCount} comments">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
              </svg>
              ${commentsCount}
            </span>
          ` : ''}

          ${task.estimatedHours ? `
            <span class="text-[10px] font-mono text-slate-400" title="Estimated: ${task.estimatedHours}h">
              ${task.estimatedHours}h
            </span>
          ` : ''}
        </div>

        <div>
          ${assignee ? `
            <img src="${assignee.avatar}"
                 alt="${escapeHtml(assignee.name)}"
                 title="${escapeHtml(assignee.name)} (${assignee.role})"
                 class="w-6 h-6 rounded-full ring-2 ring-white shadow-sm object-cover" />
          ` : `
            <span class="w-6 h-6 rounded-full bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-[10px]" title="Unassigned">
              ?
            </span>
          `}
        </div>
      </div>
    </div>
  `;
}

function getPriorityBadgeClass(priority) {
  switch (priority) {
    case 'urgent': return 'priority-urgent';
    case 'high': return 'priority-high';
    case 'medium': return 'priority-medium';
    case 'low': return 'priority-low';
    default: return 'priority-medium';
  }
}

function getColumnColorDot(title) {
  const t = title.toLowerCase();
  if (t.includes('backlog') || t.includes('concept')) return 'bg-slate-400';
  if (t.includes('todo') || t.includes('ready') || t.includes('plan')) return 'bg-blue-500';
  if (t.includes('progress') || t.includes('doing') || t.includes('coding')) return 'bg-indigo-500';
  if (t.includes('review') || t.includes('qa') || t.includes('test')) return 'bg-amber-500';
  if (t.includes('done') || t.includes('shipped') || t.includes('prod')) return 'bg-emerald-500';
  return 'bg-purple-500';
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
