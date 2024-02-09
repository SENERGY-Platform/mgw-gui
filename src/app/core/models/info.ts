interface MemoryInfo {
    alloc: number;
    alloc_total: number;
    sys_total: number;
    gc_cycles: number;
}

export interface InfoResponse {
    name: string;
    version: string;
    up_time: number;
    mem_stats: MemoryInfo;
}