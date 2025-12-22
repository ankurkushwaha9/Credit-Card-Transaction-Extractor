import { z } from "zod";

// Transaction extracted from statement
export const transactionSchema = z.object({
  id: z.string(),
  date: z.string(),
  details: z.string(),
  amount: z.number(),
});

export type Transaction = z.infer<typeof transactionSchema>;

// Statement upload and processing
export const statementSchema = z.object({
  id: z.string(),
  filename: z.string(),
  fileSize: z.number(),
  status: z.enum(["uploading", "processing", "completed", "error"]),
  transactions: z.array(transactionSchema),
  errorMessage: z.string().optional(),
  uploadedAt: z.string(),
});

export type Statement = z.infer<typeof statementSchema>;

// Insert schema for new statement upload
export const insertStatementSchema = z.object({
  filename: z.string(),
  fileSize: z.number(),
});

export type InsertStatement = z.infer<typeof insertStatementSchema>;

// Export format options
export const exportFormatSchema = z.enum(["xlsx", "docx"]);
export type ExportFormat = z.infer<typeof exportFormatSchema>;

// API response types
export const uploadResponseSchema = z.object({
  statementId: z.string(),
  message: z.string(),
});

export type UploadResponse = z.infer<typeof uploadResponseSchema>;

export const exportResponseSchema = z.object({
  downloadUrl: z.string(),
  expiresAt: z.string(),
});

export type ExportResponse = z.infer<typeof exportResponseSchema>;
