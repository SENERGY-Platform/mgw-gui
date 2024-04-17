interface jobError {
    message: string;
    code: number;
}

export interface Job {
    id: string;
    completed: Date;
    error: jobError | null;
    started: Date;
    canceled: Date;
    created: Date;
    description: string;  
    result: string; 
}