import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTaskStore } from '@/features/kanban/utils/store';

// uuid v4 regex
const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('kanban store', () => {
  // Capture immutable snapshot at module load
  const INITIAL_COLUMNS = JSON.parse(JSON.stringify(useTaskStore.getState().columns));

  beforeEach(() => {
    useTaskStore.setState({ columns: JSON.parse(JSON.stringify(INITIAL_COLUMNS)) });
  });

  describe('initial state', () => {
    it('has 3 columns: backlog, inProgress, done', () => {
      const { columns } = useTaskStore.getState();
      const keys = Object.keys(columns).toSorted();
      expect(keys).toEqual(['backlog', 'done', 'inProgress']);
    });

    it('backlog has 4 tasks', () => {
      expect(useTaskStore.getState().columns.backlog).toHaveLength(4);
    });

    it('inProgress has 3 tasks', () => {
      expect(useTaskStore.getState().columns.inProgress).toHaveLength(3);
    });

    it('done has 3 tasks', () => {
      expect(useTaskStore.getState().columns.done).toHaveLength(3);
    });

    it('task objects have expected shape (id, title, priority, assignee, dueDate)', () => {
      const task = useTaskStore.getState().columns.backlog[0];
      expect(task).toHaveProperty('id');
      expect(task).toHaveProperty('title');
      expect(task).toHaveProperty('priority');
      expect(task).toHaveProperty('assignee');
      expect(task).toHaveProperty('dueDate');
    });
  });

  describe('setColumns', () => {
    it('replaces the entire columns object', () => {
      const newColumns = { backlog: [{ id: 'x', title: 'X', priority: 'low' as const }] };
      useTaskStore.getState().setColumns(newColumns);
      expect(useTaskStore.getState().columns).toEqual(newColumns);
    });

    it('passing empty object removes all columns keys', () => {
      useTaskStore.getState().setColumns({});
      const { columns } = useTaskStore.getState();
      // setColumns replaces entirely — empty object means no backlog/inProgress/done keys
      expect(columns.backlog).toBeUndefined();
      expect(columns.inProgress).toBeUndefined();
      expect(columns.done).toBeUndefined();
    });

    it('passing new columns with different keys replaces previous keys', () => {
      useTaskStore.getState().setColumns({ sprint1: [{ id: 'a', title: 'A', priority: 'high' as const }] });
      const keys = Object.keys(useTaskStore.getState().columns);
      expect(keys).toContain('sprint1');
      expect(keys).not.toContain('backlog');
    });

    it('passing columns with same shape but reordered reflects new state', () => {
      const reordered = {
        done: [...INITIAL_COLUMNS.done],
        backlog: [...INITIAL_COLUMNS.backlog],
        inProgress: [...INITIAL_COLUMNS.inProgress]
      };
      useTaskStore.getState().setColumns(reordered);
      expect(Object.keys(useTaskStore.getState().columns)).toEqual(['done', 'backlog', 'inProgress']);
    });
  });

  describe('addTask', () => {
    it('prepends to backlog (becomes index 0)', () => {
      const title = 'New task at top';
      useTaskStore.getState().addTask(title);
      expect(useTaskStore.getState().columns.backlog[0].title).toBe(title);
    });

    it('new task has priority medium', () => {
      useTaskStore.getState().addTask('Test task');
      const newTask = useTaskStore.getState().columns.backlog[0];
      expect(newTask.priority).toBe('medium');
    });

    it('new task has assignee undefined', () => {
      useTaskStore.getState().addTask('Test task');
      const newTask = useTaskStore.getState().columns.backlog[0];
      expect(newTask.assignee).toBeUndefined();
    });

    it('new task has dueDate undefined', () => {
      useTaskStore.getState().addTask('Test task');
      const newTask = useTaskStore.getState().columns.backlog[0];
      expect(newTask.dueDate).toBeUndefined();
    });

    it('new task has description as provided', () => {
      useTaskStore.getState().addTask('Task title', 'Task description text');
      const newTask = useTaskStore.getState().columns.backlog[0];
      expect(newTask.description).toBe('Task description text');
    });

    it('new task has title as provided', () => {
      useTaskStore.getState().addTask('My task title');
      const newTask = useTaskStore.getState().columns.backlog[0];
      expect(newTask.title).toBe('My task title');
    });

    it('new task has unique id in uuid v4 format', () => {
      useTaskStore.getState().addTask('UUID test');
      const newTask = useTaskStore.getState().columns.backlog[0];
      expect(newTask.id).toMatch(UUID_V4_REGEX);
    });

    it('other columns inProgress and done unchanged', () => {
      const ipCountBefore = useTaskStore.getState().columns.inProgress.length;
      const doneCountBefore = useTaskStore.getState().columns.done.length;
      useTaskStore.getState().addTask('Test task');
      expect(useTaskStore.getState().columns.inProgress.length).toBe(ipCountBefore);
      expect(useTaskStore.getState().columns.done.length).toBe(doneCountBefore);
    });

    it('backlog previous tasks shift down (become index 1+)', () => {
      const oldFirst = useTaskStore.getState().columns.backlog[0];
      useTaskStore.getState().addTask('New task');
      expect(useTaskStore.getState().columns.backlog[1]).toEqual(oldFirst);
    });

    it('multiple addTask calls: latest is at index 0', () => {
      useTaskStore.getState().addTask('First task');
      useTaskStore.getState().addTask('Second task');
      useTaskStore.getState().addTask('Third task');
      expect(useTaskStore.getState().columns.backlog[0].title).toBe('Third task');
      expect(useTaskStore.getState().columns.backlog[1].title).toBe('Second task');
      expect(useTaskStore.getState().columns.backlog[2].title).toBe('First task');
    });

    it('empty title still adds the task (no validation in source)', () => {
      useTaskStore.getState().addTask('');
      const newTask = useTaskStore.getState().columns.backlog[0];
      expect(newTask.title).toBe('');
      expect(newTask.id).toMatch(UUID_V4_REGEX);
    });

    it('if backlog does not exist, creates new backlog with just the new task', () => {
      useTaskStore.setState({ columns: {} });
      useTaskStore.getState().addTask('Task in new backlog');
      expect(useTaskStore.getState().columns.backlog).toHaveLength(1);
      expect(useTaskStore.getState().columns.backlog[0].title).toBe('Task in new backlog');
    });
  });
});