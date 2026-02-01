import pLimit from 'p-limit';
import { CONFIG } from './config';

export class QueueFullError extends Error {
    constructor() {
        super('Queue is full');
        this.name = 'QueueFullError';
    }
}

export class QueueManager {
    private limit;

    // These are tracked by p-limit logic largely, but p-limit doesn't explicitly expose "queued".
    // pLimit.activeCount and pLimit.pendingCount are available.

    constructor() {
        this.limit = pLimit(CONFIG.MAX_CONCURRENT_JOBS);
    }

    get activeCount() {
        return this.limit.activeCount;
    }

    get queuedCount() {
        return this.limit.pendingCount;
    }

    /**
     * Submit a job to the queue.
     * Throws QueueFullError if active + queued >= MAX_QUEUE_SIZE.
     */
    async submit<T>(fn: () => Promise<T>): Promise<T> {
        const totalLoad = this.activeCount + this.queuedCount;

        // Strict Gate: Reject if we are already at capacity
        if (totalLoad >= CONFIG.MAX_QUEUE_SIZE) {
            throw new QueueFullError();
        }

        return this.limit(fn);
    }
}

export const queueManager = new QueueManager();
