export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Project {
  id: string;
  name: string;
  color: string;
}

export interface Activity {
  id: string;
  name: string;
  duration: number;
  startTime: Date;
  endTime: Date;
  projectId?: string;
  tagIds: string[];
}
