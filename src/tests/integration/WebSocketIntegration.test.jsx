
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { KanbanBoard } from "../../components/KanbanBoard";
import * as socketHook from '../../hooks/useSocket';
import * as tasksHook from '../../hooks/useTasks';

// Mock socket.io-client library
vi.mock('../../hooks/useSocket');
vi.mock('../../hooks/useTasks');
vi.mock('socket.io-client', () => ({
  default: vi.fn(() => ({
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
  })),
}));

describe('WebSocket Integration Tests', () => {
  let mockSocket;
  let mockUseTasks;
  let eventHandlers;

  beforeEach(() => {
    eventHandlers = {};

    // Mock socket with event handler tracking
    mockSocket = {
      emit: vi.fn(),
      on: vi.fn((event, handler) => {
        eventHandlers[event] = handler;
      }),
      off: vi.fn(),
      disconnect: vi.fn(),
    };

    // Mock tasks hook with initial empty state
    mockUseTasks = {
      tasks: {
        'To Do': [],
        'In Progress': [],
        'Done': [],
      },
      loading: false,
      createTask: vi.fn(),
      updateTask: vi.fn(),
      moveTask: vi.fn(),
      deleteTask: vi.fn(),
    };

    // Setup hook mocks
    vi.spyOn(socketHook, 'useSocket').mockReturnValue({
      socket: mockSocket,
      isConnected: true,
      error: null,
    });

    vi.spyOn(tasksHook, 'useTasks').mockReturnValue(mockUseTasks);

    // Mock window.confirm
    window.confirm = vi.fn(() => true);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ==================== BASIC WEBSOCKET CONNECTION ====================

  test("WebSocket receives task update", async () => {
    // Original test from provided template
    render(<KanbanBoard />);

    expect(screen.getByText("Kanban Board")).toBeInTheDocument();

    // Extended: Test actual WebSocket connection
    expect(screen.getByText("Connected")).toBeInTheDocument();
  });

  test("Establishes WebSocket connection on mount", () => {
    render(<KanbanBoard />);

    // Verify useSocket was called
    expect(socketHook.useSocket).toHaveBeenCalled();
  });

  test("Displays connection status correctly", () => {
    render(<KanbanBoard />);

    expect(screen.getByText("Connected")).toBeInTheDocument();
  });

  test("Shows disconnected status when socket is down", () => {
    vi.spyOn(socketHook, 'useSocket').mockReturnValue({
      socket: null,
      isConnected: false,
      error: null,
    });

    render(<KanbanBoard />);

    expect(screen.getByText("Disconnected")).toBeInTheDocument();
  });

  test("Displays error message on connection failure", () => {
    vi.spyOn(socketHook, 'useSocket').mockReturnValue({
      socket: null,
      isConnected: false,
      error: 'Connection refused',
    });

    render(<KanbanBoard />);

    expect(screen.getByText(/Connection refused/)).toBeInTheDocument();
  });

  // ==================== REAL-TIME TASK UPDATES ====================

  test("Receives and displays newly created tasks from other clients", () => {
    const { rerender } = render(<KanbanBoard />);

    // Simulate task creation from another client
    mockUseTasks.tasks = {
      'To Do': [
        {
          id: 'new-task-1',
          title: 'Task from Another Client',
          description: 'Created by someone else',
          priority: 'High',
          category: 'Bug',
        },
      ],
      'In Progress': [],
      'Done': [],
    };

    vi.spyOn(tasksHook, 'useTasks').mockReturnValue(mockUseTasks);

    rerender(<KanbanBoard />);

    expect(screen.getByText('Task from Another Client')).toBeInTheDocument();
  });

  test("Receives and displays task updates from other clients", () => {
    mockUseTasks.tasks = {
      'To Do': [
        {
          id: 'task-1',
          title: 'Original Title',
          description: 'Original description',
          priority: 'Low',
          category: 'Feature',
        },
      ],
      'In Progress': [],
      'Done': [],
    };

    vi.spyOn(tasksHook, 'useTasks').mockReturnValue(mockUseTasks);

    const { rerender } = render(<KanbanBoard />);

    expect(screen.getByText('Original Title')).toBeInTheDocument();

    // Simulate update from another client
    mockUseTasks.tasks = {
      'To Do': [
        {
          id: 'task-1',
          title: 'Updated Title',
          description: 'Updated description',
          priority: 'High',
          category: 'Bug',
        },
      ],
      'In Progress': [],
      'Done': [],
    };

    rerender(<KanbanBoard />);

    expect(screen.getByText('Updated Title')).toBeInTheDocument();
    expect(screen.queryByText('Original Title')).not.toBeInTheDocument();
  });

  test("Receives task movement updates from other clients", () => {
    mockUseTasks.tasks = {
      'To Do': [
        {
          id: 'movable-task',
          title: 'Task to Move',
          priority: 'Medium',
          category: 'Enhancement',
        },
      ],
      'In Progress': [],
      'Done': [],
    };

    vi.spyOn(tasksHook, 'useTasks').mockReturnValue(mockUseTasks);

    const { rerender } = render(<KanbanBoard />);

    expect(screen.getByText('Task to Move')).toBeInTheDocument();

    // Simulate move from another client
    mockUseTasks.tasks = {
      'To Do': [],
      'In Progress': [
        {
          id: 'movable-task',
          title: 'Task to Move',
          priority: 'Medium',
          category: 'Enhancement',
        },
      ],
      'Done': [],
    };

    rerender(<KanbanBoard />);

    expect(screen.getByText('Task to Move')).toBeInTheDocument();
  });

  test("Receives task deletion updates from other clients", () => {
    mockUseTasks.tasks = {
      'To Do': [
        {
          id: 'task-to-delete',
          title: 'This Will Be Deleted',
          priority: 'Low',
          category: 'Feature',
        },
      ],
      'In Progress': [],
      'Done': [],
    };

    vi.spyOn(tasksHook, 'useTasks').mockReturnValue(mockUseTasks);

    const { rerender } = render(<KanbanBoard />);

    expect(screen.getByText('This Will Be Deleted')).toBeInTheDocument();

    // Simulate deletion from another client
    mockUseTasks.tasks = {
      'To Do': [],
      'In Progress': [],
      'Done': [],
    };

    rerender(<KanbanBoard />);

    expect(screen.queryByText('This Will Be Deleted')).not.toBeInTheDocument();
  });

  // ==================== WEBSOCKET EMIT EVENTS ====================

  test("Emits create task event when user creates a task", async () => {
    const user = userEvent.setup();
    render(<KanbanBoard />);

    const addButton = screen.getAllByLabelText(/Add task to/)[0];
    await user.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('Create New Task')).toBeInTheDocument();
    });

    const titleInput = screen.getByPlaceholderText(/Enter task title/);
    await user.type(titleInput, 'WebSocket Test Task');

    const createButton = screen.getByText('Create Task');
    await user.click(createButton);

    await waitFor(() => {
      expect(mockUseTasks.createTask).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'WebSocket Test Task',
        }),
        'To Do'
      );
    });
  });

  test("Emits update task event when user edits a task", async () => {
    const user = userEvent.setup();

    mockUseTasks.tasks = {
      'To Do': [
        {
          id: 'edit-task',
          title: 'Task to Edit',
          description: 'Original',
          priority: 'Medium',
          category: 'Feature',
        },
      ],
      'In Progress': [],
      'Done': [],
    };

    vi.spyOn(tasksHook, 'useTasks').mockReturnValue(mockUseTasks);

    render(<KanbanBoard />);

    const editButton = screen.getByLabelText('Edit task');
    await user.click(editButton);

    await waitFor(() => {
      expect(screen.getByText('Edit Task')).toBeInTheDocument();
    });

    const titleInput = screen.getByDisplayValue('Task to Edit');
    await user.clear(titleInput);
    await user.type(titleInput, 'Updated via WebSocket');

    const updateButton = screen.getByText('Update Task');
    await user.click(updateButton);

    await waitFor(() => {
      expect(mockUseTasks.updateTask).toHaveBeenCalledWith(
        'edit-task',
        expect.objectContaining({
          title: 'Updated via WebSocket',
        }),
        'To Do'
      );
    });
  });

  test("Emits delete task event when user deletes a task", async () => {
    const user = userEvent.setup();

    mockUseTasks.tasks = {
      'To Do': [
        {
          id: 'delete-task',
          title: 'Task to Delete',
          priority: 'Low',
          category: 'Feature',
        },
      ],
      'In Progress': [],
      'Done': [],
    };

    vi.spyOn(tasksHook, 'useTasks').mockReturnValue(mockUseTasks);

    render(<KanbanBoard />);

    const deleteButton = screen.getByLabelText('Delete task');
    await user.click(deleteButton);

    expect(mockUseTasks.deleteTask).toHaveBeenCalledWith('delete-task', 'To Do');
  });

  // ==================== LOADING STATES ====================

  test("Displays loading indicator during WebSocket sync", () => {
    vi.spyOn(tasksHook, 'useTasks').mockReturnValue({
      ...mockUseTasks,
      loading: true,
    });

    render(<KanbanBoard />);

    expect(screen.getByText(/Syncing tasks/)).toBeInTheDocument();
  });

  test("Hides loading indicator after sync completes", () => {
    render(<KanbanBoard />);

    expect(screen.queryByText(/Syncing tasks/)).not.toBeInTheDocument();
  });

  // ==================== MULTIPLE CLIENT SIMULATION ====================

  test("Handles concurrent updates from multiple clients", () => {
    mockUseTasks.tasks = {
      'To Do': [
        { id: '1', title: 'Task 1', priority: 'High', category: 'Bug' },
      ],
      'In Progress': [],
      'Done': [],
    };

    vi.spyOn(tasksHook, 'useTasks').mockReturnValue(mockUseTasks);

    const { rerender } = render(<KanbanBoard />);

    expect(screen.getByText('Task 1')).toBeInTheDocument();

    // Simulate multiple updates
    mockUseTasks.tasks = {
      'To Do': [
        { id: '1', title: 'Task 1', priority: 'High', category: 'Bug' },
        { id: '2', title: 'Task 2', priority: 'Medium', category: 'Feature' },
        { id: '3', title: 'Task 3', priority: 'Low', category: 'Enhancement' },
      ],
      'In Progress': [],
      'Done': [],
    };

    rerender(<KanbanBoard />);

    expect(screen.getByText('Task 1')).toBeInTheDocument();
    expect(screen.getByText('Task 2')).toBeInTheDocument();
    expect(screen.getByText('Task 3')).toBeInTheDocument();
  });

  // ==================== CHART UPDATES ====================

  test("Progress chart updates with WebSocket data", () => {
    mockUseTasks.tasks = {
      'To Do': [{ id: '1', title: 'Task 1' }],
      'In Progress': [{ id: '2', title: 'Task 2' }],
      'Done': [{ id: '3', title: 'Task 3' }],
    };

    vi.spyOn(tasksHook, 'useTasks').mockReturnValue(mockUseTasks);

    render(<KanbanBoard />);

    expect(screen.getByText('Total Tasks')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  test("Chart recalculates completion rate on task updates", () => {
    mockUseTasks.tasks = {
      'To Do': [{ id: '1', title: 'Task 1' }],
      'In Progress': [{ id: '2', title: 'Task 2' }],
      'Done': [{ id: '3', title: 'Task 3' }, { id: '4', title: 'Task 4' }],
    };

    vi.spyOn(tasksHook, 'useTasks').mockReturnValue(mockUseTasks);

    render(<KanbanBoard />);

    // 2 done out of 4 total = 50%
    expect(screen.getByText('50.0%')).toBeInTheDocument();
  });

  // ==================== ERROR HANDLING ====================

  test("Handles WebSocket connection errors gracefully", () => {
    vi.spyOn(socketHook, 'useSocket').mockReturnValue({
      socket: null,
      isConnected: false,
      error: 'Failed to connect to server',
    });

    render(<KanbanBoard />);

    expect(screen.getByText(/Failed to connect to server/)).toBeInTheDocument();
    expect(screen.getByText('Disconnected')).toBeInTheDocument();
  });

  test("Continues to function when WebSocket is disconnected", () => {
    vi.spyOn(socketHook, 'useSocket').mockReturnValue({
      socket: null,
      isConnected: false,
      error: null,
    });

    render(<KanbanBoard />);

    // Should still render the board
    expect(screen.getByText('Kanban Board')).toBeInTheDocument();
    // Use getAllByText because 'To Do' appears in both Column and ProgressChart
    const columns = ['To Do', 'In Progress', 'Done'];
    columns.forEach(col => {
      const elements = screen.getAllByText(col);
      expect(elements.length).toBeGreaterThan(0);
    });
  });

  // ==================== RECONNECTION LOGIC ====================

  test("Displays reconnected status when connection is restored", () => {
    vi.spyOn(socketHook, 'useSocket').mockReturnValue({
      socket: null,
      isConnected: false,
      error: 'Connection lost',
    });

    const { rerender } = render(<KanbanBoard />);

    expect(screen.getByText('Disconnected')).toBeInTheDocument();

    // Simulate reconnection
    vi.spyOn(socketHook, 'useSocket').mockReturnValue({
      socket: mockSocket,
      isConnected: true,
      error: null,
    });

    rerender(<KanbanBoard />);

    expect(screen.getByText('Connected')).toBeInTheDocument();
    expect(screen.queryByText(/Connection lost/)).not.toBeInTheDocument();
  });

  // ==================== TASK COUNT SYNCHRONIZATION ====================

  test("Syncs task counts across columns correctly", () => {
    mockUseTasks.tasks = {
      'To Do': [
        { id: '1', title: 'Task 1' },
        { id: '2', title: 'Task 2' },
      ],
      'In Progress': [
        { id: '3', title: 'Task 3' },
      ],
      'Done': [
        { id: '4', title: 'Task 4' },
        { id: '5', title: 'Task 5' },
        { id: '6', title: 'Task 6' },
      ],
    };

    vi.spyOn(tasksHook, 'useTasks').mockReturnValue(mockUseTasks);

    render(<KanbanBoard />);

    // Helper to find column header count
    const getColumnCount = (columnTitle) => {
      // Find the h2 that contains the title
      const headers = screen.getAllByRole('heading', { level: 2 });
      const columnHeader = headers.find(h => h.textContent.includes(columnTitle) && !h.textContent.includes('Analytics'));
      return columnHeader ? columnHeader.textContent : '';
    };

    expect(getColumnCount('To Do')).toContain('2');
    expect(getColumnCount('In Progress')).toContain('1');
    expect(getColumnCount('Done')).toContain('3');
  });
});