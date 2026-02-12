import { useState, useEffect } from 'react';
import { XMarkIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { useDropzone } from 'react-dropzone';

const PRIORITIES = ['Low', 'Medium', 'High'];
const CATEGORIES = ['Bug', 'Feature', 'Enhancement'];

export const TaskModal = ({ isOpen, onClose, onSave, task = null, column }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: 'Low',
        category: 'Feature',
        attachments: [],
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (task) {
            setFormData({
                title: task.title || '',
                description: task.description || '',
                priority: task.priority || 'Low',
                category: task.category || 'Feature',
                attachments: task.attachments || [],
            });
        } else {
            setFormData({
                title: '',
                description: '',
                priority: 'Low',
                category: 'Feature',
                attachments: [],
            });
        }
        setErrors({});
    }, [task, isOpen]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept: {
            'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
            'application/pdf': ['.pdf'],
        },
        maxSize: 5242880, // 5MB
        onDrop: (acceptedFiles, rejectedFiles) => {
            if (rejectedFiles.length > 0) {
                const error = rejectedFiles[0].errors[0];
                if (error.code === 'file-too-large') {
                    alert('File is too large. Max size is 5MB.');
                } else {
                    alert('Invalid file type. Only images and PDFs are allowed.');
                }
                return;
            }

            const newAttachments = acceptedFiles.map((file) => ({
                name: file.name,
                size: file.size,
                type: file.type,
                url: URL.createObjectURL(file),
            }));

            setFormData((prev) => ({
                ...prev,
                attachments: [...prev.attachments, ...newAttachments],
            }));
        },
    });

    const validateForm = () => {
        const newErrors = {};

        if (!formData.title.trim()) {
            newErrors.title = 'Title is required';
        } else if (formData.title.length > 100) {
            newErrors.title = 'Title must be less than 100 characters';
        }

        if (formData.description.length > 500) {
            newErrors.description = 'Description must be less than 500 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        const taskData = {
            ...formData,
            id: task?.id || `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            createdAt: task?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        onSave(taskData, column);
        onClose();
    };

    const removeAttachment = (index) => {
        setFormData((prev) => ({
            ...prev,
            attachments: prev.attachments.filter((_, i) => i !== index),
        }));
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-slide-up"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                    <div>
                        <h2 className="text-2xl font-bold">
                            {task ? 'Edit Task' : 'Create New Task'}
                        </h2>
                        <p className="text-blue-100 text-sm mt-1">
                            Column: <span className="font-semibold">{column}</span>
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-full transition-colors"
                        aria-label="Close modal"
                    >
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-140px)]">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors.title ? 'border-red-500' : 'border-gray-300'
                                }`}
                            placeholder="Enter task title (e.g., Fix login bug)"
                            maxLength={100}
                        />
                        {errors.title && (
                            <p className="text-red-500 text-xs mt-1">{errors.title}</p>
                        )}
                        <p className="text-gray-500 text-xs mt-1">
                            {formData.title.length}/100 characters
                        </p>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none ${errors.description ? 'border-red-500' : 'border-gray-300'
                                }`}
                            rows="4"
                            placeholder="Describe the task in detail..."
                            maxLength={500}
                        />
                        {errors.description && (
                            <p className="text-red-500 text-xs mt-1">{errors.description}</p>
                        )}
                        <p className="text-gray-500 text-xs mt-1">
                            {formData.description.length}/500 characters
                        </p>
                    </div>

                    {/* Priority & Category */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Priority
                            </label>
                            <select
                                value={formData.priority}
                                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            >
                                {PRIORITIES.map((priority) => (
                                    <option key={priority} value={priority}>
                                        {priority}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Category
                            </label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            >
                                {CATEGORIES.map((category) => (
                                    <option key={category} value={category}>
                                        {category}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* File Upload */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Attachments
                        </label>
                        <div
                            {...getRootProps()}
                            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${isDragActive
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                                }`}
                        >
                            <input {...getInputProps()} />
                            <PhotoIcon className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                            {isDragActive ? (
                                <p className="text-blue-600 font-medium">Drop files here...</p>
                            ) : (
                                <>
                                    <p className="text-gray-600 font-medium mb-1">
                                        Drag & drop files here, or click to select
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        Supports: Images (PNG, JPG, GIF), PDF • Max 5MB per file
                                    </p>
                                </>
                            )}
                        </div>

                        {/* Attachment Preview */}
                        {formData.attachments.length > 0 && (
                            <div className="mt-4 space-y-2">
                                <p className="text-sm font-medium text-gray-700">
                                    {formData.attachments.length} file(s) attached
                                </p>
                                {formData.attachments.map((file, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                                    >
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            {file.type.startsWith('image/') ? (
                                                <img
                                                    src={file.url}
                                                    alt={file.name}
                                                    className="w-12 h-12 object-cover rounded border border-gray-300"
                                                />
                                            ) : (
                                                <div className="w-12 h-12 bg-red-100 rounded flex items-center justify-center">
                                                    <span className="text-red-600 font-bold text-xs">PDF</span>
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-700 truncate">
                                                    {file.name}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {formatFileSize(file.size)}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeAttachment(index)}
                                            className="ml-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 border-2 border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg active:scale-95"
                        >
                            {task ? 'Update Task' : 'Create Task'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};