const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Default seed data with realistic enterprise project tasks
function getDefaultSeedData() {
  const adminId = 'user-admin-1';
  const pmId = 'user-pm-1';
  const dev1Id = 'user-dev-1';
  const dev2Id = 'user-dev-2';
  const viewerId = 'user-viewer-1';

  const users = [
    {
      id: adminId,
      name: 'Alex Rivera',
      email: 'alex.rivera@enterprise.io',
      role: 'admin',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face',
      department: 'Engineering Leadership'
    },
    {
      id: pmId,
      name: 'Sarah Chen',
      email: 'sarah.chen@enterprise.io',
      role: 'manager',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop&crop=face',
      department: 'Product Management'
    },
    {
      id: dev1Id,
      name: 'Liam Patel',
      email: 'liam.patel@enterprise.io',
      role: 'developer',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
      department: 'Frontend Engineering'
    },
    {
      id: dev2Id,
      name: 'Marcus Vance',
      email: 'marcus.v@enterprise.io',
      role: 'developer',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
      department: 'Backend Architecture'
    },
    {
      id: viewerId,
      name: 'Elena Rostova',
      email: 'elena.r@enterprise.io',
      role: 'viewer',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop&crop=face',
      department: 'Stakeholder & Executive Review'
    }
  ];

  const board1Id = 'board-sprint-42';
  const board2Id = 'board-design-sys';
  const board3Id = 'board-cloud-infra';

  const boards = [
    {
      id: board1Id,
      title: 'Q4 Product Launch (Sprint 42)',
      description: 'Core product features, payment gateway upgrade, and security compliance audit.',
      color: '#4f46e5',
      icon: 'rocket',
      createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
      lists: [
        { id: 'list-1-backlog', title: 'Product Backlog', order: 0, wipLimit: 10 },
        { id: 'list-1-todo', title: 'Ready for Dev', order: 1, wipLimit: 6 },
        { id: 'list-1-progress', title: 'In Progress', order: 2, wipLimit: 4 },
        { id: 'list-1-review', title: 'Code Review & QA', order: 3, wipLimit: 3 },
        { id: 'list-1-done', title: 'Shipped / Done', order: 4, wipLimit: 0 }
      ],
      tasks: [
        {
          id: 'task-101',
          boardId: board1Id,
          listId: 'list-1-progress',
          title: 'Implement OAuth2 & Multi-Factor Authentication',
          description: 'Integrate WebAuthn, hardware key support, and SMS/TOTP fallback according to NIST guidelines.',
          priority: 'urgent',
          assigneeId: dev2Id,
          dueDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
          estimatedHours: 16,
          loggedHours: 10,
          tags: ['Security', 'Backend', 'Auth'],
          order: 0,
          checklist: [
            { id: 'chk-1', text: 'Define DB schema for 2FA secrets', completed: true },
            { id: 'chk-2', text: 'Implement TOTP QR code generator', completed: true },
            { id: 'chk-3', text: 'Add WebAuthn biometric passkey handler', completed: false },
            { id: 'chk-4', text: 'Write end-to-end security integration tests', completed: false }
          ],
          comments: [
            {
              id: 'c-1',
              userId: pmId,
              userName: 'Sarah Chen',
              userRole: 'manager',
              userAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop&crop=face',
              text: 'Please ensure Passkey registration falls back gracefully on older Safari browsers.',
              createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
            },
            {
              id: 'c-2',
              userId: dev2Id,
              userName: 'Marcus Vance',
              userRole: 'developer',
              userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
              text: 'Done! Testing WebAuthn simulator with Chrome DevTools right now.',
              createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
            }
          ],
          createdAt: new Date(Date.now() - 5 * 86400000).toISOString()
        },
        {
          id: 'task-102',
          boardId: board1Id,
          listId: 'list-1-progress',
          title: 'Interactive Kanban Drag-and-Drop Optimization',
          description: 'Enhance drop indicator lines, keyboard accessibility (ARIA drag-drop), and optimistic position state updates.',
          priority: 'high',
          assigneeId: dev1Id,
          dueDate: new Date(Date.now() + 1 * 86400000).toISOString().split('T')[0],
          estimatedHours: 12,
          loggedHours: 8,
          tags: ['Frontend', 'UX', 'DnD'],
          order: 1,
          checklist: [
            { id: 'chk-11', text: 'HTML5 native drag event handling', completed: true },
            { id: 'chk-12', text: 'Ghost thumbnail custom styling', completed: true },
            { id: 'chk-13', text: 'Reorder cards within same column', completed: true },
            { id: 'chk-14', text: 'Permission guard against read-only viewer roles', completed: true }
          ],
          comments: [],
          createdAt: new Date(Date.now() - 4 * 86400000).toISOString()
        },
        {
          id: 'task-103',
          boardId: board1Id,
          listId: 'list-1-todo',
          title: 'Stripe Billing & Invoice Webhook Service',
          description: 'Handle customer subscription renewal, charge failure retries, and invoice PDF dispatch via automated emails.',
          priority: 'high',
          assigneeId: dev2Id,
          dueDate: new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0],
          estimatedHours: 20,
          loggedHours: 0,
          tags: ['Billing', 'API', 'Stripe'],
          order: 0,
          checklist: [
            { id: 'chk-21', text: 'Verify webhook cryptographic signature', completed: false },
            { id: 'chk-22', text: 'Handle invoice.payment_succeeded event', completed: false },
            { id: 'chk-23', text: 'Handle customer.subscription.deleted event', completed: false }
          ],
          comments: [],
          createdAt: new Date(Date.now() - 3 * 86400000).toISOString()
        },
        {
          id: 'task-104',
          boardId: board1Id,
          listId: 'list-1-review',
          title: 'Database Query Indexing & Full-Text Search',
          description: 'Benchmark search queries across 100k tasks, create GIN / composite indexes, and optimize latency under 25ms.',
          priority: 'medium',
          assigneeId: dev2Id,
          dueDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
          estimatedHours: 8,
          loggedHours: 7,
          tags: ['Database', 'Performance'],
          order: 0,
          checklist: [
            { id: 'chk-31', text: 'Run EXPLAIN ANALYZE on board join queries', completed: true },
            { id: 'chk-32', text: 'Add composite indexes on board_id + list_id + order', completed: true }
          ],
          comments: [
            {
              id: 'c-3',
              userId: adminId,
              userName: 'Alex Rivera',
              userRole: 'admin',
              userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face',
              text: '99th percentile response time dropped from 140ms to 18ms. Approved for merge.',
              createdAt: new Date(Date.now() - 3600000).toISOString()
            }
          ],
          createdAt: new Date(Date.now() - 6 * 86400000).toISOString()
        },
        {
          id: 'task-105',
          boardId: board1Id,
          listId: 'list-1-done',
          title: 'Role-Based Access Control (RBAC) Specification',
          description: 'Formalize permission matrix for Admin, Project Manager, Developer, and Viewer roles with granular capability flags.',
          priority: 'urgent',
          assigneeId: pmId,
          dueDate: new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0],
          estimatedHours: 6,
          loggedHours: 6,
          tags: ['RBAC', 'Architecture', 'Security'],
          order: 0,
          checklist: [
            { id: 'chk-41', text: 'Draft permission matrix RFC', completed: true },
            { id: 'chk-42', text: 'Get sign-off from Alex and compliance officer', completed: true }
          ],
          comments: [],
          createdAt: new Date(Date.now() - 7 * 86400000).toISOString()
        },
        {
          id: 'task-106',
          boardId: board1Id,
          listId: 'list-1-backlog',
          title: 'Export to CSV / PDF Executive Summary',
          description: 'Allow project managers to generate one-click status reports with burn-down velocity and completion metrics.',
          priority: 'low',
          assigneeId: dev1Id,
          dueDate: new Date(Date.now() + 8 * 86400000).toISOString().split('T')[0],
          estimatedHours: 10,
          loggedHours: 0,
          tags: ['Reporting', 'Export'],
          order: 0,
          checklist: [
            { id: 'chk-51', text: 'Format JSON/CSV export engine', completed: true },
            { id: 'chk-52', text: 'Generate styled PDF executive report', completed: false }
          ],
          comments: [],
          createdAt: new Date(Date.now() - 2 * 86400000).toISOString()
        },
        {
          id: 'task-107',
          boardId: board1Id,
          listId: 'list-1-todo',
          title: 'Dark Mode Glassmorphic UI Polishing',
          description: 'Refine high-contrast dark palette, glowing active states, and WCAG AA contrast compliance across all cards.',
          priority: 'medium',
          assigneeId: dev1Id,
          dueDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
          estimatedHours: 8,
          loggedHours: 2,
          tags: ['Design', 'UI/UX'],
          order: 1,
          checklist: [
            { id: 'chk-61', text: 'Audit contrast ratios with Chrome Lighthouse', completed: true },
            { id: 'chk-62', text: 'Support system theme preference sync', completed: false }
          ],
          comments: [],
          createdAt: new Date(Date.now() - 1 * 86400000).toISOString()
        }
      ]
    },
    {
      id: board2Id,
      title: 'Design System & UI Components',
      description: 'Unified React component library, design tokens, iconography, and accessible modal dialogs.',
      color: '#0ea5e9',
      icon: 'palette',
      createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
      lists: [
        { id: 'list-2-concepts', title: 'Design Concepts', order: 0, wipLimit: 5 },
        { id: 'list-2-figma', title: 'Figma Review', order: 1, wipLimit: 4 },
        { id: 'list-2-coding', title: 'React Implementation', order: 2, wipLimit: 4 },
        { id: 'list-2-storybook', title: 'Documented in Storybook', order: 3, wipLimit: 0 }
      ],
      tasks: [
        {
          id: 'task-201',
          boardId: board2Id,
          listId: 'list-2-coding',
          title: 'Accessible Modal Dialog with Focus Trap',
          description: 'Build WCAG 2.1 compliant modal system with ESC key dismissal, focus trap, and backdrop blur.',
          priority: 'high',
          assigneeId: dev1Id,
          dueDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
          estimatedHours: 8,
          loggedHours: 5,
          tags: ['Accessibility', 'UI'],
          order: 0,
          checklist: [
            { id: 'c-201-1', text: 'Focus lock on active dialog', completed: true },
            { id: 'c-201-2', text: 'Restore focus on modal close', completed: true },
            { id: 'c-201-3', text: 'Smooth backdrop fade animation', completed: true }
          ],
          comments: [],
          createdAt: new Date(Date.now() - 4 * 86400000).toISOString()
        },
        {
          id: 'task-202',
          boardId: board2Id,
          listId: 'list-2-storybook',
          title: 'Color Tokens & Tailwind Extension',
          description: 'Establish semantic color palette for alerts, priorities, avatars, and neutral surfaces.',
          priority: 'medium',
          assigneeId: dev1Id,
          dueDate: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
          estimatedHours: 6,
          loggedHours: 6,
          tags: ['Tokens', 'Tailwind'],
          order: 0,
          checklist: [
            { id: 'c-202-1', text: 'Generate CSS custom properties', completed: true }
          ],
          comments: [],
          createdAt: new Date(Date.now() - 10 * 86400000).toISOString()
        }
      ]
    },
    {
      id: board3Id,
      title: 'Cloud Infrastructure & SRE',
      description: 'Zero-downtime Kubernetes deployment, automated SSL renewal, Prometheus metrics, and daily backups.',
      color: '#10b981',
      icon: 'server',
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
      lists: [
        { id: 'list-3-todo', title: 'Planned Work', order: 0, wipLimit: 8 },
        { id: 'list-3-infra', title: 'Terraform & Staging', order: 1, wipLimit: 3 },
        { id: 'list-3-prod', title: 'Production Ready', order: 2, wipLimit: 0 }
      ],
      tasks: [
        {
          id: 'task-301',
          boardId: board3Id,
          listId: 'list-3-infra',
          title: 'Automated Database Backup with Point-In-Time Recovery',
          description: 'Configure daily WAL archiving to encrypted S3 bucket with hourly delta snapshots.',
          priority: 'urgent',
          assigneeId: adminId,
          dueDate: new Date(Date.now() + 1 * 86400000).toISOString().split('T')[0],
          estimatedHours: 12,
          loggedHours: 9,
          tags: ['DevOps', 'Backup', 'Security'],
          order: 0,
          checklist: [
            { id: 'c-301-1', text: 'Terraform S3 bucket with KMS encryption', completed: true },
            { id: 'c-301-2', text: 'Cron disaster recovery test script', completed: true },
            { id: 'c-301-3', text: 'Verify drill restore in staging cluster', completed: false }
          ],
          comments: [],
          createdAt: new Date(Date.now() - 3 * 86400000).toISOString()
        }
      ]
    }
  ];

  const activities = [
    {
      id: 'act-1',
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
      userId: dev1Id,
      userName: 'Liam Patel',
      userRole: 'developer',
      userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
      action: 'moved_task',
      details: 'moved "Interactive Kanban Drag-and-Drop Optimization" to In Progress'
    },
    {
      id: 'act-2',
      timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
      userId: pmId,
      userName: 'Sarah Chen',
      userRole: 'manager',
      userAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop&crop=face',
      action: 'commented',
      details: 'commented on "Implement OAuth2 & Multi-Factor Authentication"'
    },
    {
      id: 'act-3',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      userId: adminId,
      userName: 'Alex Rivera',
      userRole: 'admin',
      userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face',
      action: 'completed_task',
      details: 'approved and marked "Role-Based Access Control (RBAC) Specification" as Done'
    }
  ];

  return { users, boards, activities };
}

