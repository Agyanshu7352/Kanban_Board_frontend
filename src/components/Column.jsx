import { useDrop } from 'react-dnd';
import { TaskCard } from './TaskCard';
import { PlusIcon } from '@heroicons/react/24/outline';

const COLUMN_STYLES = {
    'To Do': 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-300',
    'In Progress': 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-300',
    'Done': 'bg-gradient-to-br from-green-50 to-green-100 border-green-300',
};

const HEADER_STYLES = {
    'To Do': 'text-blue-700',
    'In Progress': 'text-yellow-700',
    'Done': 'text-green-700',
};

export const Column = ({ title, tasks, onDrop, onAddTask, onEditTask, onDeleteTask }) => {
    const [{ isOver, canDrop }, drop] = useDrop({
        accept: 'TASK',
        drop: (item) => {
            if (item.column !== title) {
                onDrop(item.id, item.column, title);
            }
        },
        collect: (monitor) => ({
            isOver: monitor.isOver(),
            canDrop: monitor.canDrop(),
        }),
    });

    const isActive = isOver && canDrop;

    return (
        <div
            ref={drop}
            className={`rounded-xl p-4 min-h-[600px] transition-all duration-200 border-2 ${COLUMN_STYLES[title] || 'bg-gray-50 border-gray-300'
                } ${isActive
                    ? 'ring-4 ring-blue-400 ring-opacity-50 scale-[1.02] shadow-2xl'
                    : 'shadow-md'
                }`}
        >
            {/* Column Header */}
            <div className="flex justify-between items-center mb-4 pb-3 border-b-2 border-gray-300">
                <h2 className={`font-bold text-lg flex items-center gap-2 ${HEADER_STYLES[title]}`}>
                    {title}
                    <span className="text-sm bg-white px-2 py-0.5 rounded-full text-gray-600 font-medium">
                        {tasks.length}
                    </span>
                </h2>
                <button
                    onClick={() => onAddTask(title)}
                    className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-all hover:scale-110 shadow-md active:scale-95"
                    aria-label={`Add task to ${title}`}
                    title={`Add new task to ${title}`}
                >
                    <PlusIcon className="w-5 h-5" />
                </button>
            </div>

            {/* Drop indicator */}
            {isActive && (
                <div className="mb-3 p-4 border-2 border-dashed border-blue-500 bg-blue-50 rounded-lg text-center text-blue-700 font-medium animate-pulse">
                    Drop here to move task
                </div>
            )}

            {/* Tasks */}
            <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-300px)] pr-1">
                {tasks.map((task) => (
                    <TaskCard
                        key={task.id}
                        task={{ ...task, column: title }}
                        onEdit={onEditTask}
                        onDelete={onDeleteTask}
                    />
                ))}
            </div>

            {/* Empty state */}
            {tasks.length === 0 && !isActive && (
                <div className="text-center text-gray-500 mt-12 animate-fade-in">
                    <div className="text-4xl mb-2">📋</div>
                    <p className="font-medium">No tasks yet</p>
                    <p className="text-sm mt-1">Drag tasks here or click + to add</p>
                </div>
            )}
        </div>
    );
};