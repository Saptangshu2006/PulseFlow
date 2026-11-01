import { state } from '../state.js';
import { auth } from '../auth.js';
import { api } from '../api.js';

let activeTask = null;
let isNew = false;
let defaultListId = null;

export const cardModal = {
  open(task) {
    activeTask = JSON.parse(JSON.stringify(task));
    isNew = false;
    defaultListId = task.listId;
    this.render();
  },

  openNew(listId) {
    const user = auth.getCurrentUser();
    activeTask = {
      id: null,
      title: '',
      description: '',
      listId: listId || (state.activeBoard.lists[0] ? state.activeBoard.lists[0].id : ''),
      priority: 'medium',
      assigneeId: user ? user.id : null,
      dueDate: '',
      estimatedHours: 0,
      loggedHours: 0,
      tags: [],
      checklist: [],
      comments: []
    };
    isNew = true;
    defaultListId = listId;
    this.render();
  },

  close() {
    const backdrop = document.getElementById('card-modal-backdrop');
    if (backdrop) {
      backdrop.classList.remove('active');
      const content = backdrop.querySelector('.modal-content');
      if (content) content.classList.remove('active');
      setTimeout(() => {
        backdrop.style.display = 'none';
      }, 200);
    }
    activeTask = null;
  },

  render() {
    const backdrop = document.getElementById('card-modal-backdrop');
    if (!backdrop) return;

    const board = state.activeBoard;
    const users = state.users || [];
    const lists = board.lists || [];
    const canEdit = auth.can('edit_task');
    const canDelete = auth.can('delete_task');

    const checklist = activeTask.checklist || [];
    const completedCount = checklist.filter(c => c.completed).length;
    const checklistPct = checklist.length > 0 ? Math.round((completedCount / checklist.length) * 100) : 0;

    let modalHtml = `
      <div class="modal-content active bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        <div class="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full ${getColumnColorDot(lists.find(l => l.id === activeTask.listId)?.title || '')}"></span>
            <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">
              ${isNew ? 'Create New Task' : 'Task Details'}
            </span>
            ${!canEdit ? `
              <span class="text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                Read-Only (Viewer)
              </span>
            ` : ''}
          </div>

          <div class="flex items-center gap-2">
            ${!isNew && canDelete ? `
              <button id="modal-delete-task-btn" class="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition" title="Delete Task">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
              </button>
            ` : ''}
            <button id="modal-close-btn" class="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>

        <div class="p-6 overflow-y-auto space-y-6 custom-scrollbar flex-1">
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Title</label>
            <input type="text" id="modal-task-title"
                   value="${escapeHtml(activeTask.title)}"
                   placeholder="Task title..."
                   ${!canEdit ? 'disabled' : ''}
                   class="w-full text-lg font-bold text-slate-900 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition ${!canEdit ? 'bg-slate-50 cursor-not-allowed' : ''}" />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
            <div>
              <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Column</label>
              <select id="modal-task-list" ${!canEdit ? 'disabled' : ''}
                      class="w-full text-xs font-semibold bg-white border border-slate-200 rounded-xl p-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                ${lists.map(l => `
                  <option value="${l.id}" ${l.id === activeTask.listId ? 'selected' : ''}>
                    ${escapeHtml(l.title)}
                  </option>
                `).join('')}
              </select>
            </div>

            <div>
              <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Priority</label>
              <select id="modal-task-priority" ${!canEdit ? 'disabled' : ''}
                      class="w-full text-xs font-semibold bg-white border border-slate-200 rounded-xl p-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="urgent" ${activeTask.priority === 'urgent' ? 'selected' : ''}>🚨 Urgent</option>
                <option value="high" ${activeTask.priority === 'high' ? 'selected' : ''}>🔥 High</option>
                <option value="medium" ${activeTask.priority === 'medium' ? 'selected' : ''}>⚡ Medium</option>
                <option value="low" ${activeTask.priority === 'low' ? 'selected' : ''}>☕ Low</option>
              </select>
            </div>

            <div>
              <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Assignee</label>
              <select id="modal-task-assignee" ${!canEdit ? 'disabled' : ''}
                      class="w-full text-xs font-semibold bg-white border border-slate-200 rounded-xl p-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">Unassigned</option>
                ${users.map(u => `
                  <option value="${u.id}" ${u.id === activeTask.assigneeId ? 'selected' : ''}>
                    ${escapeHtml(u.name)} (${u.role})
                  </option>
                `).join('')}
              </select>
            </div>

            <div>
              <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Due Date</label>
              <input type="date" id="modal-task-duedate"
                     value="${activeTask.dueDate || ''}"
                     ${!canEdit ? 'disabled' : ''}
                     class="w-full text-xs font-semibold bg-white border border-slate-200 rounded-xl p-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Description</label>
            <textarea id="modal-task-description" rows="3"
                      placeholder="Add detailed markdown notes, acceptance criteria, or context..."
                      ${!canEdit ? 'disabled' : ''}
                      class="w-full text-xs text-slate-800 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${!canEdit ? 'bg-slate-50 cursor-not-allowed' : ''}">${escapeHtml(activeTask.description || '')}</textarea>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Tags (Comma-separated)</label>
              <input type="text" id="modal-task-tags"
                     value="${(activeTask.tags || []).join(', ')}"
                     placeholder="Frontend, API, Security..."
                     ${!canEdit ? 'disabled' : ''}
                     class="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Estimated Hours</label>
              <input type="number" id="modal-task-hours"
                     value="${activeTask.estimatedHours || 0}"
                     min="0"
                     ${!canEdit ? 'disabled' : ''}
                     class="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>

          <div class="border-t border-slate-200 pt-5">
            <div class="flex items-center justify-between mb-2">
              <h4 class="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <svg class="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                Subtasks / Checklist
              </h4>
              <span class="text-xs font-bold text-slate-600">${completedCount}/${checklist.length} (${checklistPct}%)</span>
            </div>

            <div class="w-full bg-slate-100 rounded-full h-2 mb-3 overflow-hidden">
              <div class="bg-indigo-600 h-2 rounded-full transition-all duration-300" style="width: ${checklistPct}%"></div>
            </div>

            <div class="space-y-2 mb-3" id="modal-checklist-container">
              ${checklist.map((item, idx) => `
                <div class="flex items-center justify-between gap-3 p-2 rounded-xl bg-slate-50 border border-slate-200/60 group">
                  <label class="flex items-center gap-2 text-xs flex-1 cursor-pointer">
                    <input type="checkbox" class="modal-subtask-toggle w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                           data-subtask-idx="${idx}" ${item.completed ? 'checked' : ''} ${!canEdit ? 'disabled' : ''} />
                    <span class="${item.completed ? 'line-through text-slate-400' : 'text-slate-800'} font-medium">
                      ${escapeHtml(item.text)}
                    </span>
                  </label>
                  ${canEdit ? `
                    <button class="modal-delete-subtask text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition p-1"
                            data-subtask-idx="${idx}">
                      &times;
                    </button>
                  ` : ''}
                </div>
              `).join('')}
            </div>

            ${canEdit ? `
              <div class="flex items-center gap-2">
                <input type="text" id="modal-new-subtask-input"
                       placeholder="Add a new subtask..."
                       class="flex-1 text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <button id="modal-add-subtask-btn"
                        class="px-3 py-2 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition">
                  Add Item
                </button>
              </div>
            ` : ''}
          </div>

          ${!isNew ? `
            <div class="border-t border-slate-200 pt-5">
              <h4 class="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                <svg class="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                </svg>
                Discussion & Activity (${(activeTask.comments || []).length})
              </h4>

              <div class="flex items-start gap-3 mb-4">
                <img src="${auth.getCurrentUser()?.avatar || ''}" class="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200" />
                <div class="flex-1 flex gap-2">
                  <input type="text" id="modal-comment-input"
                         placeholder="Write a message or update..."
                         class="flex-1 text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  <button id="modal-submit-comment-btn"
                          class="px-3 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-sm">
                    Post
                  </button>
                </div>
              </div>

              <div class="space-y-3 max-h-56 overflow-y-auto custom-scrollbar">
                ${(activeTask.comments || []).slice().reverse().map(c => `
                  <div class="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3">
                    <img src="${c.userAvatar}" class="w-7 h-7 rounded-full object-cover" />
                    <div class="flex-1">
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                          <span class="text-xs font-bold text-slate-800">${escapeHtml(c.userName)}</span>
                          <span class="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 uppercase">${c.userRole}</span>
                        </div>
                        <span class="text-[10px] text-slate-400 font-mono">${formatTimeAgo(c.createdAt)}</span>
                      </div>
                      <p class="text-xs text-slate-700 mt-1 leading-relaxed">${escapeHtml(c.text)}</p>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>

        <div class="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3">
          <button id="modal-cancel-btn" class="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition shadow-sm">
            Cancel
          </button>

          ${canEdit ? `
            <button id="modal-save-task-btn" class="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-sm">
              ${isNew ? 'Create Task' : 'Save Changes'}
            </button>
          ` : ''}
        </div>
      </div>
    `;

    backdrop.innerHTML = modalHtml;
    backdrop.style.display = 'flex';
    setTimeout(() => {
      backdrop.classList.add('active');
    }, 10);

    this.attachEvents();
  },

  attachEvents() {
    const backdrop = document.getElementById('card-modal-backdrop');
    if (!backdrop) return;

    backdrop.querySelector('#modal-close-btn')?.addEventListener('click', () => this.close());
    backdrop.querySelector('#modal-cancel-btn')?.addEventListener('click', () => this.close());

    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) this.close();
    });

    backdrop.querySelectorAll('.modal-subtask-toggle').forEach(chk => {
      chk.addEventListener('change', () => {
        const idx = parseInt(chk.getAttribute('data-subtask-idx'), 10);
        if (activeTask.checklist && activeTask.checklist[idx]) {
          activeTask.checklist[idx].completed = chk.checked;
          this.render();
        }
      });
    });

    backdrop.querySelectorAll('.modal-delete-subtask').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-subtask-idx'), 10);
        if (activeTask.checklist) {
          activeTask.checklist.splice(idx, 1);
          this.render();
        }
      });
    });

    const addSubtaskInput = backdrop.querySelector('#modal-new-subtask-input');
    const addSubtaskBtn = backdrop.querySelector('#modal-add-subtask-btn');
    const handleAddSubtask = () => {
      const text = addSubtaskInput?.value?.trim();
      if (text) {
        if (!activeTask.checklist) activeTask.checklist = [];
        activeTask.checklist.push({
          id: `chk-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          text,
          completed: false
        });
        this.render();
      }
    };
    if (addSubtaskBtn) addSubtaskBtn.addEventListener('click', handleAddSubtask);
    if (addSubtaskInput) {
      addSubtaskInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleAddSubtask();
      });
    }

    const commentInput = backdrop.querySelector('#modal-comment-input');
    const commentBtn = backdrop.querySelector('#modal-submit-comment-btn');
    const handleAddComment = async () => {
      const text = commentInput?.value?.trim();
      if (!text || !activeTask.id) return;
      const user = auth.getCurrentUser();
      try {
        const newC = await api.addComment(state.activeBoard.id, activeTask.id, text, user.id);
        if (!activeTask.comments) activeTask.comments = [];
        activeTask.comments.push(newC);
        this.render();
        state.refreshBoard();
      } catch (err) {
        alert(err.message);
      }
    };
    if (commentBtn) commentBtn.addEventListener('click', handleAddComment);
    if (commentInput) {
      commentInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleAddComment();
      });
    }

    backdrop.querySelector('#modal-delete-task-btn')?.addEventListener('click', async () => {
      if (confirm(`Are you sure you want to permanently delete "${activeTask.title}"?`)) {
        const user = auth.getCurrentUser();
        try {
          await api.deleteTask(state.activeBoard.id, activeTask.id, user.id);
          window.showToast?.('Task deleted', 'success');
          this.close();
          await state.refreshBoard();
        } catch (err) {
          alert(err.message);
        }
      }
    });

    backdrop.querySelector('#modal-save-task-btn')?.addEventListener('click', async () => {
      const title = backdrop.querySelector('#modal-task-title')?.value?.trim();
      if (!title) {
        alert('Please enter a task title');
        return;
      }

      const listId = backdrop.querySelector('#modal-task-list')?.value;
      const priority = backdrop.querySelector('#modal-task-priority')?.value;
      const assigneeId = backdrop.querySelector('#modal-task-assignee')?.value || null;
      const dueDate = backdrop.querySelector('#modal-task-duedate')?.value || null;
      const description = backdrop.querySelector('#modal-task-description')?.value || '';
      const tagsRaw = backdrop.querySelector('#modal-task-tags')?.value || '';
      const tags = tagsRaw.split(',').map(s => s.trim()).filter(Boolean);
      const estimatedHours = parseFloat(backdrop.querySelector('#modal-task-hours')?.value || 0) || 0;

      const user = auth.getCurrentUser();
      const payload = {
        title,
        listId,
        priority,
        assigneeId,
        dueDate,
        description,
        tags,
        estimatedHours,
        checklist: activeTask.checklist || []
      };

      try {
        if (isNew) {
          await api.createTask(state.activeBoard.id, payload, user.id);
          window.showToast?.('Task created successfully', 'success');
        } else {
          await api.updateTask(state.activeBoard.id, activeTask.id, payload, user.id);
          window.showToast?.('Task saved successfully', 'success');
        }
        this.close();
        await state.refreshBoard();
      } catch (err) {
        alert(err.message);
      }
    });
  }
};

function formatTimeAgo(timestamp) {
  if (!timestamp) return '';
  const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
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
