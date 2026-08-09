export interface StudyTask {
  id: string;
  title: string;
  completed: boolean;
  task_date: string;
  scheduled_time: string | null;
}
