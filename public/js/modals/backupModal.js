import { state } from '../state.js';
import { auth } from '../auth.js';
import { api } from '../api.js';

export const backupModal = {
  open() {
    this.render();
  },

  close() {
    const backdrop = document.getElementById('backup-modal-backdrop');
    if (backdrop) {
      backdrop.classList.remove('active');
      backdrop.style.display = 'none';
    }
  },

  render() {
    const backdrop = document.getElementById('backup-modal-backdrop');
    if (!backdrop) return;

    const isAdmin = auth.can('reset_data');

    let html = `
      <div class="modal-content active bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        <div class="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded-full bg-emerald-500 pulse-sync"></div>
            <h3 class="text-base font-bold text-slate-900">Data Persistence & Backup</h3>
          </div>
          <button id="backup-modal-close-btn" class="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <div class="p-6 space-y-5">
          <div class="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
            <svg class="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
            </svg>
            <div>
              <h4 class="text-xs font-bold text-emerald-900">Atomic Disk Persistence Active</h4>
              <p class="text-[11px] text-emerald-700 mt-0.5">
                All boards, columns, cards, checklists, and comments are stored in <code class="bg-emerald-100 px-1 py-0.5 rounded font-mono">data/database.json</code> with zero data loss across reboots.
              </p>
            </div>
          </div>

          <div class="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
            <div>
              <h4 class="text-xs font-bold text-slate-900">Export Backup File</h4>
              <p class="text-[11px] text-slate-500">Download the entire database state as formatted JSON</p>
            </div>
            <button id="backup-export-btn" class="px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition shadow-sm flex items-center gap-1.5">
              <svg class="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
              </svg>
              Download JSON
            </button>
          </div>

          <div class="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <div>
              <h4 class="text-xs font-bold text-slate-900">Restore from Backup</h4>
              <p class="text-[11px] text-slate-500">Upload a previously exported pulseflow JSON file</p>
            </div>
            ${isAdmin ? `
              <input type="file" id="backup-file-input" accept=".json" class="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer" />
            ` : `
              <p class="text-xs text-amber-600 bg-amber-50 p-2 rounded-xl border border-amber-200">Only Admins can import database files.</p>
            `}
          </div>

          ${isAdmin ? `
            <div class="p-4 bg-rose-50/50 border border-rose-200 rounded-2xl flex items-center justify-between">
              <div>
                <h4 class="text-xs font-bold text-rose-900">Reset Demo Data</h4>
                <p class="text-[11px] text-rose-600">Re-populate pristine default tasks & users</p>
              </div>
              <button id="backup-reset-btn" class="px-3 py-1.5 text-xs font-bold text-rose-700 bg-white border border-rose-300 hover:bg-rose-100 rounded-xl transition">
                Reset to Seed
              </button>
            </div>
          ` : ''}
        </div>

        <div class="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
          <button id="backup-close-bottom-btn" class="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-sm">
            Done
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
    const backdrop = document.getElementById('backup-modal-backdrop');
    if (!backdrop) return;

    backdrop.querySelector('#backup-modal-close-btn')?.addEventListener('click', () => this.close());
    backdrop.querySelector('#backup-close-bottom-btn')?.addEventListener('click', () => this.close());
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) this.close();
    });

    backdrop.querySelector('#backup-export-btn')?.addEventListener('click', () => {
      api.exportData();
      window.showToast?.('Database exported successfully', 'success');
    });

    const fileInput = backdrop.querySelector('#backup-file-input');
    if (fileInput) {
      fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
          const text = await file.text();
          const parsed = JSON.parse(text);
          const user = auth.getCurrentUser();
          await api.importData(parsed, user.id);
          window.showToast?.('Backup restored successfully!', 'success');
          this.close();
          await state.loadInitialData();
        } catch (err) {
          alert('Failed to parse and restore file: ' + err.message);
        }
      });
    }

    backdrop.querySelector('#backup-reset-btn')?.addEventListener('click', async () => {
      if (confirm('Reset database back to default demonstration sprint data? Any custom tasks will be overwritten.')) {
        const user = auth.getCurrentUser();
        try {
          await api.resetDatabase(user.id);
          window.showToast?.('Database reset to clean demo seed state', 'success');
          this.close();
          await state.loadInitialData();
        } catch (err) {
          alert(err.message);
        }
      }
    });
  }
};
