import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import fs from 'fs-extra';
import { CONFIG } from './config';
import { queueManager, QueueFullError } from './queue';
import { Job, CompileError } from './compiler';
import { getStorageAdapter } from './storage/adapter';
import { AssetSecurityError } from './asset-manager';

const app = new Hono();

// 1. Strict Payload & Queue Guard Middleware
app.use('/compile', async (c, next) => {
    // A. Queue Check (Fast Fail)
    if (queueManager.activeCount + queueManager.queuedCount >= CONFIG.MAX_QUEUE_SIZE) {
        c.status(429);
        c.header('Retry-After', '5');
        return c.json({ error: 'Too Many Requests', message: 'Queue is full' });
    }

    // B. Pre-parsing Payload Check
    const contentLength = c.req.header('content-length');
    if (contentLength && parseInt(contentLength) > CONFIG.MAX_PAYLOAD_BYTES) {
        c.status(413);
        return c.json({ error: 'Payload Too Large', message: 'Payload exceeds 5MB limit' });
    }

    // Note: For a strictly robust system, we would also wrap the body stream to enforce 
    // the limit during reading, in case Content-Length is missing or faked.
    // Hono's `c.req.json()` reads the entire body into memory. 
    // We rely on node server limits or reverse proxy (nginx/cloud run) for hard stream enforcement usually.
    // Here we explicitly check the header as requested.

    await next();
});

// 2. Main Endpoint
app.post('/compile', async (c) => {
    let job: Job | null = null;

    try {
        // Parse Body
        // If the body is larger than memory limit, node might crash or reject. 
        // We rely on the content-length check above for "polite" clients.
        const body = await c.req.json();

        // Validate Schema (Basic)
        if (!body.tex || typeof body.tex !== 'string') {
            return c.json({ error: 'Bad Request', message: 'Missing or invalid "tex" field' }, 400);
        }

        // Create Job
        job = new Job(body.tex, body.assets || []);

        // Run Job via Queue
        const pdfPath = await queueManager.submit(() => job!.run());

        // Handle Output Mode
        const mode = c.req.query('mode');

        if (mode === 'url') {
            const adapter = getStorageAdapter();
            if (!adapter) {
                return c.json({ error: 'Not Implemented', message: 'URL mode requires a storage adapter' }, 501);
            }

            const { url } = await adapter.put(pdfPath);
            // We can clean up immediately after upload
            await job.cleanup();

            return c.json({ url });
        } else {
            // Default: Stream
            const stream = fs.createReadStream(pdfPath);

            // Cleanup hook: stream.on('close') ? 
            // It's risky to delete the file while streaming. 
            // In a real robust system, we'd use a file descriptor or rely on OS temp cleaning,
            // or duplicate the file to a buffer if small enough (but we want to stream).
            // Solution: Stream via Hono, and try to cleanup after response is sent?
            // Hono's `stream` helper might be useful.
            // For now, simple approach:
            // We return the stream. The file will remain in /tmp until... when?
            // REQUIRED: "All temp files MUST be deleted after completion"
            // If we stream, we must delete AFTER stream ends.

            stream.on('close', () => {
                job?.cleanup().catch(console.error);
            });

            c.header('Content-Type', 'application/pdf');
            return c.body(stream as any); // Hono node adapter supports node streams in body
        }

    } catch (err: any) {
        // Ensure cleanup on error
        if (job) await job.cleanup().catch(console.error);

        if (err instanceof QueueFullError) {
            return c.json({ error: 'Too Many Requests', message: 'Queue is full' }, 429);
        }
        if (err instanceof CompileError) {
            return c.json({ error: 'Compilation Failed', summary: err.message }, 400);
        }
        if (err instanceof AssetSecurityError) {
            return c.json({ error: 'Security Violation', message: err.message }, 403);
        }

        // Generic Error (Timeout, etc)
        console.error('Internal Error:', err);
        return c.json({ error: 'Internal Server Error', message: 'An unexpected error occurred' }, 500);
    }
});

export { app };

if (process.env.NODE_ENV !== 'test') {
    serve({
        fetch: app.fetch,
        port: CONFIG.PORT
    }, (info) => {
        console.log(`PAXEL Server listening on port ${info.port}`);
    });
}
