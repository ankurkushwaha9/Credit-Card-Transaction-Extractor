import type { Statement, InsertStatement, Transaction } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  createStatement(data: InsertStatement): Promise<Statement>;
  getStatement(id: string): Promise<Statement | undefined>;
  updateStatement(id: string, data: Partial<Statement>): Promise<Statement | undefined>;
  deleteStatement(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private statements: Map<string, Statement>;

  constructor() {
    this.statements = new Map();
  }

  async createStatement(data: InsertStatement): Promise<Statement> {
    const id = randomUUID();
    const statement: Statement = {
      id,
      filename: data.filename,
      fileSize: data.fileSize,
      status: "uploading",
      transactions: [],
      uploadedAt: new Date().toISOString(),
    };
    this.statements.set(id, statement);
    return statement;
  }

  async getStatement(id: string): Promise<Statement | undefined> {
    return this.statements.get(id);
  }

  async updateStatement(id: string, data: Partial<Statement>): Promise<Statement | undefined> {
    const statement = this.statements.get(id);
    if (!statement) return undefined;
    
    const updated = { ...statement, ...data };
    this.statements.set(id, updated);
    return updated;
  }

  async deleteStatement(id: string): Promise<boolean> {
    return this.statements.delete(id);
  }
}

export const storage = new MemStorage();
