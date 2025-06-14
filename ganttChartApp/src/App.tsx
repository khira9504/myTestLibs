import { useState, useEffect } from 'react';
import { Task } from './types';
import { TaskForm } from './components/TaskForm';
import { GanttChart } from './components/GanttChart';

const STORAGE_KEY = 'gantt-tasks';

export default function App() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const savedTasks = localStorage.getItem(STORAGE_KEY);
    if (savedTasks) {
      return JSON.parse(savedTasks).map((task: any) => ({
        ...task,
        start: new Date(task.start),
        end: new Date(task.end),
      }));
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  const handleAddTask = (taskData: Omit<Task, 'id' | 'progress' | 'dependencies'>) => {
    const newTask: Task = {
      ...taskData,
      id: `Task_${Date.now()}`,
      progress: 0,
      dependencies: '',
    };
    setTasks([...tasks, newTask]);
  };

  const handleTaskChange = (updatedTask: Task) => {
    setTasks(tasks.map(task => 
      task.id === updatedTask.id ? updatedTask : task
    ));
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">ガントチャート</h1>
        <TaskForm onAddTask={handleAddTask} />
        <div className="bg-white rounded-lg shadow p-4">
          <GanttChart tasks={tasks} onTaskChange={handleTaskChange} />
        </div>
      </div>
    </div>
  );
};