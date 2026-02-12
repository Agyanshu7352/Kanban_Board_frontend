import { useState, useEffect, useCallback } from 'react';

export const useTasks = (socket) => {
    const [tasks, setTasks] = useState({
        'To Do': [],
        'In Progress': [],
        'Done': [],
    });
    const [loading, setLoading] = useState(false);

    // Listen for task events from server
    useEffect(() => {
        if (!socket) return;

        console.log('📡 Setting up task event listeners');

        // Initial sync - receive all tasks from server
        const handleSyncTasks = ({ tasks: allTasks }) => {
            console.log('📥 Received tasks:', allTasks);

            // Group tasks by column
            const groupedTasks = {
                'To Do': [],
                'In Progress': [],
                'Done': [],
            };

            allTasks.forEach(task => {
                if (groupedTasks[task.column]) {
                    groupedTasks[task.column].push(task);
                }
            });

            setTasks(groupedTasks);
            setLoading(false);
        };

        // Task created by any client
        const handleTaskCreated = ({ task, column }) => {
            console.log('➕ Task created:', task, 'in column:', column);
            setTasks((prev) => ({
                ...prev,
                [column]: [...prev[column], task],
            }));
            setLoading(false);
        };

        // Task updated by any client
        const handleTaskUpdated = ({ taskId, updates, column }) => {
            console.log('✏️ Task updated:', taskId, updates, 'in column:', column);
            setTasks((prev) => ({
                ...prev,
                [column]: prev[column].map((task) =>
                    task.id === taskId ? { ...task, ...updates } : task
                ),
            }));
        };

        // Task moved between columns
        const handleTaskMoved = ({ taskId, fromColumn, toColumn }) => {
            console.log('🔄 Task moved:', taskId, 'from', fromColumn, 'to', toColumn);
            setTasks((prev) => {
                const task = prev[fromColumn].find((t) => t.id === taskId);
                if (!task) {
                    console.warn('⚠️ Task not found in source column:', taskId);
                    return prev;
                }

                return {
                    ...prev,
                    [fromColumn]: prev[fromColumn].filter((t) => t.id !== taskId),
                    [toColumn]: [...prev[toColumn], task],
                };
            });
        };

        // Task deleted by any client
        const handleTaskDeleted = ({ taskId, column }) => {
            console.log('🗑️ Task deleted:', taskId, 'from column:', column);
            setTasks((prev) => ({
                ...prev,
                [column]: prev[column].filter((task) => task.id !== taskId),
            }));
        };

        // Register event listeners
        socket.on('sync:tasks', handleSyncTasks);
        socket.on('task:created', handleTaskCreated);
        socket.on('task:updated', handleTaskUpdated);
        socket.on('task:moved', handleTaskMoved);
        socket.on('task:deleted', handleTaskDeleted);

        // Request initial sync
        console.log('📤 Requesting initial sync...');
        setLoading(true);
        socket.emit('sync:tasks');

        // Cleanup listeners on unmount
        return () => {
            console.log('🧹 Cleaning up task event listeners');
            socket.off('sync:tasks', handleSyncTasks);
            socket.off('task:created', handleTaskCreated);
            socket.off('task:updated', handleTaskUpdated);
            socket.off('task:moved', handleTaskMoved);
            socket.off('task:deleted', handleTaskDeleted);
        };
    }, [socket]);

    // Task operations - emit events to server
    const createTask = useCallback(
        (taskData, column) => {
            if (!socket) {
                console.error('❌ Socket not connected');
                return;
            }
            console.log('📤 Creating task:', taskData, 'in column:', column);
            setLoading(true);
            socket.emit('task:create', { task: taskData, column });
        },
        [socket]
    );

    const updateTask = useCallback(
        (taskId, updates, column) => {
            if (!socket) {
                console.error('❌ Socket not connected');
                return;
            }
            console.log('📤 Updating task:', taskId, updates, 'in column:', column);
            socket.emit('task:update', { taskId, updates, column });
        },
        [socket]
    );

    const moveTask = useCallback(
        (taskId, fromColumn, toColumn) => {
            if (!socket) {
                console.error('❌ Socket not connected');
                return;
            }
            console.log('📤 Moving task:', taskId, 'from', fromColumn, 'to', toColumn);
            socket.emit('task:move', { taskId, fromColumn, toColumn });
        },
        [socket]
    );

    const deleteTask = useCallback(
        (taskId, column) => {
            if (!socket) {
                console.error('❌ Socket not connected');
                return;
            }
            console.log('📤 Deleting task:', taskId, 'from column:', column);
            socket.emit('task:delete', { taskId, column });
        },
        [socket]
    );

    return {
        tasks,
        loading,
        createTask,
        updateTask,
        moveTask,
        deleteTask,
    };
};