// Database helper functions with safe file persistence
function loadDb() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      const seed = getDefaultSeedData();
      saveDb(seed);
      return seed;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading database file, returning default seed:', err);
    return getDefaultSeedData();
  }
}

function saveDb(data) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tempFile = `${DB_FILE}.${Date.now()}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error('Error saving database file:', err);
  }
}

function logActivity(db, userId, action, details) {
  const user = db.users.find(u => u.id === userId) || {
    name: 'Unknown User',
    role: 'viewer',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face'
  };

  const newActivity = {
    id: `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    userId: user.id || userId,
    userName: user.name,
    userRole: user.role,
    userAvatar: user.avatar,
    action,
    details
  };

  db.activities.unshift(newActivity);
  if (db.activities.length > 100) {
    db.activities = db.activities.slice(0, 100);
  }
}

// ======================== API ROUTES ========================

app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    appName: 'PulseFlow Project Management Dashboard'
  });
});

app.get('/api/users', (req, res) => {
  const db = loadDb();
  res.json(db.users);
});

app.post('/api/users', (req, res) => {
  const { name, email, role, department, avatar, requestingUserId } = req.body;
  if (!name || !role) {
    return res.status(400).json({ error: 'Name and role are required' });
  }

  const db = loadDb();
  const requester = db.users.find(u => u.id === requestingUserId);
  if (requester && requester.role !== 'admin') {
    return res.status(403).json({ error: 'Permission denied. Only Admins can manage users.' });
  }

  const newUser = {
    id: `user-${Date.now()}`,
    name,
    email: email || `${name.toLowerCase().replace(/\s+/g, '.')}@enterprise.io`,
    role: role || 'developer',
    avatar: avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
    department: department || 'General'
  };

  db.users.push(newUser);
  logActivity(db, requestingUserId, 'created_user', `created user ${newUser.name} with role ${newUser.role}`);
  saveDb(db);
  res.status(201).json(newUser);
});

