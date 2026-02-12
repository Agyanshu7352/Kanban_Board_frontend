import { useDrag } from 'react-dnd';
import { TrashIcon, PencilIcon, PaperClipIcon } from '@heroicons/react/24/outline';

const PRIORITY_COLORS = {
    Low: 'bg-green-100 text-green-800 border-green-200',
    Medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    High: 'bg-red-100 text-red-800 border-red-200',
};

const CATEGORY_COLORS = {
    Bug: 'bg-red-50 text-red-700 border-red-300',
    Feature: 'bg-blue-50 text-blue-700 border-blue-300',
    Enhancement: 'bg-purple-50 text-purple-700 border-purple-300',
};

export const TaskCard = ({ task, onEdit, onDelete }) => {
    const [{ isDragging }, drag] = useDrag({
        type: 'TASK',
        item: { id: task.id, column: task.column },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    });

    return (
        <div
            ref={drag}
            className={`bg-white p-4 rounded-lg shadow-md border-2 border-gray-200 cursor-move transition-all hover:shadow-xl hover:border-blue-300 ${isDragging ? 'opacity-40 rotate-3 scale-95' : 'opacity-100'
                }`}
            style={{ touchAction: 'none' }}
        >
            {/* Header */}
            <div className="flex justify-between items-start mb-2 gap-2">
                <h3 className="font-semibold text-gray-900 flex-1 text-sm line-clamp-2">
                    {task.title}
                </h3>
                <div className="flex gap-1 flex-shrink-0">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit(task);
                        }}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        aria-label="Edit task"
                        title="Edit task"
                    >
                        <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(task.id);
                        }}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                        aria-label="Delete task"
                        title="Delete task"
                    >
                        <TrashIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Description */}
            {task.description && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-3">{task.description}</p>
            )}

            {/* Priority & Category */}
            <div className="flex flex-wrap gap-2 mb-3">
                <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border ${PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.Low
                        }`}
                >
                    {task.priority || 'Low'}
                </span>
                <span
                    className={`px-2.5 py-1 rounded-md text-xs font-medium border ${CATEGORY_COLORS[task.category] || CATEGORY_COLORS.Feature
                        }`}
                >
                    {task.category || 'Feature'}
                </span>
            </div>

            {/* Attachments */}
            {task.attachments && task.attachments.length > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 px-2 py-1.5 rounded">
                    <PaperClipIcon className="w-3.5 h-3.5" />
                    <span>{task.attachments.length} attachment(s)</span>
                </div>
            )}
        </div>
    );
};