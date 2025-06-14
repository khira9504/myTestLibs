export interface Task {
  id: string;
  name: string;
  start: Date;
  end: Date;
  progress: number;
  dependencies: string;
  custom_class?: string;
} 