app.put('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const { name, email, role, department, requestingUserId } = req.body;

  const db = loadDb();
  const requester = db.users.find(u => u.id === requestingUserId);
  if (requester && requester.role !== 'admin') {
    return res.status(403).json({ error: 'Permission denied. Only Admins can update users.' });
  }

  const userIdx = db.users.findIndex(u => u.id === id);
  if (userIdx === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  db.users[userIdx] = {
    ...db.users[userIdx],
    ...(name && { name }),
    ...(email && { email }),
    ...(role && { role }),
    ...(department && { department })
  };

  logActivity(db, requestingUserId, 'updated_user', `updated user ${db.users[userIdx].name} (role: ${db.users[userIdx].role})`);
  saveDb(db);
  res.json(db.users[userIdx]);
});

app.get('/api/boards', (req, res) => {
  const db = loadDb();
  const boardSummaries = db.boards.map(b => {
    const totalTasks = b.tasks.length;
    const completedTasks = b.tasks.filter(t => {
      const list = b.lists.find(l => l.id === t.listId);
      return list && list.title.toLowerCase().includes('done');
    }).length;
    return {
      id: b.id,
      title: b.title,
      description: b.description,
      color: b.color,
      icon: b.icon,
      createdAt: b.createdAt,
      updatedAt: b.updatedAt,
      listCount: b.lists.length,
      taskCount: totalTasks,
      completedTaskCount: completedTasks
    };
  });
  res.json(boardSummaries);
});

