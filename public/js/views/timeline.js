import { state } from '../state.js';
import { cardModal } from '../modals/cardModal.js';

export const timelineView = {
  render(container) {
    if (!state.activeBoard) {
      container.innerHTML = `<div class="p-8 text-center text-slate-400">No active board selected</div>`;
      return;
    }

    const board = state.activeBoard;
    const tasks = state.getFilteredTasks().filter(t => t.dueDate);
    const users = state.users || [];

    if (tasks.length === 0) {
      container.innerHTML = `
        <div class="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <svg class="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
          </svg>
          <h3 class="font-bold text-slate-800 text-base mb-1">No tasks with due dates</h3>
          <p class="text-xs text-slate-500 mb-4">Set due dates on tasks to visualize milestones on the project timeline.</p>
        </div>
      `;
      return;
    }

    const now = new Date();
    const dates = tasks.map(t => new Date(t.dueDate + 'T00:00:00').getTime());
    dates.push(now.getTime());

    const minDate = new Date(Math.min(...dates) - 3 * 86400000);
    const maxDate = new Date(Math.max(...dates) + 5 * 86400000);

    const totalDays = Math.ceil((maxDate - minDate) / 86400000) || 14;
    const dayHeaders = [];

    for (let i = 0; i < totalDays; i++) {
      const d = new Date(minDate.getTime() + i * 86400000);
      const isToday = d.toDateString() === now.toDateString();
      const monthShort = d.toLocaleString('default', { month: 'short' });
      const dayNum = d.getDate();
      const dayName = d.toLocaleString('default', { weekday: 'narrow' });
      dayHeaders.push({ date: d, isToday, label: `${monthShort} ${dayNum}`, dayName });
    }

    let html = `
      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div class="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
          <div>
            <h2 class="text-base font-bold text-slate-900">${escapeHtml(board.title)} — Timeline / Gantt</h2>
            <p class="text-xs text-slate-500">Visual schedule and delivery forecast across calendar days</p>
          </div>
          <div class="flex items-center gap-3 text-xs">
            <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-rose-500"></span> Urgent</span>
            <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-amber-500"></span> High</span>
            <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-indigo-500"></span> Medium</span>
            <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-slate-400"></span> Low</span>
          </div>
        </div>

        <div class="overflow-x-auto p-4 custom-scrollbar">
          <div class="min-w-[900px]">
            <div class="grid" style="grid-template-columns: 240px repeat(${totalDays}, minmax(42px, 1fr));">
              <div class="font-bold text-xs text-slate-500 pb-3 border-b border-slate-200">Task Name</div>
              ${dayHeaders.map(dh => `
                <div class="text-center pb-2 border-b border-slate-200 ${dh.isToday ? 'bg-indigo-50/80 rounded-t-lg' : ''}">
                  <div class="text-[10px] uppercase font-bold text-slate-400">${dh.dayName}</div>
                  <div class="text-xs font-semibold ${dh.isToday ? 'text-indigo-600 font-bold' : 'text-slate-600'}">${dh.label}</div>
                </div>
              `).join('')}
            </div>

            <div class="divide-y divide-slate-100">
    `;

    tasks.forEach(task => {
      const assignee = users.find(u => u.id === task.assigneeId);
      const taskDue = new Date(task.dueDate + 'T00:00:00');
      const startEst = new Date(task.createdAt || now);
      let startPoint = startEst < minDate ? minDate : (startEst > taskDue ? new Date(taskDue.getTime() - 2 * 86400000) : startEst);

      const offsetDays = Math.max(0, Math.floor((startPoint - minDate) / 86400000));
      const spanDays = Math.max(1, Math.ceil((taskDue - startPoint) / 86400000));

      const checklist = task.checklist || [];
      const pct = checklist.length > 0 ? Math.round((checklist.filter(c => c.completed).length / checklist.length) * 100) : 0;
      const barColor = getPriorityColorHex(task.priority);

      html += `
        <div class="grid items-center py-2.5 hover:bg-slate-50 transition-colors group"
             style="grid-template-columns: 240px repeat(${totalDays}, minmax(42px, 1fr));">
          <div class="pr-3 flex items-center gap-2 overflow-hidden cursor-pointer" onclick="window.pulseflowOpenTask('${task.id}')">
            ${assignee ? `
              <img src="${assignee.avatar}" class="w-5 h-5 rounded-full object-cover flex-shrink-0" />
            ` : ''}
            <span class="text-xs font-semibold text-slate-800 truncate group-hover:text-indigo-600 transition-colors" title="${escapeHtml(task.title)}">
              ${escapeHtml(task.title)}
            </span>
          </div>

          <div class="col-span-${totalDays} relative h-7 flex items-center" style="grid-column: 2 / span ${totalDays};">
            <div class="gantt-bar absolute h-6 rounded-lg text-[10px] text-white font-medium flex items-center px-2 cursor-pointer shadow-sm overflow-hidden"
                 style="left: ${(offsetDays / totalDays) * 100}%; width: ${Math.max(4, (spanDays / totalDays) * 100)}%; background-color: ${barColor};"
                 onclick="window.pulseflowOpenTask('${task.id}')"
                 title="${escapeHtml(task.title)} | Due: ${task.dueDate} (${pct}% subtasks done)">

              ${pct > 0 ? `
                <div class="absolute inset-y-0 left-0 bg-white/20" style="width: ${pct}%;"></div>
              ` : ''}

              <span class="relative z-10 truncate font-semibold drop-shadow-sm">${escapeHtml(task.title)}</span>
            </div>
          </div>
        </div>
      `;
    });

    html += `
            </div>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;

    window.pulseflowOpenTask = (taskId) => {
      const task = board.tasks.find(t => t.id === taskId);
      if (task) cardModal.open(task);
    };
  }
};

function getPriorityColorHex(priority) {
  switch (priority) {
    case 'urgent': return '#e11d48';
    case 'high': return '#ea580c';
    case 'medium': return '#4f46e5';
    case 'low': return '#64748b';
    default: return '#4f46e5';
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
