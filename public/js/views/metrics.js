import { state } from '../state.js';

let statusChartInstance = null;
let priorityChartInstance = null;
let workloadChartInstance = null;

export const metricsView = {
  render(container) {
    if (!state.activeBoard) {
      container.innerHTML = `<div class="p-8 text-center text-slate-400">No active board selected</div>`;
      return;
    }

    const board = state.activeBoard;
    const tasks = board.tasks || [];
    const lists = board.lists || [];
    const users = state.users || [];
    const activities = state.activities || [];

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => {
      const list = lists.find(l => l.id === t.listId);
      return list && list.title.toLowerCase().includes('done');
    }).length;

    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const now = Date.now();
    const overdueTasks = tasks.filter(t => {
      if (!t.dueDate) return false;
      const list = lists.find(l => l.id === t.listId);
      if (list && list.title.toLowerCase().includes('done')) return false;
      return new Date(t.dueDate + 'T23:59:59').getTime() < now;
    }).length;

    const totalEstHours = tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
    const totalLoggedHours = tasks.reduce((sum, t) => sum + (t.loggedHours || 0), 0);

    let html = `
      <div class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Tasks</p>
              <h3 class="text-3xl font-extrabold text-slate-900 mt-1">${totalTasks}</h3>
              <p class="text-xs text-slate-400 mt-1">Across ${lists.length} columns</p>
            </div>
            <div class="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
              </svg>
            </div>
          </div>

          <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Completion Rate</p>
              <h3 class="text-3xl font-extrabold text-emerald-600 mt-1">${completionRate}%</h3>
              <p class="text-xs text-slate-400 mt-1">${completedTasks} of ${totalTasks} completed</p>
            </div>
            <div class="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
          </div>

          <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Overdue Tasks</p>
              <h3 class="text-3xl font-extrabold ${overdueTasks > 0 ? 'text-rose-600' : 'text-slate-800'} mt-1">${overdueTasks}</h3>
              <p class="text-xs ${overdueTasks > 0 ? 'text-rose-500 font-medium' : 'text-slate-400'} mt-1">
                ${overdueTasks > 0 ? 'Requires immediate action' : 'All milestones on schedule'}
              </p>
            </div>
            <div class="w-12 h-12 rounded-xl ${overdueTasks > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-500'} flex items-center justify-center">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
          </div>

          <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Effort Logged</p>
              <h3 class="text-3xl font-extrabold text-indigo-900 mt-1">${totalLoggedHours}h</h3>
              <p class="text-xs text-slate-400 mt-1">${totalEstHours}h estimated total</p>
            </div>
            <div class="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
            <h4 class="text-sm font-bold text-slate-900 mb-3">Tasks by Status</h4>
            <div class="flex-1 relative min-h-[240px]">
              <canvas id="chart-status"></canvas>
            </div>
          </div>

          <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
            <h4 class="text-sm font-bold text-slate-900 mb-3">Priority Distribution</h4>
            <div class="flex-1 relative min-h-[240px]">
              <canvas id="chart-priority"></canvas>
            </div>
          </div>

          <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
            <h4 class="text-sm font-bold text-slate-900 mb-3">Team Member Workload</h4>
            <div class="flex-1 relative min-h-[240px]">
              <canvas id="chart-workload"></canvas>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div class="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <svg class="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <h4 class="text-sm font-bold text-slate-900">Real-Time Activity Audit Trail</h4>
            </div>
            <span class="text-xs text-slate-400">Persistent Event Log</span>
          </div>
          <div class="divide-y divide-slate-100 max-h-80 overflow-y-auto custom-scrollbar">
      `;

    if (activities.length === 0) {
      html += `<div class="p-6 text-center text-slate-400 text-xs">No activity logged yet</div>`;
    } else {
      activities.slice(0, 15).forEach(act => {
        const timeAgo = formatTimeAgo(act.timestamp);
        html += `
          <div class="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50 transition-colors">
            <div class="flex items-center gap-3">
              <img src="${act.userAvatar || 'https://api.dicebear.com/7.x/initials/svg?seed=' + encodeURIComponent(act.userName)}"
                   class="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200" />
              <div>
                <span class="font-bold text-slate-800">${escapeHtml(act.userName)}</span>
                <span class="text-slate-600 ml-1">${escapeHtml(act.details)}</span>
              </div>
            </div>
            <span class="text-[11px] text-slate-400 font-mono whitespace-nowrap ml-4">${timeAgo}</span>
          </div>
        `;
      });
    }

    html += `
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;

    setTimeout(() => {
      this.initCharts(tasks, lists, users);
    }, 50);
  },

  initCharts(tasks, lists, users) {
    if (typeof Chart === 'undefined') return;

    const statusCtx = document.getElementById('chart-status');
    if (statusCtx) {
      if (statusChartInstance) statusChartInstance.destroy();
      const statusLabels = lists.map(l => l.title);
      const statusCounts = lists.map(l => tasks.filter(t => t.listId === l.id).length);

      statusChartInstance = new Chart(statusCtx, {
        type: 'doughnut',
        data: {
          labels: statusLabels,
          datasets: [{
            data: statusCounts,
            backgroundColor: ['#94a3b8', '#3b82f6', '#6366f1', '#f59e0b', '#10b981', '#8b5cf6'],
            borderWidth: 2,
            borderColor: '#ffffff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } }
          }
        }
      });
    }

    const priorityCtx = document.getElementById('chart-priority');
    if (priorityCtx) {
      if (priorityChartInstance) priorityChartInstance.destroy();
      const priorities = ['urgent', 'high', 'medium', 'low'];
      const counts = priorities.map(p => tasks.filter(t => t.priority === p).length);

      priorityChartInstance = new Chart(priorityCtx, {
        type: 'bar',
        data: {
          labels: ['Urgent', 'High', 'Medium', 'Low'],
          datasets: [{
            label: 'Tasks',
            data: counts,
            backgroundColor: ['#ef4444', '#f97316', '#6366f1', '#94a3b8'],
            borderRadius: 8
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, ticks: { precision: 0, font: { size: 10 } }, grid: { color: '#f1f5f9' } },
            x: { grid: { display: false }, ticks: { font: { size: 11, weight: 'bold' } } }
          }
        }
      });
    }

    const workloadCtx = document.getElementById('chart-workload');
    if (workloadCtx) {
      if (workloadChartInstance) workloadChartInstance.destroy();
      const assigneeNames = users.map(u => u.name.split(' ')[0]);
      const taskCounts = users.map(u => tasks.filter(t => t.assigneeId === u.id).length);

      workloadChartInstance = new Chart(workloadCtx, {
        type: 'bar',
        data: {
          labels: assigneeNames,
          datasets: [{
            label: 'Assigned Tasks',
            data: taskCounts,
            backgroundColor: '#4f46e5',
            borderRadius: 8
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: '#f1f5f9' } },
            y: { grid: { display: false }, ticks: { font: { size: 11, weight: '600' } } }
          }
        }
      });
    }
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

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
