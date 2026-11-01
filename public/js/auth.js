export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  DEVELOPER: 'developer',
  VIEWER: 'viewer'
};

export const ROLE_CONFIG = {
  [ROLES.ADMIN]: {
    name: 'Administrator',
    badgeClass: 'role-badge-admin',
    pillClass: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: '👑',
    description: 'Full administrative access across boards, users, settings, and database backups.',
    permissions: [
      'create_board', 'edit_board', 'delete_board',
      'create_list', 'edit_list', 'delete_list', 'reorder_list',
      'create_task', 'edit_task', 'delete_task', 'move_task',
      'manage_checklist', 'comment', 'manage_users', 'export_data', 'import_data', 'reset_data'
    ]
  },
  [ROLES.MANAGER]: {
    name: 'Project Manager',
    badgeClass: 'role-badge-manager',
    pillClass: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: '💼',
    description: 'Can manage boards, columns, milestones, create & delete tasks, assign members, and set WIP limits.',
    permissions: [
      'create_board', 'edit_board',
      'create_list', 'edit_list', 'delete_list', 'reorder_list',
      'create_task', 'edit_task', 'delete_task', 'move_task',
      'manage_checklist', 'comment', 'export_data'
    ]
  },
  [ROLES.DEVELOPER]: {
    name: 'Developer / Member',
    badgeClass: 'role-badge-developer',
    pillClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    icon: '💻',
    description: 'Can create tasks, update checklists, log hours, drag-and-drop cards, and comment.',
    permissions: [
      'create_task', 'edit_task', 'move_task',
      'manage_checklist', 'comment', 'export_data'
    ]
  },
  [ROLES.VIEWER]: {
    name: 'Viewer / Stakeholder',
    badgeClass: 'role-badge-viewer',
    pillClass: 'bg-amber-100 text-amber-800 border-amber-200',
    icon: '👁️',
    description: 'Read-only access to view boards, cards, analytics, and timeline. Drag & drop and task edits are disabled.',
    permissions: [
      'comment', 'export_data'
    ]
  }
};

class AuthManager {
  constructor() {
    this.currentUser = null;
    this.subscribers = [];
  }

  init(users) {
    const savedUserId = localStorage.getItem('pulseflow_user_id');
    const matched = users.find(u => u.id === savedUserId);
    this.currentUser = matched || users[0] || null;
    return this.currentUser;
  }

  getCurrentUser() {
    return this.currentUser;
  }

  setCurrentUser(user) {
    this.currentUser = user;
    if (user && user.id) {
      localStorage.setItem('pulseflow_user_id', user.id);
    }
    this.notify();
  }

  switchUser(userId, usersList) {
    const user = usersList.find(u => u.id === userId);
    if (user) {
      this.setCurrentUser(user);
    }
  }

  can(permission, userOverride = null) {
    const user = userOverride || this.currentUser;
    if (!user) return false;
    const roleConfig = ROLE_CONFIG[user.role];
    if (!roleConfig) return false;
    return roleConfig.permissions.includes(permission);
  }

  getRoleConfig(role) {
    return ROLE_CONFIG[role] || ROLE_CONFIG[ROLES.VIEWER];
  }

  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  notify() {
    this.subscribers.forEach(cb => cb(this.currentUser));
  }
}

export const auth = new AuthManager();
