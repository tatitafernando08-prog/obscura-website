export interface StudyTask {
  id: string;
  title: string;
  subtitle: string | null;
  completed: boolean;
  task_date: string;
  scheduled_time: string | null;
}

export interface NewStudyTask {
  user_id: string;
  title: string;
  subtitle: string | null;
  scheduled_time: string | null;
  task_date: string;
}
