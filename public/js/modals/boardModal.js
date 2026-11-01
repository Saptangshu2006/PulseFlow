import { state } from '../state.js';
import { auth } from '../auth.js';
import { api } from '../api.js';

let isEditing = false;

export const boardModal = {
  openNew() {
    isEditing = false;
    this.render();
  },

  openEdit() {
    isEditing = true;
    this.render();
  },

  close() {
    const backdrop = document.getElementById('board-modal-backdrop');
    if (backdrop) {
      backdrop.classList.remove('active');
      backdrop.style.display = 'none';
    }
  },

  render() {
    const backdrop = document.getElementById('board-modal-backdrop');
    if (!backdrop) return;

    const board = state.activeBoard;
    const canDelete = auth.can('delete_board');

    const defaultTitle = isEditing && board ? board.title : '';
    const defaultDesc = isEditing && board ? (board.description || '') : '';
    const defaultColor = isEditing && board ? (board.color || '#4f46e5') : '#4f46e5';

    const colors = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#64748b'];

    let html = `
      <div class="modal-content active bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        <div class="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
          <h3 class="text-base font-bold text-slate-900">
            ${isEditing ? 'Board Settings' : 'Create New Board'}
          </h3>
          <button id="board-modal-close-btn" class="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <div class="p-6 space-y-5">
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Board Name</label>
            <input type="text" id="board-name-input"
                   value="${escapeHtml(defaultTitle)}"
                   placeholder="e.g., Marketing Sprint, Mobile App V2..."
                   class="w-full text-sm font-semibold text-slate-900 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Description</label>
            <textarea id="board-desc-input" rows="2"
                      placeholder="High-level objectives and scope..."
                      class="w-full text-xs text-slate-800 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500">${escapeHtml(defaultDesc)}</textarea>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Theme Color</label>
            <div class="flex items-center gap-3" id="board-color-picker">
              ${colors.map(c => `
                <button type="button" class="color-swatch w-7 h-7 rounded-full transition-transform hover:scale-110 ${c === defaultColor ? 'ring-4 ring-indigo-200 scale-110' : ''}"
                        style="background-color: ${c}"
                        data-color="${c}"></button>
              `).join('')}
              <input type="hidden" id="selected-board-color" value="${defaultColor}" />
            </div>
          </div>

          ${isEditing && canDelete ? `
            <div class="pt-4 border-t border-slate-200 flex items-center justify-between">
              <div>
                <p class="text-xs font-bold text-rose-600">Danger Zone</p>
                <p class="text-[11px] text-slate-400">Permanently delete this board and its contents</p>
              </div>
              <button id="board-delete-btn" class="px-3 py-1.5 text-xs font-bold text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 rounded-xl transition">
                Delete Board
              </button>
            </div>
          ` : ''}
        </div>

        <div class="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3">
          <button id="board-cancel-btn" class="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-xl transition">
            Cancel
          </button>
          <button id="board-save-btn" class="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-sm">
            ${isEditing ? 'Save Settings' : 'Create Board'}
          </button>
        </div>
      </div>
    `;

    backdrop.innerHTML = html;
    backdrop.style.display = 'flex';
    setTimeout(() => backdrop.classList.add('active'), 10);

    this.attachEvents();
  },

  attachEvents() {
    const backdrop = document.getElementById('board-modal-backdrop');
    if (!backdrop) return;

    backdrop.querySelector('#board-modal-close-btn')?.addEventListener('click', () => this.close());
    backdrop.querySelector('#board-cancel-btn')?.addEventListener('click', () => this.close());
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) this.close();
    });

    backdrop.querySelectorAll('.color-swatch').forEach(swatch => {
      swatch.addEventListener('click', () => {
        backdrop.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('ring-4', 'ring-indigo-200', 'scale-110'));
        swatch.classList.add('ring-4', 'ring-indigo-200', 'scale-110');
        const color = swatch.getAttribute('data-color');
        const input = backdrop.querySelector('#selected-board-color');
        if (input) input.value = color;
      });
    });

    backdrop.querySelector('#board-delete-btn')?.addEventListener('click', async () => {
      if (confirm(`Are you sure you want to delete board "${state.activeBoard.title}"? This cannot be undone.`)) {
        const user = auth.getCurrentUser();
        try {
          await api.deleteBoard(state.activeBoard.id, user.id);
          window.showToast?.('Board deleted', 'success');
          this.close();
          await state.loadInitialData();
        } catch (err) {
          alert(err.message);
        }
      }
    });

    backdrop.querySelector('#board-save-btn')?.addEventListener('click', async () => {
      const title = backdrop.querySelector('#board-name-input')?.value?.trim();
      if (!title) {
        alert('Please enter a board name');
        return;
      }

      const description = backdrop.querySelector('#board-desc-input')?.value || '';
      const color = backdrop.querySelector('#selected-board-color')?.value || '#4f46e5';
      const user = auth.getCurrentUser();

      try {
        if (isEditing) {
          await api.updateBoard(state.activeBoard.id, { title, description, color }, user.id);
          window.showToast?.('Board settings updated', 'success');
          this.close();
          await state.refreshBoard();
        } else {
          const newBoard = await api.createBoard({ title, description, color }, user.id);
          window.showToast?.('Board created successfully', 'success');
          this.close();
          await state.loadInitialData();
          await state.selectBoard(newBoard.id);
        }
      } catch (err) {
        alert(err.message);
      }
    });
  }
};

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
