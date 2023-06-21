export interface Job {
    id: string;
    completed: Date;
    error: string | null;
    started: Date;
    canceled: Date;
    created: Date;
    description: string;   
}