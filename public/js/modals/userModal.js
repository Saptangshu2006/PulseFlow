import { state } from '../state.js';
import { auth, ROLE_CONFIG } from '../auth.js';
import { api } from '../api.js';

export const userModal = {
  open() {
    this.render();
  },

  close() {
    const backdrop = document.getElementById('user-modal-backdrop');
    if (backdrop) {
      backdrop.classList.remove('active');
      backdrop.style.display = 'none';
    }
  },

  render() {
    const backdrop = document.getElementById('user-modal-backdrop');
    if (!backdrop) return;

    const users = state.users || [];
    const currentUser = auth.getCurrentUser();
    const isAdmin = auth.can('manage_users');

    let html = `
      <div class="modal-content active bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        <div class="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
          <div>
            <h3 class="text-base font-bold text-slate-900 flex items-center gap-2">
              <svg class="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
              </svg>
              Team & Role-Based Access Control (RBAC)
            </h3>
            <p class="text-xs text-slate-500 mt-0.5">Manage enterprise members, inspect capabilities, or assign granular roles</p>
          </div>
          <button id="user-modal-close-btn" class="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <div class="p-6 overflow-y-auto space-y-6 custom-scrollbar flex-1">
          <div class="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <img src="${currentUser?.avatar || ''}" class="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-300" />
              <div>
                <div class="flex items-center gap-2">
                  <span class="text-xs font-bold text-slate-900">Current Session: ${escapeHtml(currentUser?.name)}</span>
                  <span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${ROLE_CONFIG[currentUser?.role]?.badgeClass}">
                    ${currentUser?.role}
                  </span>
                </div>
                <p class="text-[11px] text-slate-600 mt-0.5">${ROLE_CONFIG[currentUser?.role]?.description}</p>
              </div>
            </div>
            <div class="text-xs text-indigo-700 font-semibold bg-white/80 px-3 py-1.5 rounded-xl border border-indigo-200">
              ⚡ Click any user below to switch session!
            </div>
          </div>

          <div>
            <div class="flex items-center justify-between mb-3">
              <h4 class="text-xs font-bold text-slate-800 uppercase tracking-wider">Team Directory (${users.length} members)</h4>
              ${isAdmin ? `
                <button id="toggle-add-user-btn" class="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                  <span>+ Add New Member</span>
                </button>
              ` : `
                <span class="text-[11px] text-slate-400 italic">Admin role required to invite members</span>
              `}
            </div>

            <div id="add-user-form-container" class="hidden mb-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <h5 class="text-xs font-bold text-slate-800">Add New Team Member</h5>
              <div class="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <input type="text" id="new-user-name" placeholder="Full Name..." class="text-xs border border-slate-200 rounded-xl p-2 bg-white" />
                <input type="email" id="new-user-email" placeholder="Email Address..." class="text-xs border border-slate-200 rounded-xl p-2 bg-white" />
                <input type="text" id="new-user-dept" placeholder="Department..." class="text-xs border border-slate-200 rounded-xl p-2 bg-white" />
                <select id="new-user-role" class="text-xs border border-slate-200 rounded-xl p-2 bg-white font-semibold">
                  <option value="developer">Developer</option>
                  <option value="manager">Project Manager</option>
                  <option value="viewer">Viewer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div class="flex justify-end gap-2">
                <button id="cancel-add-user-btn" class="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-xl">Cancel</button>
                <button id="submit-add-user-btn" class="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm">Save Member</button>
              </div>
            </div>

            <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <table class="w-full text-left text-xs">
                <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th class="py-3 px-4">Member</th>
                    <th class="py-3 px-4">Department</th>
                    <th class="py-3 px-4">Assigned Role</th>
                    <th class="py-3 px-4 text-right">Switch / Act</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  ${users.map(u => `
                    <tr class="hover:bg-slate-50 transition-colors ${u.id === currentUser?.id ? 'bg-indigo-50/30' : ''}">
                      <td class="py-3 px-4">
                        <div class="flex items-center gap-3">
                          <img src="${u.avatar}" class="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200" />
                          <div>
                            <div class="font-bold text-slate-900 flex items-center gap-1.5">
                              ${escapeHtml(u.name)}
                              ${u.id === currentUser?.id ? '<span class="text-[10px] text-indigo-600 font-bold">(You)</span>' : ''}
                            </div>
                            <div class="text-[11px] text-slate-400 font-mono">${escapeHtml(u.email)}</div>
                          </div>
                        </div>
                      </td>

                      <td class="py-3 px-4 text-slate-600">
                        ${escapeHtml(u.department || 'General')}
                      </td>

                      <td class="py-3 px-4">
                        ${isAdmin ? `
                          <select class="role-changer-select text-xs font-semibold py-1 px-2.5 rounded-xl border border-slate-200 bg-white shadow-sm focus:ring-2 focus:ring-indigo-500"
                                  data-user-id="${u.id}">
                            <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>👑 Admin</option>
                            <option value="manager" ${u.role === 'manager' ? 'selected' : ''}>💼 Project Manager</option>
                            <option value="developer" ${u.role === 'developer' ? 'selected' : ''}>💻 Developer</option>
                            <option value="viewer" ${u.role === 'viewer' ? 'selected' : ''}>👁️ Viewer</option>
                          </select>
                        ` : `
                          <span class="inline-block text-[11px] font-bold uppercase px-2 py-0.5 rounded-full ${ROLE_CONFIG[u.role]?.pillClass}">
                            ${u.role}
                          </span>
                        `}
                      </td>

                      <td class="py-3 px-4 text-right">
                        <button class="switch-session-btn px-3 py-1 rounded-xl text-xs font-bold ${u.id === currentUser?.id ? 'text-indigo-600 bg-indigo-100/60' : 'text-slate-700 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600'} transition"
                                data-user-id="${u.id}">
                          ${u.id === currentUser?.id ? 'Active' : 'Switch To'}
                        </button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>

          <div class="border-t border-slate-200 pt-5">
            <h4 class="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Role Capability & Permission Matrix</h4>
            <p class="text-xs text-slate-500 mb-3">Enforced automatically across UI drag handles, edit dialogs, and backend API routes.</p>

            <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <table class="w-full text-center text-xs">
                <thead class="bg-slate-50 border-b border-slate-200 font-bold uppercase text-[10px] text-slate-500">
                  <tr>
                    <th class="py-2.5 px-3 text-left">Action / Capability</th>
                    <th class="py-2.5 px-3 text-purple-700">👑 Admin</th>
                    <th class="py-2.5 px-3 text-blue-700">💼 Project Mgr</th>
                    <th class="py-2.5 px-3 text-emerald-700">💻 Developer</th>
                    <th class="py-2.5 px-3 text-amber-700">👁️ Viewer</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 text-xs">
                  <tr>
                    <td class="py-2.5 px-3 text-left font-medium text-slate-800">View Boards & Analytics</td>
                    <td class="py-2.5 px-3 text-emerald-600 font-bold">✓</td>
                    <td class="py-2.5 px-3 text-emerald-600 font-bold">✓</td>
                    <td class="py-2.5 px-3 text-emerald-600 font-bold">✓</td>
                    <td class="py-2.5 px-3 text-emerald-600 font-bold">✓</td>
                  </tr>
                  <tr class="bg-slate-50/40">
                    <td class="py-2.5 px-3 text-left font-medium text-slate-800">Drag-and-Drop Task Cards</td>
                    <td class="py-2.5 px-3 text-emerald-600 font-bold">✓</td>
                    <td class="py-2.5 px-3 text-emerald-600 font-bold">✓</td>
                    <td class="py-2.5 px-3 text-emerald-600 font-bold">✓</td>
                    <td class="py-2.5 px-3 text-rose-500 font-bold">✗</td>
                  </tr>
                  <tr>
                    <td class="py-2.5 px-3 text-left font-medium text-slate-800">Create & Edit Task Cards</td>
                    <td class="py-2.5 px-3 text-emerald-600 font-bold">✓</td>
                    <td class="py-2.5 px-3 text-emerald-600 font-bold">✓</td>
                    <td class="py-2.5 px-3 text-emerald-600 font-bold">✓</td>
                    <td class="py-2.5 px-3 text-rose-500 font-bold">✗</td>
                  </tr>
                  <tr class="bg-slate-50/40">
                    <td class="py-2.5 px-3 text-left font-medium text-slate-800">Toggle Subtasks Checklist</td>
                    <td class="py-2.5 px-3 text-emerald-600 font-bold">✓</td>
                    <td class="py-2.5 px-3 text-emerald-600 font-bold">✓</td>
                    <td class="py-2.5 px-3 text-emerald-600 font-bold">✓</td>
                    <td class="py-2.5 px-3 text-rose-500 font-bold">✗</td>
                  </tr>
                  <tr>
                    <td class="py-2.5 px-3 text-left font-medium text-slate-800">Add Discussion Comments</td>
                    <td class="py-2.5 px-3 text-emerald-600 font-bold">✓</td>
                    <td class="py-2.5 px-3 text-emerald-600 font-bold">✓</td>
                    <td class="py-2.5 px-3 text-emerald-600 font-bold">✓</td>
                    <td class="py-2.5 px-3 text-emerald-600 font-bold">✓</td>
                  </tr>
                  <tr class="bg-slate-50/40">
                    <td class="py-2.5 px-3 text-left font-medium text-slate-800">Delete Task Cards</td>
                    <td class="py-2.5 px-3 text-emerald-600 font-bold">✓</td>
                    <td class="py-2.5 px-3 text-emerald-600 font-bold">✓</td>
                    <td class="py-2.5 px-3 text-rose-500 font-bold">✗</td>
                    <td class="py-2.5 px-3 text-rose-500 font-bold">✗</td>
                  </tr>
                  <tr>
                    <td class="py-2.5 px-3 text-left font-medium text-slate-800">Add & Reorder Columns</td>
                    <td class="py-2.5 px-3 text-emerald-600 font-bold">✓</td>
                    <td class="py-2.5 px-3 text-emerald-600 font-bold">✓</td>
                    <td class="py-2.5 px-3 text-rose-500 font-bold">✗</td>
                    <td class="py-2.5 px-3 text-rose-500 font-bold">✗</td>
                  </tr>
                  <tr class="bg-slate-50/40">
                    <td class="py-2.5 px-3 text-left font-medium text-slate-800">Delete Boards</td>
                    <td class="py-2.5 px-3 text-emerald-600 font-bold">✓</td>
                    <td class="py-2.5 px-3 text-rose-500 font-bold">✗</td>
                    <td class="py-2.5 px-3 text-rose-500 font-bold">✗</td>
                    <td class="py-2.5 px-3 text-rose-500 font-bold">✗</td>
                  </tr>
                  <tr>
                    <td class="py-2.5 px-3 text-left font-medium text-slate-800">Manage Users & Roles</td>
                    <td class="py-2.5 px-3 text-emerald-600 font-bold">✓</td>
                    <td class="py-2.5 px-3 text-rose-500 font-bold">✗</td>
                    <td class="py-2.5 px-3 text-rose-500 font-bold">✗</td>
                    <td class="py-2.5 px-3 text-rose-500 font-bold">✗</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div class="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
          <button id="user-modal-done-btn" class="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-sm">
            Close
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
    const backdrop = document.getElementById('user-modal-backdrop');
    if (!backdrop) return;

    backdrop.querySelector('#user-modal-close-btn')?.addEventListener('click', () => this.close());
    backdrop.querySelector('#user-modal-done-btn')?.addEventListener('click', () => this.close());
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) this.close();
    });

    backdrop.querySelectorAll('.switch-session-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const userId = btn.getAttribute('data-user-id');
        auth.switchUser(userId, state.users);
        window.showToast?.(`Switched active session to ${auth.getCurrentUser().name}`, 'success');
        this.render();
        state.notify('user_switched');
      });
    });

    backdrop.querySelectorAll('.role-changer-select').forEach(sel => {
      sel.addEventListener('change', async () => {
        const userId = sel.getAttribute('data-user-id');
        const newRole = sel.value;
        const currentUser = auth.getCurrentUser();

        try {
          await api.updateUser(userId, { role: newRole }, currentUser.id);
          window.showToast?.(`Role updated for user`, 'success');
          await state.loadInitialData();
          this.render();
        } catch (err) {
          alert(err.message);
        }
      });
    });

    const toggleBtn = backdrop.querySelector('#toggle-add-user-btn');
    const formContainer = backdrop.querySelector('#add-user-form-container');
    const cancelAddBtn = backdrop.querySelector('#cancel-add-user-btn');
    const submitAddBtn = backdrop.querySelector('#submit-add-user-btn');

    if (toggleBtn && formContainer) {
      toggleBtn.addEventListener('click', () => formContainer.classList.toggle('hidden'));
    }
    if (cancelAddBtn && formContainer) {
      cancelAddBtn.addEventListener('click', () => formContainer.classList.add('hidden'));
    }
    if (submitAddBtn) {
      submitAddBtn.addEventListener('click', async () => {
        const name = backdrop.querySelector('#new-user-name')?.value?.trim();
        const email = backdrop.querySelector('#new-user-email')?.value?.trim();
        const department = backdrop.querySelector('#new-user-dept')?.value?.trim();
        const role = backdrop.querySelector('#new-user-role')?.value || 'developer';

        if (!name) {
          alert('Name is required');
          return;
        }

        const currentUser = auth.getCurrentUser();
        try {
          await api.createUser({ name, email, department, role }, currentUser.id);
          window.showToast?.(`New user ${name} created`, 'success');
          await state.loadInitialData();
          this.render();
        } catch (err) {
          alert(err.message);
        }
      });
    }
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
