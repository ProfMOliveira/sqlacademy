declare module 'sql.js' {

  export interface QueryResult {
    columns: string[];
    values: unknown[][];
  }

  export class Database {
    constructor(data?: ArrayLike<number>);
    run(sql: string, params?: unknown): void;
    exec(sql: string, params?: unknown): QueryResult[];
    close(): void;
  }

  export interface SqlJsStatic {
    Database: typeof Database;
  }

  export interface SqlJsConfig {
    locateFile?: (file: string) => string;
  }

  export default function initSqlJs(config?: SqlJsConfig): Promise<SqlJsStatic>;
}


declare module 'sql.js/dist/sql-asm.js' {
  export interface SqlJsConfig { locateFile?: (file: string) => string; }
  export class Database {
    constructor(data?: Uint8Array);
    run(sql: string, params?: unknown[] | Record<string, unknown>): void;
    exec(sql: string, params?: unknown[] | Record<string, unknown>): Array<{ columns: string[]; values: unknown[][] }>;
    close(): void;
  }
  const initSqlJs: (config?: SqlJsConfig) => Promise<{ Database: typeof Database }>;
  export default initSqlJs;
}