app.get('/api/boards/:id', (req, res) => {
  const { id } = req.params;
  const db = loadDb();
  const board = db.boards.find(b => b.id === id);
  if (!board) {
    return res.status(404).json({ error: 'Board not found' });
  }
  res.json(board);
});

app.post('/api/boards', (req, res) => {
  const { title, description, color, icon, requestingUserId } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  const db = loadDb();
  const requester = db.users.find(u => u.id === requestingUserId);
  if (requester && requester.role === 'viewer') {
    return res.status(403).json({ error: 'Permission denied. Viewers cannot create boards.' });
  }

  const newBoard = {
    id: `board-${Date.now()}`,
    title,
    description: description || '',
    color: color || '#4f46e5',
    icon: icon || 'kanban',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lists: [
      { id: `list-${Date.now()}-1`, title: 'To Do', order: 0, wipLimit: 0 },
      { id: `list-${Date.now()}-2`, title: 'In Progress', order: 1, wipLimit: 5 },
      { id: `list-${Date.now()}-3`, title: 'Review', order: 2, wipLimit: 3 },
      { id: `list-${Date.now()}-4`, title: 'Done', order: 3, wipLimit: 0 }
    ],
    tasks: []
  };

  db.boards.push(newBoard);
  logActivity(db, requestingUserId, 'created_board', `created board "${newBoard.title}"`);
  saveDb(db);
  res.status(201).json(newBoard);
});

