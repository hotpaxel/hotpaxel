/**
 * Paxel Client Abstraction
 * Supports multiple implementations (Protobuf.js, Connect-Web) for comparative testing.
 */

export interface Asset {
    name: string;
    content: Uint8Array;
    mimeType: string;
}

export interface CompileRequest {
    tex: string;
    assets: Asset[];
    passes: number;
}

export interface CompileResponse {
    pdfChunk?: Uint8Array;
    errorMessage?: string;
    compilerOutput?: string;
}

export interface FontInfo {
    family: string;
    styles: string[];
    fileName: string;
}

export interface DownloadFontRequest {
    fileName: string;
}

export interface FontChunk {
    data: Uint8Array;
}

export interface ValidateFontRequest {
    font: Asset;
}

export interface ValidateFontResponse {
    isValid: boolean;
    familyName?: string;
    errorMessage?: string;
}

export interface SystemVersion {
    name: string;
    version: string;
}

export interface PaxelClient {
    compile(request: CompileRequest): AsyncIterable<CompileResponse>;
    getFonts(): Promise<FontInfo[]>;
    downloadFont(request: DownloadFontRequest): AsyncIterable<FontChunk>;
    validateFont(request: ValidateFontRequest): Promise<ValidateFontResponse>;
    getHealth(): Promise<string>;
    getVersion(): Promise<SystemVersion>;
}

/**
 * Protobuf.js Implementation
 * Focuses on high-performance raw gRPC-Web framing.
 */
export class ProtobufJsClient implements PaxelClient {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl.replace(/\/$/, '');
    }

    // Helper for gRPC-Web framing (5-byte header: 1 byte flags, 4 bytes length)
    private frameRequest(data: Uint8Array): Uint8Array {
        const frame = new Uint8Array(5 + data.length);
        frame[0] = 0; // Data frame (not trailer)
        const len = data.length;
        frame[1] = (len >> 24) & 0xff;
        frame[2] = (len >> 16) & 0xff;
        frame[3] = (len >> 8) & 0xff;
        frame[4] = len & 0xff;
        frame.set(data, 5);
        return frame;
    }

    // Helper to read gRPC-Web framed response
    private async *readFrames(body: ReadableStream<Uint8Array>): AsyncIterable<{ flags: number; data: Uint8Array }> {
        const reader = body.getReader();
        let buffer = new Uint8Array(0);

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const newBuffer = new Uint8Array(buffer.length + value.length);
            newBuffer.set(buffer);
            newBuffer.set(value, buffer.length);
            buffer = newBuffer;

            while (buffer.length >= 5) {
                const flags = buffer[0];
                const len = (buffer[1] << 24) | (buffer[2] << 16) | (buffer[3] << 8) | buffer[4];
                if (buffer.length < 5 + len) break;

                const data = buffer.slice(5, 5 + len);
                yield { flags, data };
                buffer = buffer.slice(5 + len);
            }
        }
    }

    async *compile(request: CompileRequest): AsyncIterable<CompileResponse> {
        console.log('[ProtobufJsClient] compile', request);
        // In actual use, we would use Root.fromJSON(descriptor).lookupType('CompileRequest').encode(request).finish()
        yield { compilerOutput: 'Compiling via Protobuf.js...' };
    }

    async getFonts(): Promise<FontInfo[]> {
        const response = await fetch(`${this.baseUrl}/hotpaxel.v1.FontService/GetFonts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/grpc-web-text' }, // or application/grpc-web+proto
            body: this.frameRequest(new Uint8Array()) as any, // Frame empty request body
        });
        // Decoding logic would go here
        return [];
    }

    async *downloadFont(request: DownloadFontRequest): AsyncIterable<FontChunk> {
        console.log('[ProtobufJsClient] downloadFont', request);
        yield { data: new Uint8Array() };
    }

    async validateFont(request: ValidateFontRequest): Promise<ValidateFontResponse> {
        console.log('[ProtobufJsClient] validateFont', request);
        return { isValid: true };
    }

    async getHealth(): Promise<string> {
        return 'OK';
    }

    async getVersion(): Promise<SystemVersion> {
        return { name: 'hotpaxel', version: '0.2.1-alpha.1' };
    }
}

import { createPromiseClient } from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-web";

// Note: In a real implementation, we would import the generated service and types
// import { CompilerService, FontService, SystemService } from "../gen/hotpaxel/v1/compiler_service_connect";
// For now, this is a structural implementation.

/**
 * Connect-Web Implementation
 * Focuses on developer experience using @connectrpc/connect.
 */
export class ConnectWebClient implements PaxelClient {
    private client: any; // Would be PromiseClient<typeof CompilerService> etc.

    constructor(baseUrl: string) {
        const transport = createConnectTransport({
            baseUrl,
        });
        // this.compilerClient = createPromiseClient(CompilerService, transport);
        // this.fontClient = createPromiseClient(FontService, transport);
        // this.systemClient = createPromiseClient(SystemService, transport);
    }

    async *compile(request: CompileRequest): AsyncIterable<CompileResponse> {
        console.log('[ConnectWebClient] compile', request);
        // Implementation using this.compilerClient.compile(request)
        yield { compilerOutput: 'Compiling via Connect-Web...' };
    }

    async getFonts(): Promise<FontInfo[]> {
        // return (await this.fontClient.getFonts({})).fonts;
        return [];
    }

    async *downloadFont(request: DownloadFontRequest): AsyncIterable<FontChunk> {
        // for await (const chunk of this.fontClient.downloadFont(request)) { yield chunk; }
        yield { data: new Uint8Array() };
    }

    async validateFont(request: ValidateFontRequest): Promise<ValidateFontResponse> {
        // return await this.fontClient.validateFont(request);
        return { isValid: true };
    }

    async getHealth(): Promise<string> {
        // return (await this.systemClient.healthCheck({})).status;
        return 'OK';
    }

    async getVersion(): Promise<SystemVersion> {
        // return await this.systemClient.getVersion({});
        return { name: 'hotpaxel', version: '0.2.1-alpha.1' };
    }
}

/**
 * Client Factory
 */
export const createPaxelClient = (baseUrl: string, type: 'pbjs' | 'connect' = 'pbjs'): PaxelClient => {
    if (type === 'connect') {
        return new ConnectWebClient(baseUrl);
    }
    return new ProtobufJsClient(baseUrl);
};
