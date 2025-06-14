import React, { useState, useRef, useEffect } from 'react';
import { Task } from '../types';

interface GanttChartProps {
  tasks: Task[];
  onTaskChange: (task: Task) => void;
}

export const GanttChart: React.FC<GanttChartProps> = ({ tasks, onTaskChange }) => {
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [draggingTask, setDraggingTask] = useState<Task | null>(null);
  const [dragType, setDragType] = useState<'start' | 'end' | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 日付の範囲を計算
  const getDateRange = () => {
    const start = new Date(currentDate);
    const end = new Date(currentDate);
    
    switch (viewMode) {
      case 'day':
        end.setDate(end.getDate() + 1);
        break;
      case 'week':
        start.setDate(start.getDate() - start.getDay());
        end.setDate(start.getDate() + 7);
        break;
      case 'month':
        start.setDate(1);
        end.setMonth(end.getMonth() + 1);
        end.setDate(0);
        break;
    }
    
    return { start, end };
  };

  // 日付の配列を生成
  const getDates = () => {
    const { start, end } = getDateRange();
    const dates: Date[] = [];
    const current = new Date(start);
    
    while (current <= end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return dates;
  };

  // タスクの位置と幅を計算
  const getTaskStyle = (task: Task) => {
    const { start: rangeStart } = getDateRange();
    const startDate = new Date(task.start);
    const endDate = new Date(task.end);
    
    const startOffset = (startDate.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24);
    const duration = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    
    return {
      left: `${startOffset * 100}px`,
      width: `${Math.max(duration * 100, 20)}px`,
    };
  };

  // ドラッグ開始時の処理
  const handleDragStart = (task: Task, type: 'start' | 'end', e: React.MouseEvent) => {
    e.preventDefault();
    setDraggingTask(task);
    setDragType(type);
  };

  // ドラッグ中の処理
  const handleDrag = (e: React.MouseEvent) => {
    if (!draggingTask || !dragType || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - containerRect.left;
    const dayWidth = 100; // 1日あたりのピクセル幅
    const days = Math.floor(x / dayWidth);
    
    const newDate = new Date(getDateRange().start);
    newDate.setDate(newDate.getDate() + days);

    const updatedTask = { ...draggingTask };
    if (dragType === 'start') {
      if (newDate < updatedTask.end) {
        updatedTask.start = newDate;
      }
    } else {
      if (newDate > updatedTask.start) {
        updatedTask.end = newDate;
      }
    }
    
    onTaskChange(updatedTask);
  };

  // ドラッグ終了時の処理
  const handleDragEnd = () => {
    setDraggingTask(null);
    setDragType(null);
  };

  // マウスイベントのリスナーを設定
  useEffect(() => {
    if (draggingTask) {
      window.addEventListener('mousemove', handleDrag as any);
      window.addEventListener('mouseup', handleDragEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleDrag as any);
      window.removeEventListener('mouseup', handleDragEnd);
    };
  }, [draggingTask, dragType]);

  const dates = getDates();

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex mb-4 space-x-4">
        <button
          onClick={() => setViewMode('day')}
          className={`px-3 py-1 rounded ${
            viewMode === 'day' ? 'bg-blue-500 text-white' : 'bg-gray-200'
          }`}
        >
          日表示
        </button>
        <button
          onClick={() => setViewMode('week')}
          className={`px-3 py-1 rounded ${
            viewMode === 'week' ? 'bg-blue-500 text-white' : 'bg-gray-200'
          }`}
        >
          週表示
        </button>
        <button
          onClick={() => setViewMode('month')}
          className={`px-3 py-1 rounded ${
            viewMode === 'month' ? 'bg-blue-500 text-white' : 'bg-gray-200'
          }`}
        >
          月表示
        </button>
      </div>

      <div className="relative" ref={containerRef}>
        {/* タイムラインのヘッダー */}
        <div className="flex border-b">
          {dates.map((date, index) => (
            <div
              key={index}
              className="w-[100px] min-w-[100px] p-2 text-center border-r"
            >
              {date.toLocaleDateString('ja-JP', {
                month: 'short',
                day: 'numeric',
              })}
            </div>
          ))}
        </div>

        {/* タスクバー */}
        <div className="relative mt-4">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="relative h-8 mb-2"
              style={getTaskStyle(task)}
            >
              <div className="absolute inset-0 bg-blue-500 rounded flex items-center px-2 text-white">
                {task.name}
              </div>
              {/* 開始日ハンドル */}
              <div
                className="absolute left-0 top-0 w-2 h-full cursor-ew-resize bg-blue-700 rounded-l"
                onMouseDown={(e) => handleDragStart(task, 'start', e)}
              />
              {/* 終了日ハンドル */}
              <div
                className="absolute right-0 top-0 w-2 h-full cursor-ew-resize bg-blue-700 rounded-r"
                onMouseDown={(e) => handleDragStart(task, 'end', e)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}; 