app.put('/api/boards/:id', (req, res) => {
  const { id } = req.params;
  const { title, description, color, icon, requestingUserId } = req.body;

  const db = loadDb();
  const requester = db.users.find(u => u.id === requestingUserId);
  if (requester && (requester.role === 'viewer' || requester.role === 'developer')) {
    return res.status(403).json({ error: 'Permission denied. Only Admins and Project Managers can edit board settings.' });
  }

  const boardIdx = db.boards.findIndex(b => b.id === id);
  if (boardIdx === -1) {
    return res.status(404).json({ error: 'Board not found' });
  }

  db.boards[boardIdx] = {
    ...db.boards[boardIdx],
    ...(title && { title }),
    ...(description !== undefined && { description }),
    ...(color && { color }),
    ...(icon && { icon }),
    updatedAt: new Date().toISOString()
  };

  logActivity(db, requestingUserId, 'updated_board', `updated board "${db.boards[boardIdx].title}"`);
  saveDb(db);
  res.json(db.boards[boardIdx]);
});

app.delete('/api/boards/:id', (req, res) => {
  const { id } = req.params;
  const { requestingUserId } = req.query;

  const db = loadDb();
  const requester = db.users.find(u => u.id === requestingUserId);
  if (requester && requester.role !== 'admin') {
    return res.status(403).json({ error: 'Permission denied. Only Admins can delete boards.' });
  }

  if (db.boards.length <= 1) {
    return res.status(400).json({ error: 'Cannot delete the only remaining board.' });
  }

  const board = db.boards.find(b => b.id === id);
  db.boards = db.boards.filter(b => b.id !== id);
  logActivity(db, requestingUserId, 'deleted_board', `deleted board "${board ? board.title : id}"`);
  saveDb(db);
  res.json({ success: true, message: 'Board deleted successfully' });
});

