'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { 
  LogOut, Plus, Search, Calendar, CheckSquare, Trash2, Edit2, AlertCircle, 
  Filter, CheckCircle, BarChart3, Square, ListTodo, RefreshCw, Layers 
} from 'lucide-react';
import confetti from 'canvas-confetti';

const CATEGORIES = ['general', 'work', 'personal', 'shopping', 'wellness'];
const PRIORITIES = ['low', 'medium', 'high'];

export default function Dashboard() {
  const router = useRouter();
  const { user, loading, logout, isDemoMode } = useAuth();
  
  // Tasks state
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_desc'); // due_asc, due_desc, created_desc, created_asc
  
  // Modal state for Add/Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [priority, setPriority] = useState('low');
  const [dueDate, setDueDate] = useState('');
  
  const [operationLoading, setOperationLoading] = useState(false);
  const [error, setError] = useState('');

  // Route protection
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Load Tasks
  useEffect(() => {
    if (!user) return;
    
    const fetchTasks = async () => {
      setTasksLoading(true);
      try {
        if (isSupabaseConfigured && supabase) {
          const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .order('created_at', { ascending: false });
            
          if (error) throw error;
          setTasks(data || []);
        } else {
          // Demo Mode loading
          const key = `taskflow_demo_tasks_${user.id}`;
          const stored = localStorage.getItem(key);
          if (stored) {
            setTasks(JSON.parse(stored));
          } else {
            // Seed with sample tasks
            const samples = [
              {
                id: 'sample-1',
                title: 'Welcome to TaskFlow! 👋',
                description: 'Try adding a new task, editing, or filtering them. Check off a task to fire completion confetti!',
                category: 'general',
                priority: 'low',
                due_date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // tomorrow
                completed: false,
                created_at: new Date().toISOString(),
              },
              {
                id: 'sample-2',
                title: 'Setup Supabase Backend ⚡',
                description: 'Copy your Supabase Project URL and Anon key into .env.local to enable real database sync!',
                category: 'work',
                priority: 'high',
                due_date: new Date(Date.now() + 172800000).toISOString().split('T')[0], // 2 days later
                completed: false,
                created_at: new Date().toISOString(),
              },
              {
                id: 'sample-3',
                title: 'Drink 8 glasses of water daily 💧',
                description: 'Stay hydrated throughout the day for premium brain performance.',
                category: 'wellness',
                priority: 'medium',
                due_date: '',
                completed: true,
                created_at: new Date().toISOString(),
              }
            ];
            localStorage.setItem(key, JSON.stringify(samples));
            setTasks(samples);
          }
        }
      } catch (err) {
        console.error('Error fetching tasks:', err);
        setError('Failed to fetch tasks.');
      } finally {
        setTasksLoading(false);
      }
    };

    fetchTasks();
  }, [user]);

  // Handle Log Out
  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Open Add Modal
  const openAddModal = () => {
    setEditingTask(null);
    setTitle('');
    setDescription('');
    setCategory('general');
    setPriority('low');
    setDueDate('');
    setError('');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description || '');
    setCategory(task.category || 'general');
    setPriority(task.priority || 'low');
    setDueDate(task.due_date || '');
    setError('');
    setIsModalOpen(true);
  };

  // Save Task (Create or Update)
  const handleSaveTask = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }

    setOperationLoading(true);
    setError('');

    const taskData = {
      title: title.trim(),
      description: description.trim() || null,
      category,
      priority,
      due_date: dueDate || null,
    };

    try {
      if (isSupabaseConfigured && supabase) {
        if (editingTask) {
          // UPDATE
          const { data, error: err } = await supabase
            .from('tasks')
            .update(taskData)
            .eq('id', editingTask.id)
            .select();
            
          if (err) throw err;
          setTasks(prev => prev.map(t => t.id === editingTask.id ? data[0] : t));
        } else {
          // CREATE
          const { data, error: err } = await supabase
            .from('tasks')
            .insert([{ ...taskData, completed: false, user_id: user.id }])
            .select();
            
          if (err) throw err;
          setTasks(prev => [data[0], ...prev]);
        }
      } else {
        // Demo Mode CRUD
        const key = `taskflow_demo_tasks_${user.id}`;
        let currentTasks = [...tasks];
        
        if (editingTask) {
          // UPDATE LOCAL
          const updated = { ...editingTask, ...taskData };
          currentTasks = currentTasks.map(t => t.id === editingTask.id ? updated : t);
          setTasks(currentTasks);
        } else {
          // CREATE LOCAL
          const created = {
            id: 'task-' + Math.random().toString(36).substr(2, 9),
            ...taskData,
            completed: false,
            created_at: new Date().toISOString(),
            user_id: user.id
          };
          currentTasks = [created, ...currentTasks];
          setTasks(currentTasks);
        }
        localStorage.setItem(key, JSON.stringify(currentTasks));
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving task:', err);
      setError(err.message || 'Error occurred while saving task.');
    } finally {
      setOperationLoading(false);
    }
  };

  // Toggle Complete Status
  const handleToggleComplete = async (task) => {
    const newStatus = !task.completed;
    
    // Optimistic Update
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: newStatus } : t));
    
    // Confetti!
    if (newStatus) {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#8b5cf6', '#06b6d4', '#10b981'],
      });
    }

    try {
      if (isSupabaseConfigured && supabase) {
        const { error: err } = await supabase
          .from('tasks')
          .update({ completed: newStatus })
          .eq('id', task.id);
          
        if (err) throw err;
      } else {
        // Demo Mode complete toggle
        const key = `taskflow_demo_tasks_${user.id}`;
        const updatedTasks = tasks.map(t => t.id === task.id ? { ...t, completed: newStatus } : t);
        localStorage.setItem(key, JSON.stringify(updatedTasks));
      }
    } catch (err) {
      console.error('Error updating task status:', err);
      // Revert state on error
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: !newStatus } : t));
    }
  };

  // Delete Task
  const handleDeleteTask = async (taskId) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    // Optimistic Update
    setTasks(prev => prev.filter(t => t.id !== taskId));

    try {
      if (isSupabaseConfigured && supabase) {
        const { error: err } = await supabase
          .from('tasks')
          .delete()
          .eq('id', taskId);
          
        if (err) throw err;
      } else {
        // Demo Mode delete
        const key = `taskflow_demo_tasks_${user.id}`;
        const updatedTasks = tasks.filter(t => t.id !== taskId);
        localStorage.setItem(key, JSON.stringify(updatedTasks));
      }
    } catch (err) {
      console.error('Error deleting task:', err);
      setError('Could not delete the task from server.');
    }
  };

  // Filter & Sort tasks
  const filteredTasks = tasks
    .filter(task => {
      const matchSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchCategory = categoryFilter === 'all' || task.category === categoryFilter;
      const matchPriority = priorityFilter === 'all' || task.priority === priorityFilter;
      
      return matchSearch && matchCategory && matchPriority;
    })
    .sort((a, b) => {
      if (sortBy === 'created_desc') {
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      }
      if (sortBy === 'created_asc') {
        return new Date(a.created_at || 0) - new Date(b.created_at || 0);
      }
      if (sortBy === 'due_asc') {
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date) - new Date(b.due_date);
      }
      if (sortBy === 'due_desc') {
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(b.due_date) - new Date(a.due_date);
      }
      return 0;
    });

  // Task Stats Math
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const pendingTasks = totalTasks - completedTasks;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  if (loading || !user) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
      }}>
        <RefreshCw size={40} className="animate-spin" style={{ color: 'var(--primary)', animation: 'spin 2s linear infinite' }} />
        <p style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-display)', fontWeight: 500 }}>
          Initializing TaskFlow Workspace...
        </p>
        <style jsx global>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="app-container animate-fade-in" style={{ paddingBottom: '5rem' }}>
      
      {/* Top Banner indicating if in Demo / Local storage mode */}
      {isDemoMode && (
        <div style={{ marginBottom: '1.5rem' }}>
          <div className="alert-banner" style={{ justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <AlertCircle className="alert-banner-icon" size={20} />
              <div>
                <strong>Demo Mode Active:</strong> Synced locally. Configure your <code>.env.local</code> file to hook up a real-time Supabase Database.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header Bar */}
      <header className="glass-panel" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1.25rem 2rem',
        marginBottom: '2rem',
        borderRadius: '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
            width: '2.5rem',
            height: '2.5rem',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-primary)',
          }}>
            <ListTodo size={20} style={{ color: 'white' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.4rem', color: 'var(--text-primary)', lineHeight: 1.1 }}>TaskFlow</h1>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Workspace Dashboard</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ textAlign: 'right', display: 'none', md: 'block' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{user.email}</p>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              Session: {isDemoMode ? 'Demo User' : 'Cloud DB Connected'}
            </p>
          </div>
          
          <button onClick={handleLogout} className="btn-icon btn-icon-danger" title="Log Out">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Grid of Stats Cards */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem',
      }}>
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            background: 'rgba(139, 92, 246, 0.1)',
            color: 'var(--primary)',
            padding: '0.75rem',
            borderRadius: '10px',
            border: '1px solid var(--primary-glow)',
          }}>
            <Layers size={22} />
          </div>
          <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase' }}>Total Tasks</p>
            <h3 style={{ fontSize: '1.75rem', color: 'var(--text-primary)' }}>{totalTasks}</h3>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            background: 'rgba(245, 158, 11, 0.1)',
            color: 'var(--warning)',
            padding: '0.75rem',
            borderRadius: '10px',
            border: '1px solid var(--warning-glow)',
          }}>
            <Calendar size={22} />
          </div>
          <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase' }}>Pending</p>
            <h3 style={{ fontSize: '1.75rem', color: 'var(--text-primary)' }}>{pendingTasks}</h3>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            color: 'var(--success)',
            padding: '0.75rem',
            borderRadius: '10px',
            border: '1px solid var(--success-glow)',
          }}>
            <CheckCircle size={22} />
          </div>
          <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase' }}>Completed</p>
            <h3 style={{ fontSize: '1.75rem', color: 'var(--text-primary)' }}>{completedTasks}</h3>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', justifyContent: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase' }}>Completion Rate</p>
            <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent)' }}>{completionRate}%</span>
          </div>
          <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '999px', overflow: 'hidden' }}>
            <div style={{
              width: `${completionRate}%`,
              height: '100%',
              background: 'linear-gradient(90deg, var(--primary) 0%, var(--accent) 100%)',
              boxShadow: 'var(--shadow-accent)',
              borderRadius: '999px',
              transition: 'width 0.4s ease',
            }} />
          </div>
        </div>
      </section>

      {/* Action / Search & Filtering Row */}
      <section className="glass-panel animate-slide-up" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}>
          {/* Top row: search + add button */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1rem',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
              <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                <Search size={18} />
              </span>
              <input
                type="text"
                placeholder="Search tasks by title or details..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="glass-input"
                style={{ paddingLeft: '2.75rem' }}
              />
            </div>
            
            <button onClick={openAddModal} className="btn btn-primary" style={{ height: '2.8rem', minWidth: '150px' }}>
              <Plus size={18} />
              Add New Task
            </button>
          </div>

          {/* Bottom row: filters */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1rem',
            alignItems: 'center',
            fontSize: '0.9rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.04)',
            paddingTop: '1rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
              <Filter size={15} />
              <span>Filters:</span>
            </div>

            {/* Category Filter */}
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: '120px' }}>
              <select 
                value={categoryFilter} 
                onChange={(e) => setCategoryFilter(e.target.value)} 
                className="glass-select"
                style={{ padding: '0.4rem 2rem 0.4rem 0.75rem', fontSize: '0.85rem' }}
              >
                <option value="all">📁 All Categories</option>
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Priority Filter */}
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: '120px' }}>
              <select 
                value={priorityFilter} 
                onChange={(e) => setPriorityFilter(e.target.value)} 
                className="glass-select"
                style={{ padding: '0.4rem 2rem 0.4rem 0.75rem', fontSize: '0.85rem' }}
              >
                <option value="all">⚡ All Priorities</option>
                {PRIORITIES.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* Sorting */}
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: '150px', marginLeft: 'auto' }}>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)} 
                className="glass-select"
                style={{ padding: '0.4rem 2rem 0.4rem 0.75rem', fontSize: '0.85rem' }}
              >
                <option value="created_desc">🕒 Newest Created</option>
                <option value="created_asc">🕒 Oldest Created</option>
                <option value="due_asc">📅 Due Soonest</option>
                <option value="due_desc">📅 Due Latest</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Task List Grid */}
      <main>
        {tasksLoading ? (
          <div className="glass-panel" style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <RefreshCw size={24} className="animate-spin" style={{ color: 'var(--primary)', margin: '0 auto 1rem', animation: 'spin 2s linear infinite' }} />
            <p>Retrieving tasks...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="glass-panel animate-fade-in" style={{ padding: '5rem 2rem', textAlign: 'center' }}>
            <div style={{
              display: 'inline-flex',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px dashed var(--border-glass)',
              borderRadius: '50%',
              padding: '1.5rem',
              marginBottom: '1rem',
              color: 'var(--text-muted)',
            }}>
              <CheckSquare size={36} />
            </div>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>No tasks found</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '350px', margin: '0 auto 1.5rem' }}>
              {searchQuery || categoryFilter !== 'all' || priorityFilter !== 'all'
                ? "Try refining your search queries or filters to locate your tasks."
                : "Your schedule is clear! Create a task above to begin organizing your workflow."}
            </p>
            {!searchQuery && categoryFilter === 'all' && priorityFilter === 'all' && (
              <button onClick={openAddModal} className="btn btn-primary btn-secondary" style={{ background: 'var(--primary-glow)', color: 'var(--text-primary)', border: '1px solid var(--border-glass-active)' }}>
                Create First Task
              </button>
            )}
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '1.5rem',
          }}>
            {filteredTasks.map(task => {
              const isPastDue = task.due_date && new Date(task.due_date) < new Date(new Date().setHours(0,0,0,0)) && !task.completed;
              return (
                <div 
                  key={task.id} 
                  className="glass-card-interactive" 
                  style={{
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '180px',
                    borderColor: task.completed ? 'rgba(16, 185, 129, 0.15)' : 'var(--border-glass)',
                    background: task.completed ? 'rgba(16, 185, 129, 0.02)' : 'var(--bg-glass-card)',
                  }}
                >
                  <div>
                    {/* Tags row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <span className="badge badge-cat">{task.category || 'general'}</span>
                        <span className={`badge badge-priority-${task.priority || 'low'}`}>{task.priority || 'low'}</span>
                      </div>
                      
                      {/* Checkbox trigger completion */}
                      <button
                        onClick={() => handleToggleComplete(task)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: task.completed ? 'var(--success)' : 'var(--text-muted)',
                          padding: '0.2rem',
                          display: 'flex',
                          alignItems: 'center',
                          transition: 'var(--transition-smooth)',
                        }}
                      >
                        {task.completed ? <CheckCircle size={22} /> : <Square size={22} />}
                      </button>
                    </div>

                    {/* Task Title */}
                    <h4 
                      className={task.completed ? 'completed-text' : ''} 
                      style={{ 
                        fontSize: '1.1rem', 
                        fontWeight: 600, 
                        color: 'var(--text-primary)', 
                        marginBottom: '0.5rem', 
                        lineHeight: 1.3 
                      }}
                    >
                      {task.title}
                    </h4>

                    {/* Description */}
                    {task.description && (
                      <p 
                        className={task.completed ? 'completed-text' : ''} 
                        style={{ 
                          fontSize: '0.85rem', 
                          color: 'var(--text-secondary)', 
                          lineHeight: 1.4,
                          marginBottom: '1rem',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {task.description}
                      </p>
                    )}
                  </div>

                  {/* Footer (Due Date & Action buttons) */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderTop: '1px solid rgba(255, 255, 255, 0.04)',
                    paddingTop: '0.85rem',
                    marginTop: 'auto',
                  }}>
                    {/* Due date display */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      fontSize: '0.8rem',
                      color: isPastDue ? 'var(--danger)' : task.completed ? 'var(--text-muted)' : 'var(--text-secondary)',
                    }}>
                      <Calendar size={13} />
                      <span>
                        {task.due_date 
                          ? `${task.due_date} ${isPastDue ? '(Overdue)' : ''}`
                          : 'No due date'
                        }
                      </span>
                    </div>

                    {/* Edit/Delete */}
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        onClick={() => openEditModal(task)} 
                        className="btn-icon" 
                        title="Edit Task"
                        disabled={task.completed}
                        style={{ opacity: task.completed ? 0.3 : 1 }}
                      >
                        <Edit2 size={13} />
                      </button>
                      <button 
                        onClick={() => handleDeleteTask(task.id)} 
                        className="btn-icon btn-icon-danger" 
                        title="Delete Task"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Add / Edit Task Modal Dialouge */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ padding: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
              {editingTask ? 'Edit Task Details' : 'Create New Task'}
            </h2>

            {error && (
              <div className="alert-banner" style={{
                background: 'rgba(244, 63, 94, 0.1)',
                borderColor: 'rgba(244, 63, 94, 0.2)',
                color: '#fecdd3',
                marginBottom: '1.5rem',
              }}>
                <AlertCircle style={{ color: 'var(--danger)' }} size={18} />
                <div>{error}</div>
              </div>
            )}

            <form onSubmit={handleSaveTask} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Task Title */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Task Title *</label>
                <input
                  type="text"
                  placeholder="What needs to be done?"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="glass-input"
                  maxLength={100}
                  required
                  disabled={operationLoading}
                />
              </div>

              {/* Description */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Description (Optional)</label>
                <textarea
                  placeholder="Provide additional contexts, links or guidelines..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="glass-input"
                  rows={3}
                  maxLength={500}
                  style={{ resize: 'none', fontFamily: 'var(--font-body)' }}
                  disabled={operationLoading}
                />
              </div>

              {/* Split Category & Priority */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                
                {/* Category Selection */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="glass-select"
                    disabled={operationLoading}
                  >
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Priority Selection */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="glass-select"
                    disabled={operationLoading}
                  >
                    {PRIORITIES.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Due Date */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Due Date (Optional)</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="glass-input"
                  disabled={operationLoading}
                  style={{ colorScheme: 'dark' }} // ensures dark calendar styling on chrome/firefox
                />
              </div>

              {/* Buttons row */}
              <div style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'flex-end',
                marginTop: '1rem',
              }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-secondary"
                  disabled={operationLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={operationLoading}
                >
                  {operationLoading ? 'Saving...' : editingTask ? 'Update Task' : 'Add Task'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
