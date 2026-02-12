import { useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Column } from './Column';
import { TaskModal } from './Taskmodal';
import { ProgressChart } from './Progresschart';
import { useSocket } from '../hooks/useSocket';
import { useTasks } from '../hooks/useTasks';
import {
    SignalIcon,
    SignalSlashIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const COLUMNS = ['To Do', 'In Progress', 'Done'];

export const KanbanBoard = () => {
    const { socket, isConnected, error } = useSocket();
    const { tasks, loading, createTask, updateTask, moveTask, deleteTask } = useTasks(socket);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentTask, setCurrentTask] = useState(null);
    const [currentColumn, setCurrentColumn] = useState(null);

    const handleAddTask = (column) => {
        setCurrentColumn(column);
        setCurrentTask(null);
        setIsModalOpen(true);
    };

    const handleEditTask = (task) => {
        setCurrentTask(task);
        setCurrentColumn(task.column);
        setIsModalOpen(true);
    };

    const handleSaveTask = (taskData, column) => {
        if (currentTask) {
            // Update existing task
            updateTask(taskData.id, taskData, currentColumn);
        } else {
            // Create new task
            createTask(taskData, column);
        }
    };

    const handleDeleteTask = (taskId, column) => {
        if (window.confirm('Are you sure you want to delete this task?')) {
            deleteTask(taskId, column);
        }
    };

    const handleDrop = (taskId, fromColumn, toColumn) => {
        moveTask(taskId, fromColumn, toColumn);
    };

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
                {/* Header */}
                <div className="bg-white shadow-md border-b border-gray-200">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                            <div>
                                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                    Kanban Board
                                </h1>
                                <p className="text-gray-600 mt-2">
                                    Real-time collaborative task management
                                </p>
                            </div>

                            {/* Connection Status */}
                            <div className="flex items-center gap-3">
                                <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium ${isConnected
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-red-100 text-red-700'
                                    }`}>
                                    {isConnected ? (
                                        <>
                                            <SignalIcon className="w-5 h-5 animate-pulse" />
                                            <span>Connected</span>
                                        </>
                                    ) : (
                                        <>
                                            <SignalSlashIcon className="w-5 h-5" />
                                            <span>Disconnected</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Error Alert */}
                        {error && (
                            <div className="mt-4 bg-red-50 border-l-4 border-red-500 p-4 rounded">
                                <div className="flex items-center">
                                    <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mr-2" />
                                    <p className="text-sm text-red-700">
                                        <span className="font-semibold">Connection Error:</span> {error}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Progress Chart */}
                    <div className="mb-8 animate-fade-in">
                        <ProgressChart tasks={tasks} />
                    </div>

                    {/* Loading Indicator */}
                    {loading && (
                        <div className="mb-6 animate-fade-in">
                            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded shadow-md">
                                <div className="flex items-center">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
                                    <p className="text-blue-700 font-medium">
                                        Syncing tasks with server...
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Kanban Board - Columns */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {COLUMNS.map((column) => (
                            <div key={column} className="animate-slide-up">
                                <Column
                                    title={column}
                                    tasks={tasks[column] || []}
                                    onDrop={handleDrop}
                                    onAddTask={handleAddTask}
                                    onEditTask={handleEditTask}
                                    onDeleteTask={(taskId) => handleDeleteTask(taskId, column)}
                                />
                            </div>
                        ))}
                    </div>

                    {/* Empty State */}
                    {!loading && Object.values(tasks).every(col => col.length === 0) && (
                        <div className="mt-12 text-center animate-fade-in">
                            <div className="text-8xl mb-4">🚀</div>
                            <h3 className="text-2xl font-bold text-gray-700 mb-2">
                                Welcome to Your Kanban Board!
                            </h3>
                            <p className="text-gray-600 mb-6">
                                Start by creating your first task using the + button in any column
                            </p>
                        </div>
                    )}
                </div>

                {/* Task Modal */}
                <TaskModal
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        setCurrentTask(null);
                        setCurrentColumn(null);
                    }}
                    onSave={handleSaveTask}
                    task={currentTask}
                    column={currentColumn}
                />
            </div>
        </DndProvider>
    );
};