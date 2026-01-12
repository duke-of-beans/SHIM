// Manual type declarations for Node.js built-ins
// This file provides types when @types/node is not available

declare module 'fs' {
  export interface Dirent {
    name: string;
    isFile(): boolean;
    isDirectory(): boolean;
    isSymbolicLink(): boolean;
  }
  
  export const promises: any;
  export function readFileSync(path: string, encoding?: string): string | Buffer;
  export function writeFileSync(path: string, data: string | Buffer, encoding?: string): void;
  export function existsSync(path: string): boolean;
  export function mkdirSync(path: string, options?: any): void;
  export function readdirSync(path: string): string[];
  export function readdirSync(path: string, options: { withFileTypes: true }): Dirent[];
  export function statSync(path: string): any;
  export function unlinkSync(path: string): void;
  export function rmdirSync(path: string, options?: any): void;
  export function copyFileSync(src: string, dest: string): void;
}

declare module 'path' {
  export function join(...paths: string[]): string;
  export function resolve(...paths: string[]): string;
  export function dirname(path: string): string;
  export function basename(path: string, ext?: string): string;
  export function extname(path: string): string;
  export const sep: string;
}

declare module 'os' {
  export function cpus(): any[];
  export function totalmem(): number;
  export function freemem(): number;
  export function platform(): string;
  export function homedir(): string;
  export function tmpdir(): string;
  export function userInfo(): { username: string; uid: number; gid: number; shell: string; homedir: string };
}

declare module 'child_process' {
  export function exec(command: string, callback?: (error: Error | null, stdout: string, stderr: string) => void): any;
  export function exec(command: string, options: any, callback?: (error: Error | null, stdout: string, stderr: string) => void): any;
  export function spawn(command: string, args?: string[], options?: any): any;
  export function execSync(command: string, options?: any): Buffer | string;
}

declare module 'util' {
  export function promisify<T extends (...args: any[]) => any>(fn: T): (...args: any[]) => Promise<any>;
}

declare module 'events' {
  export class EventEmitter {
    on(event: string, listener: (...args: any[]) => void): this;
    emit(event: string, ...args: any[]): boolean;
    removeListener(event: string, listener: (...args: any[]) => void): this;
  }
}

declare module 'zlib' {
  export function gzip(buffer: Buffer, callback: (error: Error | null, result: Buffer) => void): void;
  export function gunzip(buffer: Buffer, callback: (error: Error | null, result: Buffer) => void): void;
  export function gzipSync(buffer: Buffer): Buffer;
  export function gunzipSync(buffer: Buffer): Buffer;
}

declare module 'http' {
  export class Server {
    listen(port: number, callback?: () => void): this;
    close(callback?: () => void): void;
    on(event: string, listener: (...args: any[]) => void): this;
  }
  export function createServer(requestListener?: (req: any, res: any) => void): Server;
}

declare module 'typescript' {
  export interface Node {
    kind: any;
    pos: number;
    end: number;
    parent?: Node;
    name?: any;
    parameters?: any[];
    moduleSpecifier?: StringLiteral;
    importClause?: any;
    statements?: Statement[];
    getText(): string;
  }
  export interface StringLiteral extends Node {
    text: string;
  }
  export interface Statement extends Node {}
  
  export const SyntaxKind: any;
  export function createSourceFile(fileName: string, sourceText: string, languageVersion: any, setParentNodes?: boolean): any;
  export function forEachChild(node: any, callback: (child: any) => void): void;
  export const ScriptTarget: any;
  
  export function isFunctionDeclaration(node: Node): boolean;
  export function isImportDeclaration(node: Node): boolean;
  export function isNamedImports(node: any): boolean;
  export function isReturnStatement(node: Node): boolean;
  export function isBlock(node: Node): boolean;
  export function isIfStatement(node: Node): boolean;
  export function isWhileStatement(node: Node): boolean;
  export function isForStatement(node: Node): boolean;
  export function isCaseClause(node: Node): boolean;
  export function isConditionalExpression(node: Node): boolean;
}

declare module 'uuid' {
  export function v4(): string;
}

// Global Node.js types
declare namespace NodeJS {
  interface Timer {
    ref(): this;
    unref(): this;
    hasRef(): boolean;
  }
  interface Timeout extends Timer {}
}

declare const process: {
  env: { [key: string]: string | undefined };
  cwd(): string;
  exit(code?: number): never;
  argv: string[];
  platform: string;
  pid: number;
  stderr: { write(data: string): void };
  stdout: { write(data: string): void };
};

declare const Buffer: {
  from(data: string | number[], encoding?: string): any;
  alloc(size: number): any;
  concat(buffers: any[]): any;
  isBuffer(obj: any): boolean;
};

declare const __dirname: string;
declare const __filename: string;

declare function require(id: string): any;
declare namespace require {
  const main: any;
}
declare const module: { exports: any };

// clearTimeout/setTimeout should accept NodeJS.Timeout or number
declare function clearTimeout(timeoutId: NodeJS.Timeout | number | undefined): void;
declare function setTimeout(callback: (...args: any[]) => void, ms: number, ...args: any[]): NodeJS.Timer;
declare function setInterval(callback: (...args: any[]) => void, ms: number, ...args: any[]): NodeJS.Timer;
declare function clearInterval(intervalId: NodeJS.Timer | number | undefined): void;