app.post('/api/boards/:boardId/lists', (req, res) => {
  const { boardId } = req.params;
  const { title, wipLimit, requestingUserId } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'List title is required' });
  }

  const db = loadDb();
  const requester = db.users.find(u => u.id === requestingUserId);
  if (requester && (requester.role === 'viewer' || requester.role === 'developer')) {
    return res.status(403).json({ error: 'Permission denied. Only Admins and Managers can add columns.' });
  }

  const board = db.boards.find(b => b.id === boardId);
  if (!board) {
    return res.status(404).json({ error: 'Board not found' });
  }

  const newList = {
    id: `list-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    title,
    order: board.lists.length,
    wipLimit: Number(wipLimit) || 0
  };

  board.lists.push(newList);
  board.updatedAt = new Date().toISOString();
  logActivity(db, requestingUserId, 'created_list', `added column "${newList.title}" to "${board.title}"`);
  saveDb(db);
  res.status(201).json(newList);
});

app.put('/api/boards/:boardId/lists/:listId', (req, res) => {
  const { boardId, listId } = req.params;
  const { title, wipLimit, requestingUserId } = req.body;

  const db = loadDb();
  const requester = db.users.find(u => u.id === requestingUserId);
  if (requester && (requester.role === 'viewer' || requester.role === 'developer')) {
    return res.status(403).json({ error: 'Permission denied. Only Admins and Managers can modify columns.' });
  }

  const board = db.boards.find(b => b.id === boardId);
  if (!board) return res.status(404).json({ error: 'Board not found' });

  const list = board.lists.find(l => l.id === listId);
  if (!list) return res.status(404).json({ error: 'List not found' });

  if (title) list.title = title;
  if (wipLimit !== undefined) list.wipLimit = Number(wipLimit) || 0;
  board.updatedAt = new Date().toISOString();

  logActivity(db, requestingUserId, 'updated_list', `updated column "${list.title}" in "${board.title}"`);
  saveDb(db);
  res.json(list);
});

app.delete('/api/boards/:boardId/lists/:listId', (req, res) => {
  const { boardId, listId } = req.params;
  const { requestingUserId } = req.query;

  const db = loadDb();
  const requester = db.users.find(u => u.id === requestingUserId);
  if (requester && (requester.role === 'viewer' || requester.role === 'developer')) {
    return res.status(403).json({ error: 'Permission denied. Only Admins and Managers can delete columns.' });
  }

  const board = db.boards.find(b => b.id === boardId);
  if (!board) return res.status(404).json({ error: 'Board not found' });

  if (board.lists.length <= 1) {
    return res.status(400).json({ error: 'Board must have at least one column.' });
  }

  const removedList = board.lists.find(l => l.id === listId);
  board.lists = board.lists.filter(l => l.id !== listId);
  board.tasks = board.tasks.filter(t => t.listId !== listId);
  board.updatedAt = new Date().toISOString();

  logActivity(db, requestingUserId, 'deleted_list', `deleted column "${removedList ? removedList.title : listId}" from "${board.title}"`);
  saveDb(db);
  res.json({ success: true, message: 'Column and its tasks deleted' });
});

app.put('/api/boards/:boardId/lists/reorder', (req, res) => {
  const { boardId } = req.params;
  const { listIds, requestingUserId } = req.body;

  const db = loadDb();
  const requester = db.users.find(u => u.id === requestingUserId);
  if (requester && (requester.role === 'viewer' || requester.role === 'developer')) {
    return res.status(403).json({ error: 'Permission denied. Only Admins and Managers can reorder columns.' });
  }

  const board = db.boards.find(b => b.id === boardId);
  if (!board) return res.status(404).json({ error: 'Board not found' });

  const listMap = new Map(board.lists.map(l => [l.id, l]));
  const reordered = [];
  listIds.forEach((id, index) => {
    if (listMap.has(id)) {
      const item = listMap.get(id);
      item.order = index;
      reordered.push(item);
    }
  });

  board.lists = reordered;
  board.updatedAt = new Date().toISOString();
  saveDb(db);
  res.json(board.lists);
});

app.post('/api/boards/:boardId/tasks', (req, res) => {
  const {
    boardId,
    listId,
    title,
    description,
    priority,
    assigneeId,
    dueDate,
    estimatedHours,
    tags,
    checklist,
    requestingUserId
  } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Task title is required' });
  }

  const db = loadDb();
  const requester = db.users.find(u => u.id === requestingUserId);
  if (requester && requester.role === 'viewer') {
    return res.status(403).json({ error: 'Permission denied. Viewers have read-only access.' });
  }

  const board = db.boards.find(b => b.id === boardId);
  if (!board) return res.status(404).json({ error: 'Board not found' });

  const targetListId = listId || (board.lists[0] ? board.lists[0].id : null);
  if (!targetListId) return res.status(400).json({ error: 'No columns available to add task' });

  const existingInList = board.tasks.filter(t => t.listId === targetListId);
  const maxOrder = existingInList.reduce((max, t) => Math.max(max, t.order ?? 0), -1);

  const newTask = {
    id: `task-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    boardId,
    listId: targetListId,
    title,
    description: description || '',
    priority: priority || 'medium',
    assigneeId: assigneeId || requestingUserId || null,
    dueDate: dueDate || null,
    estimatedHours: Number(estimatedHours) || 0,
    loggedHours: 0,
    tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map(s => s.trim()).filter(Boolean) : []),
    order: maxOrder + 1,
    checklist: Array.isArray(checklist) ? checklist : [],
    comments: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  board.tasks.push(newTask);
  board.updatedAt = new Date().toISOString();
  logActivity(db, requestingUserId, 'created_task', `created task "${newTask.title}"`);
  saveDb(db);
  res.status(201).json(newTask);
});

