import { state } from '../state.js';
import { auth } from '../auth.js';
import { cardModal } from '../modals/cardModal.js';
import { api } from '../api.js';

let sortColumn = 'title';
let sortDirection = 'asc';

export const tableView = {
  render(container) {
    if (!state.activeBoard) {
      container.innerHTML = `<div class="p-8 text-center text-slate-400">No active board selected</div>`;
      return;
    }

    const board = state.activeBoard;
    let tasks = [...state.getFilteredTasks()];
    const users = state.users || [];
    const lists = board.lists || [];
    const canEdit = auth.can('edit_task');

    tasks.sort((a, b) => {
      let valA = a[sortColumn] || '';
      let valB = b[sortColumn] || '';

      if (sortColumn === 'assignee') {
        const uA = users.find(u => u.id === a.assigneeId);
        const uB = users.find(u => u.id === b.assigneeId);
        valA = uA ? uA.name : '';
        valB = uB ? uB.name : '';
      } else if (sortColumn === 'status') {
        const lA = lists.find(l => l.id === a.listId);
        const lB = lists.find(l => l.id === b.listId);
        valA = lA ? lA.order : 0;
        valB = lB ? lB.order : 0;
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    let html = `
      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div class="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
          <div>
            <h2 class="text-base font-bold text-slate-900">${escapeHtml(board.title)} — Table View</h2>
            <p class="text-xs text-slate-500">Compact list of all filtered tasks with direct status adjustments</p>
          </div>
          <div class="text-xs font-semibold text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
            Showing ${tasks.length} of ${board.tasks.length} tasks
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[11px] tracking-wider select-none">
              <tr>
                <th class="py-3.5 px-4 cursor-pointer hover:text-slate-800" data-sort="title">
                  <div class="flex items-center gap-1.5">
                    <span>Task Name</span>
                    ${getSortArrow('title')}
                  </div>
                </th>
                <th class="py-3.5 px-4 cursor-pointer hover:text-slate-800" data-sort="status">
                  <div class="flex items-center gap-1.5">
                    <span>Status / Column</span>
                    ${getSortArrow('status')}
                  </div>
                </th>
                <th class="py-3.5 px-4 cursor-pointer hover:text-slate-800" data-sort="priority">
                  <div class="flex items-center gap-1.5">
                    <span>Priority</span>
                    ${getSortArrow('priority')}
                  </div>
                </th>
                <th class="py-3.5 px-4 cursor-pointer hover:text-slate-800" data-sort="assignee">
                  <div class="flex items-center gap-1.5">
                    <span>Assignee</span>
                    ${getSortArrow('assignee')}
                  </div>
                </th>
                <th class="py-3.5 px-4 cursor-pointer hover:text-slate-800" data-sort="dueDate">
                  <div class="flex items-center gap-1.5">
                    <span>Due Date</span>
                    ${getSortArrow('dueDate')}
                  </div>
                </th>
                <th class="py-3.5 px-4 text-center">Subtasks</th>
                <th class="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
    `;

    if (tasks.length === 0) {
      html += `
        <tr>
          <td colspan="7" class="py-12 text-center text-slate-400">
            No matching tasks found. Adjust search or filters.
          </td>
        </tr>
      `;
    } else {
      tasks.forEach(task => {
        const assignee = users.find(u => u.id === task.assigneeId);
        const list = lists.find(l => l.id === task.listId);
        const checklist = task.checklist || [];
        const completedCount = checklist.filter(c => c.completed).length;

        html += `
          <tr class="hover:bg-indigo-50/40 transition-colors group cursor-pointer" data-task-id="${task.id}">
            <td class="py-3.5 px-4">
              <div class="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                ${escapeHtml(task.title)}
              </div>
              ${task.tags && task.tags.length ? `
                <div class="flex items-center gap-1 mt-1">
                  ${task.tags.map(t => `<span class="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-mono">${escapeHtml(t)}</span>`).join('')}
                </div>
              ` : ''}
            </td>

            <td class="py-3.5 px-4" onclick="event.stopPropagation()">
              ${canEdit ? `
                <select class="status-select text-xs font-medium rounded-lg border border-slate-200 py-1 px-2.5 bg-white text-slate-700 hover:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        data-task-id="${task.id}">
                  ${lists.map(l => `
                    <option value="${l.id}" ${l.id === task.listId ? 'selected' : ''}>
                      ${escapeHtml(l.title)}
                    </option>
                  `).join('')}
                </select>
              ` : `
                <span class="inline-block px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700">
                  ${escapeHtml(list ? list.title : 'Unknown')}
                </span>
              `}
            </td>

            <td class="py-3.5 px-4">
              <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${getPriorityBadgeClass(task.priority)}">
                ${task.priority || 'medium'}
              </span>
            </td>

            <td class="py-3.5 px-4">
              ${assignee ? `
                <div class="flex items-center gap-2">
                  <img src="${assignee.avatar}" class="w-6 h-6 rounded-full object-cover" />
                  <span class="font-medium text-slate-700 truncate max-w-[120px]">${escapeHtml(assignee.name)}</span>
                </div>
              ` : `
                <span class="text-slate-400 italic">Unassigned</span>
              `}
            </td>

            <td class="py-3.5 px-4">
              ${task.dueDate ? `
                <span class="font-mono text-slate-600">${task.dueDate}</span>
              ` : `
                <span class="text-slate-300">—</span>
              `}
            </td>

            <td class="py-3.5 px-4 text-center">
              ${checklist.length > 0 ? `
                <span class="font-mono text-xs ${completedCount === checklist.length ? 'text-emerald-600 font-bold' : 'text-slate-600'}">
                  ${completedCount}/${checklist.length}
                </span>
              ` : `
                <span class="text-slate-300">—</span>
              `}
            </td>

            <td class="py-3.5 px-4 text-right" onclick="event.stopPropagation()">
              <button class="open-details-btn px-2.5 py-1 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 transition font-medium"
                      data-task-id="${task.id}">
                Details
              </button>
            </td>
          </tr>
        `;
      });
    }

    html += `
            </tbody>
          </table>
        </div>
      </div>
    `;

    container.innerHTML = html;
    this.attachEvents(container);
  },

  attachEvents(container) {
    const board = state.activeBoard;
    if (!board) return;

    container.querySelectorAll('th[data-sort]').forEach(th => {
      th.addEventListener('click', () => {
        const col = th.getAttribute('data-sort');
        if (sortColumn === col) {
          sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
          sortColumn = col;
          sortDirection = 'asc';
        }
        this.render(container);
      });
    });

    container.querySelectorAll('tbody tr[data-task-id]').forEach(tr => {
      tr.addEventListener('click', () => {
        const taskId = tr.getAttribute('data-task-id');
        const task = board.tasks.find(t => t.id === taskId);
        if (task) cardModal.open(task);
      });
    });

    container.querySelectorAll('.open-details-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const taskId = btn.getAttribute('data-task-id');
        const task = board.tasks.find(t => t.id === taskId);
        if (task) cardModal.open(task);
      });
    });

    container.querySelectorAll('.status-select').forEach(sel => {
      sel.addEventListener('change', async () => {
        const taskId = sel.getAttribute('data-task-id');
        const targetListId = sel.value;
        const user = auth.getCurrentUser();

        try {
          await api.moveTask(board.id, taskId, targetListId, 0, user.id);
          window.showToast?.('Task status updated', 'success');
          await state.refreshBoard();
        } catch (err) {
          alert(err.message);
        }
      });
    });
  }
};

function getSortArrow(col) {
  if (sortColumn !== col) return '<span class="text-slate-300">↕</span>';
  return sortDirection === 'asc' ? '<span class="text-indigo-600 font-bold">↑</span>' : '<span class="text-indigo-600 font-bold">↓</span>';
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

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
