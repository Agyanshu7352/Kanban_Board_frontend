import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from 'recharts';

const COLORS = ['#2DD4BF', '#14B8A6', '#0F766E']; // Teal/Aqua/Sea Green shades
const PIE_COLORS = ['#2DD4BF', '#E5E7EB'];

export const ProgressChart = ({ tasks }) => {
    // Prepare bar chart data
    const chartData = Object.keys(tasks).map((column, index) => ({
        name: column,
        count: tasks[column].length,
        fill: COLORS[index],
    }));

    // Calculate statistics
    const totalTasks = Object.values(tasks).reduce((sum, col) => sum + col.length, 0);
    const doneTasks = tasks['Done']?.length || 0;
    const inProgressTasks = tasks['In Progress']?.length || 0;
    const todoTasks = tasks['To Do']?.length || 0;
    const completionRate = totalTasks > 0 ? ((doneTasks / totalTasks) * 100).toFixed(1) : 0;

    // Prepare pie chart data
    const pieData = [
        { name: 'Completed', value: doneTasks },
        { name: 'Remaining', value: totalTasks - doneTasks },
    ];

    // Custom label for pie chart
    const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
        const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));

        return (
            <text
                x={x}
                y={y}
                fill="white"
                textAnchor={x > cx ? 'start' : 'end'}
                dominantBaseline="central"
                className="font-bold text-sm"
            >
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };

    return (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                📊 Task Progress Analytics
            </h2>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-gradient-to-br from-teal-50 to-teal-100 p-4 rounded-lg border-2 border-teal-200 hover:shadow-md transition-shadow">
                    <p className="text-sm text-teal-600 font-semibold mb-1">Total Tasks</p>
                    <p className="text-3xl font-bold text-teal-900">{totalTasks}</p>
                </div>
                <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 p-4 rounded-lg border-2 border-cyan-200 hover:shadow-md transition-shadow">
                    <p className="text-sm text-cyan-600 font-semibold mb-1">To Do</p>
                    <p className="text-3xl font-bold text-cyan-900">{todoTasks}</p>
                </div>
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 rounded-lg border-2 border-emerald-200 hover:shadow-md transition-shadow">
                    <p className="text-sm text-emerald-600 font-semibold mb-1">In Progress</p>
                    <p className="text-3xl font-bold text-emerald-900">{inProgressTasks}</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border-2 border-green-200 hover:shadow-md transition-shadow">
                    <p className="text-sm text-green-600 font-semibold mb-1">Completed</p>
                    <p className="text-3xl font-bold text-green-900">{doneTasks}</p>
                </div>
            </div>

            {/* Completion Rate Banner */}
            <div className="mb-8 p-4 bg-gradient-to-r from-teal-500 to-emerald-600 rounded-lg text-white">
                <div className="flex justify-between items-center">
                    <div>
                        <p className="text-sm font-medium opacity-90">Overall Completion Rate</p>
                        <p className="text-4xl font-bold mt-1">{completionRate}%</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm opacity-90">Progress</p>
                        <p className="text-2xl font-semibold">
                            {doneTasks} / {totalTasks}
                        </p>
                    </div>
                </div>
                <div className="mt-3 bg-white bg-opacity-20 rounded-full h-3 overflow-hidden">
                    <div
                        className="bg-white h-full rounded-full transition-all duration-500"
                        style={{ width: `${completionRate}%` }}
                    />
                </div>
            </div>

            {/* Charts */}
            {totalTasks > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Bar Chart */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-4">
                            Tasks by Column
                        </h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis
                                    dataKey="name"
                                    tick={{ fill: '#6b7280', fontSize: 12 }}
                                    axisLine={{ stroke: '#d1d5db' }}
                                />
                                <YAxis
                                    tick={{ fill: '#6b7280', fontSize: 12 }}
                                    axisLine={{ stroke: '#d1d5db' }}
                                    allowDecimals={false}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#5d7eabff',
                                        border: 'none',
                                        borderRadius: '8px',
                                        color: 'white',
                                        zIndex: 9999, // Make tooltip visible
                                    }}
                                    cursor={{ fill: 'rgba(45, 212, 191, 0.1)' }}
                                />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                <Bar
                                    dataKey="count"
                                    name="Tasks"
                                    radius={[8, 8, 0, 0]}
                                    animationDuration={800}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Pie Chart */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-4">
                            Completion Status
                        </h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={renderCustomLabel}
                                    outerRadius={90}
                                    fill="#8884d8"
                                    dataKey="value"
                                    animationDuration={800}
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={PIE_COLORS[index]}
                                            stroke="#fff"
                                            strokeWidth={2}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#5d7eabff',
                                        border: 'none',
                                        borderRadius: '8px',
                                        color: 'white',
                                        zIndex: 9999, // Make tooltip visible
                                    }}
                                />
                                <Legend
                                    wrapperStyle={{ paddingTop: '20px' }}
                                    iconType="circle"
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            ) : (
                <div className="text-center py-12 text-gray-500">
                    <div className="text-6xl mb-4">📈</div>
                    <p className="text-lg font-medium">No tasks to display</p>
                    <p className="text-sm mt-2">Create some tasks to see analytics</p>
                </div>
            )}
        </div>
    );
};