app.put('/api/boards/:boardId/tasks/:taskId', (req, res) => {
  const { boardId, taskId } = req.params;
  const {
    title,
    description,
    priority,
    assigneeId,
    dueDate,
    estimatedHours,
    loggedHours,
    tags,
    checklist,
    listId,
    requestingUserId
  } = req.body;

  const db = loadDb();
  const requester = db.users.find(u => u.id === requestingUserId);
  if (requester && requester.role === 'viewer') {
    return res.status(403).json({ error: 'Permission denied. Viewers have read-only access.' });
  }

  const board = db.boards.find(b => b.id === boardId);
  if (!board) return res.status(404).json({ error: 'Board not found' });

  const taskIdx = board.tasks.findIndex(t => t.id === taskId);
  if (taskIdx === -1) return res.status(404).json({ error: 'Task not found' });

  const currentTask = board.tasks[taskIdx];

  const updatedTask = {
    ...currentTask,
    ...(title !== undefined && { title }),
    ...(description !== undefined && { description }),
    ...(priority !== undefined && { priority }),
    ...(assigneeId !== undefined && { assigneeId }),
    ...(dueDate !== undefined && { dueDate }),
    ...(estimatedHours !== undefined && { estimatedHours: Number(estimatedHours) || 0 }),
    ...(loggedHours !== undefined && { loggedHours: Number(loggedHours) || 0 }),
    ...(tags !== undefined && { tags: Array.isArray(tags) ? tags : [] }),
    ...(checklist !== undefined && { checklist: Array.isArray(checklist) ? checklist : [] }),
    ...(listId !== undefined && { listId }),
    updatedAt: new Date().toISOString()
  };

  board.tasks[taskIdx] = updatedTask;
  board.updatedAt = new Date().toISOString();
  logActivity(db, requestingUserId, 'updated_task', `updated details for task "${updatedTask.title}"`);
  saveDb(db);
  res.json(updatedTask);
});

app.put('/api/boards/:boardId/tasks/:taskId/move', (req, res) => {
  const { boardId, taskId } = req.params;
  const { targetListId, targetIndex, requestingUserId } = req.body;

  const db = loadDb();
  const requester = db.users.find(u => u.id === requestingUserId);
  if (requester && requester.role === 'viewer') {
    return res.status(403).json({ error: 'Permission denied. Viewers cannot move tasks.' });
  }

  const board = db.boards.find(b => b.id === boardId);
  if (!board) return res.status(404).json({ error: 'Board not found' });

  const task = board.tasks.find(t => t.id === taskId);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const sourceListId = task.listId;
  const destListId = targetListId || sourceListId;

  const destTasks = board.tasks
    .filter(t => t.listId === destListId && t.id !== taskId)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  let newIndex = typeof targetIndex === 'number' ? targetIndex : destTasks.length;
  if (newIndex < 0) newIndex = 0;
  if (newIndex > destTasks.length) newIndex = destTasks.length;

  task.listId = destListId;
  task.updatedAt = new Date().toISOString();
  destTasks.splice(newIndex, 0, task);

  destTasks.forEach((t, idx) => {
    t.order = idx;
  });

  if (sourceListId !== destListId) {
    const sourceTasks = board.tasks
      .filter(t => t.listId === sourceListId && t.id !== taskId)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    sourceTasks.forEach((t, idx) => {
      t.order = idx;
    });

    const srcCol = board.lists.find(l => l.id === sourceListId);
    const dstCol = board.lists.find(l => l.id === destListId);
    const srcName = srcCol ? srcCol.title : 'list';
    const dstName = dstCol ? dstCol.title : 'list';
    logActivity(db, requestingUserId, 'moved_task', `moved "${task.title}" from ${srcName} to ${dstName}`);
  } else {
    logActivity(db, requestingUserId, 'reordered_task', `reordered "${task.title}" in column`);
  }

  board.updatedAt = new Date().toISOString();
  saveDb(db);
  res.json({ success: true, task, tasks: board.tasks });
});

