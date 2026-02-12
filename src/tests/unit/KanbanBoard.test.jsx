import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { KanbanBoard } from "../../components/KanbanBoard.jsx";
import { TaskCard } from '../../components/TaskCard';
import { Column } from '../../components/Column';
import { TaskModal } from '../../components/TaskModal';
import { ProgressChart } from '../../components/ProgressChart';
import { useTasks } from '../../hooks/useTasks';
import * as socketHook from '../../hooks/useSocket';
import * as tasksHook from '../../hooks/useTasks';

// Mock hooks
vi.mock('../../hooks/useSocket');
vi.mock('../../hooks/useTasks');

// Render helper for components requiring DnD
const renderWithDnd = (component) => {
  return render(<DndProvider backend={HTML5Backend}>{component}</DndProvider>);
};

describe('Kanban Board Unit Tests', () => {

  // ==================== BASIC KANBAN BOARD TESTS ====================

  test("renders Kanban board title", () => {
    // Original test from provided template
    // Mock the hooks first
    vi.spyOn(socketHook, 'useSocket').mockReturnValue({
      socket: {},
      isConnected: true,
      error: null,
    });

    vi.spyOn(tasksHook, 'useTasks').mockReturnValue({
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
    });

    render(<KanbanBoard />);
    expect(screen.getByText("Kanban Board")).toBeInTheDocument();
  });

  test("renders all three columns", () => {
    vi.spyOn(socketHook, 'useSocket').mockReturnValue({
      socket: {},
      isConnected: true,
      error: null,
    });

    vi.spyOn(tasksHook, 'useTasks').mockReturnValue({
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
    });

    render(<KanbanBoard />);

    expect(screen.getByRole('heading', { name: /To Do/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /In Progress/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Done/ })).toBeInTheDocument();
  });

  test("displays connection status", () => {
    vi.spyOn(socketHook, 'useSocket').mockReturnValue({
      socket: {},
      isConnected: true,
      error: null,
    });

    vi.spyOn(tasksHook, 'useTasks').mockReturnValue({
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
    });

    render(<KanbanBoard />);

    expect(screen.getByText('Connected')).toBeInTheDocument();
  });

  // ==================== TASKCARD COMPONENT TESTS ====================

  describe('TaskCard Component', () => {
    const mockTask = {
      id: 'task-1',
      title: 'Unit Test Task',
      description: 'This is a unit test',
      priority: 'High',
      category: 'Bug',
      attachments: [],
      column: 'To Do',
    };

    test("renders task with all properties", () => {
      const onEdit = vi.fn();
      const onDelete = vi.fn();

      renderWithDnd(<TaskCard task={mockTask} onEdit={onEdit} onDelete={onDelete} />);

      expect(screen.getByText('Unit Test Task')).toBeInTheDocument();
      expect(screen.getByText('This is a unit test')).toBeInTheDocument();
      expect(screen.getByText('High')).toBeInTheDocument();
      expect(screen.getByText('Bug')).toBeInTheDocument();
    });

    test("calls onEdit when edit button is clicked", () => {
      const onEdit = vi.fn();
      const onDelete = vi.fn();

      renderWithDnd(<TaskCard task={mockTask} onEdit={onEdit} onDelete={onDelete} />);

      const editButton = screen.getByLabelText('Edit task');
      fireEvent.click(editButton);

      expect(onEdit).toHaveBeenCalledWith(mockTask);
      expect(onEdit).toHaveBeenCalledTimes(1);
    });

    test("calls onDelete when delete button is clicked", () => {
      const onEdit = vi.fn();
      const onDelete = vi.fn();

      renderWithDnd(<TaskCard task={mockTask} onEdit={onEdit} onDelete={onDelete} />);

      const deleteButton = screen.getByLabelText('Delete task');
      fireEvent.click(deleteButton);

      expect(onDelete).toHaveBeenCalledWith('task-1');
      expect(onDelete).toHaveBeenCalledTimes(1);
    });

    test("displays attachment count", () => {
      const taskWithAttachments = {
        ...mockTask,
        attachments: [
          { name: 'file1.pdf', url: 'url1' },
          { name: 'file2.png', url: 'url2' },
        ],
      };

      renderWithDnd(
        <TaskCard task={taskWithAttachments} onEdit={vi.fn()} onDelete={vi.fn()} />
      );

      expect(screen.getByText('2 attachment(s)')).toBeInTheDocument();
    });

    test("renders with default priority", () => {
      const taskWithoutPriority = { ...mockTask, priority: undefined };

      renderWithDnd(
        <TaskCard task={taskWithoutPriority} onEdit={vi.fn()} onDelete={vi.fn()} />
      );

      expect(screen.getByText('Low')).toBeInTheDocument();
    });

    test("renders with default category", () => {
      const taskWithoutCategory = { ...mockTask, category: undefined };

      renderWithDnd(
        <TaskCard task={taskWithoutCategory} onEdit={vi.fn()} onDelete={vi.fn()} />
      );

      expect(screen.getByText('Feature')).toBeInTheDocument();
    });

    test("hides description when empty", () => {
      const taskWithoutDescription = { ...mockTask, description: '' };

      renderWithDnd(
        <TaskCard task={taskWithoutDescription} onEdit={vi.fn()} onDelete={vi.fn()} />
      );

      expect(screen.queryByText('This is a unit test')).not.toBeInTheDocument();
    });
  });

  // ==================== COLUMN COMPONENT TESTS ====================

  describe('Column Component', () => {
    const mockTasks = [
      {
        id: 'task-1',
        title: 'Task 1',
        description: 'Description 1',
        priority: 'High',
        category: 'Bug',
      },
      {
        id: 'task-2',
        title: 'Task 2',
        description: 'Description 2',
        priority: 'Low',
        category: 'Feature',
      },
    ];

    test("renders column with title", () => {
      renderWithDnd(
        <Column
          title="To Do"
          tasks={[]}
          onDrop={vi.fn()}
          onAddTask={vi.fn()}
          onEditTask={vi.fn()}
          onDeleteTask={vi.fn()}
        />
      );

      expect(screen.getByText('To Do')).toBeInTheDocument();
    });

    test("displays task count", () => {
      renderWithDnd(
        <Column
          title="To Do"
          tasks={mockTasks}
          onDrop={vi.fn()}
          onAddTask={vi.fn()}
          onEditTask={vi.fn()}
          onDeleteTask={vi.fn()}
        />
      );

      expect(screen.getByText('2')).toBeInTheDocument();
    });

    test("renders all tasks", () => {
      renderWithDnd(
        <Column
          title="To Do"
          tasks={mockTasks}
          onDrop={vi.fn()}
          onAddTask={vi.fn()}
          onEditTask={vi.fn()}
          onDeleteTask={vi.fn()}
        />
      );

      expect(screen.getByText('Task 1')).toBeInTheDocument();
      expect(screen.getByText('Task 2')).toBeInTheDocument();
    });

    test("calls onAddTask when add button is clicked", () => {
      const onAddTask = vi.fn();

      renderWithDnd(
        <Column
          title="To Do"
          tasks={[]}
          onDrop={vi.fn()}
          onAddTask={onAddTask}
          onEditTask={vi.fn()}
          onDeleteTask={vi.fn()}
        />
      );

      const addButton = screen.getByLabelText('Add task to To Do');
      fireEvent.click(addButton);

      expect(onAddTask).toHaveBeenCalledWith('To Do');
    });

    test("shows empty state", () => {
      renderWithDnd(
        <Column
          title="To Do"
          tasks={[]}
          onDrop={vi.fn()}
          onAddTask={vi.fn()}
          onEditTask={vi.fn()}
          onDeleteTask={vi.fn()}
        />
      );

      expect(screen.getByText('No tasks yet')).toBeInTheDocument();
    });
  });

  // ==================== TASKMODAL COMPONENT TESTS ====================

  describe('TaskModal Component', () => {
    test("renders when open", () => {
      render(
        <TaskModal
          isOpen={true}
          onClose={vi.fn()}
          onSave={vi.fn()}
          task={null}
          column="To Do"
        />
      );

      expect(screen.getByText('Create New Task')).toBeInTheDocument();
    });

    test("does not render when closed", () => {
      render(
        <TaskModal
          isOpen={false}
          onClose={vi.fn()}
          onSave={vi.fn()}
          task={null}
          column="To Do"
        />
      );

      expect(screen.queryByText('Create New Task')).not.toBeInTheDocument();
    });

    test("shows Edit Task for existing task", () => {
      const task = {
        id: 'task-1',
        title: 'Existing Task',
        description: 'Description',
        priority: 'High',
        category: 'Bug',
      };

      render(
        <TaskModal
          isOpen={true}
          onClose={vi.fn()}
          onSave={vi.fn()}
          task={task}
          column="To Do"
        />
      );

      expect(screen.getByText('Edit Task')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Existing Task')).toBeInTheDocument();
    });

    test("calls onClose when cancel is clicked", () => {
      const onClose = vi.fn();

      render(
        <TaskModal
          isOpen={true}
          onClose={onClose}
          onSave={vi.fn()}
          task={null}
          column="To Do"
        />
      );

      fireEvent.click(screen.getByText('Cancel'));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    test("calls onSave with form data", () => {
      const onSave = vi.fn();

      render(
        <TaskModal
          isOpen={true}
          onClose={vi.fn()}
          onSave={onSave}
          task={null}
          column="To Do"
        />
      );

      const titleInput = screen.getByPlaceholderText(/Enter task title/);
      fireEvent.change(titleInput, { target: { value: 'New Task' } });

      const createButton = screen.getByText('Create Task');
      fireEvent.click(createButton);

      expect(onSave).toHaveBeenCalled();
      expect(onSave.mock.calls[0][0]).toMatchObject({
        title: 'New Task',
      });
    });

    test("validates required title", () => {
      const onSave = vi.fn();

      render(
        <TaskModal
          isOpen={true}
          onClose={vi.fn()}
          onSave={onSave}
          task={null}
          column="To Do"
        />
      );

      const createButton = screen.getByText('Create Task');
      fireEvent.click(createButton);

      expect(screen.getByText('Create New Task')).toBeInTheDocument();
    });
  });

  // ==================== PROGRESSCHART COMPONENT TESTS ====================

  describe('ProgressChart Component', () => {
    const mockTasks = {
      'To Do': [{ id: '1', title: 'Task 1' }],
      'In Progress': [{ id: '2', title: 'Task 2' }],
      'Done': [{ id: '3', title: 'Task 3' }],
    };

    test("renders chart title", () => {
      render(<ProgressChart tasks={mockTasks} />);
      expect(screen.getByText(/Task Progress Analytics/)).toBeInTheDocument();
    });

    test("displays total task count", () => {
      render(<ProgressChart tasks={mockTasks} />);
      expect(screen.getByText('Total Tasks')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    test("displays completion rate", () => {
      render(<ProgressChart tasks={mockTasks} />);
      expect(screen.getByText('Overall Completion Rate')).toBeInTheDocument();
    });

    test("calculates correct completion percentage", () => {
      const tasks = {
        'To Do': [{ id: '1' }],
        'In Progress': [{ id: '2' }],
        'Done': [{ id: '3' }, { id: '4' }],
      };

      render(<ProgressChart tasks={tasks} />);
      expect(screen.getByText('50.0%')).toBeInTheDocument();
    });

    test("shows empty state when no tasks", () => {
      const emptyTasks = {
        'To Do': [],
        'In Progress': [],
        'Done': [],
      };
      render(<ProgressChart tasks={emptyTasks} />);
      expect(screen.getByText('0%')).toBeInTheDocument();
    });
  });
});