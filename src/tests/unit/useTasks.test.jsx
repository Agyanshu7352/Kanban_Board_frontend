import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useTasks } from '../../hooks/useTasks';

describe('useTasks Hook', () => {
    let mockSocket;
    let eventHandlers;

    beforeEach(() => {
        eventHandlers = {};

        mockSocket = {
            on: vi.fn((event, handler) => {
                eventHandlers[event] = handler;
            }),
            off: vi.fn(),
            emit: vi.fn(),
        };
    });

    it("initializes with empty task columns", () => {
        const { result } = renderHook(() => useTasks(mockSocket));

        expect(result.current.tasks).toEqual({
            'To Do': [],
            'In Progress': [],
            'Done': [],
        });
    });

    it("registers socket event listeners", () => {
        renderHook(() => useTasks(mockSocket));

        expect(mockSocket.on).toHaveBeenCalledWith('sync:tasks', expect.any(Function));
        expect(mockSocket.on).toHaveBeenCalledWith('task:created', expect.any(Function));
        expect(mockSocket.on).toHaveBeenCalledWith('task:updated', expect.any(Function));
        expect(mockSocket.on).toHaveBeenCalledWith('task:moved', expect.any(Function));
        expect(mockSocket.on).toHaveBeenCalledWith('task:deleted', expect.any(Function));
    });

    it("emits sync:tasks on mount", () => {
        renderHook(() => useTasks(mockSocket));
        expect(mockSocket.emit).toHaveBeenCalledWith('sync:tasks');
    });

    it("creates task via createTask function", () => {
        const { result } = renderHook(() => useTasks(mockSocket));
        const taskData = { title: 'New Task' };

        act(() => {
            result.current.createTask(taskData, 'To Do');
        });

        expect(mockSocket.emit).toHaveBeenCalledWith('task:create', {
            task: taskData,
            column: 'To Do',
        });
    });

    it("updates task via updateTask function", () => {
        const { result } = renderHook(() => useTasks(mockSocket));
        const updates = { title: 'Updated' };

        act(() => {
            result.current.updateTask('task-1', updates, 'To Do');
        });

        expect(mockSocket.emit).toHaveBeenCalledWith('task:update', {
            taskId: 'task-1',
            updates,
            column: 'To Do',
        });
    });

    it("moves task via moveTask function", () => {
        const { result } = renderHook(() => useTasks(mockSocket));

        act(() => {
            result.current.moveTask('task-1', 'To Do', 'Done');
        });

        expect(mockSocket.emit).toHaveBeenCalledWith('task:move', {
            taskId: 'task-1',
            fromColumn: 'To Do',
            toColumn: 'Done',
        });
    });

    it("deletes task via deleteTask function", () => {
        const { result } = renderHook(() => useTasks(mockSocket));

        act(() => {
            result.current.deleteTask('task-1', 'To Do');
        });

        expect(mockSocket.emit).toHaveBeenCalledWith('task:delete', {
            taskId: 'task-1',
            column: 'To Do',
        });
    });

    it("handles null socket gracefully", () => {
        const { result } = renderHook(() => useTasks(null));

        expect(result.current.tasks).toEqual({
            'To Do': [],
            'In Progress': [],
            'Done': [],
        });

        // These should not throw
        act(() => {
            result.current.createTask({}, 'To Do');
        });

        act(() => {
            result.current.updateTask('1', {}, 'To Do');
        });

        act(() => {
            result.current.moveTask('1', 'To Do', 'Done');
        });

        act(() => {
            result.current.deleteTask('1', 'To Do');
        });
    });

    it("cleans up listeners on unmount", () => {
        const { unmount } = renderHook(() => useTasks(mockSocket));

        unmount();

        expect(mockSocket.off).toHaveBeenCalledWith('sync:tasks', expect.any(Function));
        expect(mockSocket.off).toHaveBeenCalledWith('task:created', expect.any(Function));
        expect(mockSocket.off).toHaveBeenCalledWith('task:updated', expect.any(Function));
        expect(mockSocket.off).toHaveBeenCalledWith('task:moved', expect.any(Function));
        expect(mockSocket.off).toHaveBeenCalledWith('task:deleted', expect.any(Function));
    });
});