app.delete('/api/boards/:boardId/tasks/:taskId', (req, res) => {
  const { boardId, taskId } = req.params;
  const { requestingUserId } = req.query;

  const db = loadDb();
  const requester = db.users.find(u => u.id === requestingUserId);
  if (requester && (requester.role === 'viewer' || requester.role === 'developer')) {
    return res.status(403).json({ error: 'Permission denied. Only Admins and Project Managers can delete tasks.' });
  }

  const board = db.boards.find(b => b.id === boardId);
  if (!board) return res.status(404).json({ error: 'Board not found' });

  const task = board.tasks.find(t => t.id === taskId);
  board.tasks = board.tasks.filter(t => t.id !== taskId);
  board.updatedAt = new Date().toISOString();

  logActivity(db, requestingUserId, 'deleted_task', `deleted task "${task ? task.title : taskId}"`);
  saveDb(db);
  res.json({ success: true, message: 'Task deleted successfully' });
});

app.post('/api/boards/:boardId/tasks/:taskId/comments', (req, res) => {
  const { boardId, taskId } = req.params;
  const { text, requestingUserId } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Comment text cannot be empty' });
  }

  const db = loadDb();
  const user = db.users.find(u => u.id === requestingUserId) || {
    id: 'anonymous',
    name: 'Team Member',
    role: 'developer',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face'
  };

  const board = db.boards.find(b => b.id === boardId);
  if (!board) return res.status(404).json({ error: 'Board not found' });

  const task = board.tasks.find(t => t.id === taskId);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  if (!task.comments) task.comments = [];

  const newComment = {
    id: `c-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    userId: user.id,
    userName: user.name,
    userRole: user.role,
    userAvatar: user.avatar,
    text: text.trim(),
    createdAt: new Date().toISOString()
  };

  task.comments.push(newComment);
  logActivity(db, requestingUserId, 'commented', `commented on "${task.title}"`);
  saveDb(db);
  res.status(201).json(newComment);
});

app.get('/api/activity', (req, res) => {
  const db = loadDb();
  res.json(db.activities || []);
});

app.get('/api/export', (req, res) => {
  const db = loadDb();
  res.setHeader('Content-Disposition', 'attachment; filename="pulseflow-backup.json"');
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(db, null, 2));
});

app.post('/api/import', (req, res) => {
  const { backupData, requestingUserId } = req.body;
  if (!backupData || !backupData.boards || !backupData.users) {
    return res.status(400).json({ error: 'Invalid backup file structure' });
  }

  const db = loadDb();
  const requester = db.users.find(u => u.id === requestingUserId);
  if (requester && requester.role !== 'admin') {
    return res.status(403).json({ error: 'Permission denied. Only Admins can import database state.' });
  }

  saveDb(backupData);
  res.json({ success: true, message: 'Database imported and restored successfully' });
});

app.post('/api/reset', (req, res) => {
  const { requestingUserId } = req.body;
  const db = loadDb();
  const requester = db.users.find(u => u.id === requestingUserId);
  if (requester && requester.role !== 'admin') {
    return res.status(403).json({ error: 'Permission denied. Only Admins can reset database.' });
  }

  const freshSeed = getDefaultSeedData();
  saveDb(freshSeed);
  res.json({ success: true, message: 'Database reset to default enterprise seed state' });
});

app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 PulseFlow Project Management Dashboard running!`);
  console.log(`🌐 Local URL: http://localhost:3000`);
  console.log(`📂 Persistent Data Store: ${DB_FILE}`);
  console.log(`=======================================================`);
});
