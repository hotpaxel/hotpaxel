export const CONFIG = {
    PORT: process.env.PORT ? parseInt(process.env.PORT) : 3000,
    /** Max concurrent compilations (XeLaTeX is CPU heavy) */
    MAX_CONCURRENT_JOBS: process.env.MAX_CONCURRENT_JOBS ? parseInt(process.env.MAX_CONCURRENT_JOBS) : 2,
    /** Max Pending + Active jobs. If exceeded, return 429. */
    MAX_QUEUE_SIZE: process.env.MAX_QUEUE_SIZE ? parseInt(process.env.MAX_QUEUE_SIZE) : 10,
    /** Payload limit in bytes (5MB) */
    MAX_PAYLOAD_BYTES: 5 * 1024 * 1024,
    /** Job Timeout in ms (15s) */
    JOB_TIMEOUT_MS: 15_000,

    /** Feature Flags */
    ENABLE_ASSETS: process.env.ENABLE_ASSETS === 'true',
    ENABLE_LOCAL_STORAGE: process.env.ENABLE_LOCAL_STORAGE === 'true',
};
