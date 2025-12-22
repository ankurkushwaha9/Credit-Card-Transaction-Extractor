import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import ExcelJS from "exceljs";
import { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType, TextRun, HeadingLevel, AlignmentType, BorderStyle } from "docx";
import { PDFParse } from "pdf-parse";
import type { Transaction } from "@shared/schema";
import { randomUUID } from "crypto";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  },
});

// Helper to normalize amount strings to numbers
function normalizeAmount(amountStr: string): number | null {
  let cleaned = amountStr.trim();
  let isNegative = false;
  
  // Handle parentheses for negatives: (123.45) -> -123.45
  if (/^\(.*\)$/.test(cleaned)) {
    isNegative = true;
    cleaned = cleaned.slice(1, -1);
  }
  
  // Handle trailing minus: 123.45- -> -123.45
  if (cleaned.endsWith("-")) {
    isNegative = true;
    cleaned = cleaned.slice(0, -1);
  }
  
  // Handle leading minus
  if (cleaned.startsWith("-")) {
    isNegative = true;
    cleaned = cleaned.slice(1);
  }
  
  // Handle CR (credit) / DR (debit) suffixes
  if (/CR$/i.test(cleaned)) {
    cleaned = cleaned.replace(/CR$/i, "");
  } else if (/DR$/i.test(cleaned)) {
    isNegative = true;
    cleaned = cleaned.replace(/DR$/i, "");
  }
  
  // Remove currency symbols, commas, spaces
  cleaned = cleaned.replace(/[$,\s]/g, "");
  
  const parsed = parseFloat(cleaned);
  if (isNaN(parsed)) return null;
  
  return isNegative ? -parsed : parsed;
}

// Extract date from a line if present
function extractDate(line: string): { date: string; remaining: string } | null {
  const datePatterns = [
    // With year - at start of line
    /^(\d{1,2}\/\d{1,2}\/\d{2,4})\s*/,           // MM/DD/YYYY or MM/DD/YY at start
    /^(\d{1,2}-\d{1,2}-\d{2,4})\s*/,             // MM-DD-YYYY at start
    /^(\d{4}-\d{2}-\d{2})\s*/,                   // YYYY-MM-DD at start
    /^(\w{3}\s+\d{1,2},?\s+\d{2,4})\s*/,         // Jan 01, 2024 at start
    /^(\d{1,2}\s+\w{3}\s+\d{2,4})\s*/,           // 01 Jan 2024 at start
    // Without year - short formats (common in credit card statements)
    /^(\w{3}\s+\d{1,2})\s+/,                     // Jan 07 at start (no year)
    /^(\d{1,2}\s+\w{3})\s+/,                     // 07 Jan at start (no year)
    /^(\d{1,2}\/\d{1,2})\s+/,                    // MM/DD at start (no year)
    /^(\d{1,2}-\d{1,2})\s+/,                     // MM-DD at start (no year)
    // With year - anywhere in line
    /(\d{1,2}\/\d{1,2}\/\d{2,4})/,               // MM/DD/YYYY anywhere
    /(\d{1,2}-\d{1,2}-\d{2,4})/,                 // MM-DD-YYYY anywhere
    /(\d{4}-\d{2}-\d{2})/,                       // YYYY-MM-DD anywhere
    // Without year - anywhere (less strict)
    /\b(\w{3}\s+\d{1,2})\b/,                     // Jan 07 anywhere
    /\b(\d{1,2}\s+\w{3})\b/,                     // 07 Jan anywhere
  ];
  
  // Month names for validation
  const months = /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i;
  
  for (const pattern of datePatterns) {
    const match = line.match(pattern);
    if (match) {
      const dateStr = match[1].trim();
      // Validate month names in text-based dates
      if (/[a-zA-Z]/.test(dateStr)) {
        const hasValidMonth = months.test(dateStr) || /\d{1,2}\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(dateStr);
        if (!hasValidMonth) continue;
      }
      return {
        date: dateStr,
        remaining: line.replace(match[0], "").trim(),
      };
    }
  }
  return null;
}

// Extract amount from a line if present
function extractAmount(line: string): { amount: number; remaining: string } | null {
  // Multiple patterns to match different amount formats
  const amountPatterns = [
    // Parentheses negative: ($1,234.56) or (1,234.56)
    /\(\$?\d{1,3}(?:,\d{3})*\.\d{2}\)/g,
    // Currency with optional negative: $1,234.56, -$1,234.56, $-1,234.56
    /[-]?\$\s*-?\d{1,3}(?:,\d{3})*\.\d{2}/g,
    // Plain with cents and optional CR/DR: 1,234.56, 1,234.56CR, 1,234.56DR
    /\d{1,3}(?:,\d{3})*\.\d{2}\s*(?:CR|DR)?/gi,
    // Trailing minus: 1,234.56-
    /\d{1,3}(?:,\d{3})*\.\d{2}-/g,
    // Simple decimal: 123.45
    /\d+\.\d{2}/g,
  ];
  
  for (const pattern of amountPatterns) {
    const matches = line.match(pattern);
    if (matches && matches.length > 0) {
      // Take the last amount found (usually the transaction total)
      const amountStr = matches[matches.length - 1];
      const amount = normalizeAmount(amountStr);
      if (amount !== null && Math.abs(amount) >= 0.01) {
        return {
          amount,
          remaining: line.replace(amountStr, "").trim(),
        };
      }
    }
  }
  return null;
}

// Detect if a line is a transaction section header
function isTransactionSectionHeader(line: string): boolean {
  const sectionPatterns = [
    /^standard\s+purchases?$/i,
    /^purchases?$/i,
    /^cash\s+advances?$/i,
    /^balance\s+transfers?$/i,
    /^fees?\s+charged$/i,
    /^interest\s+charged$/i,
    /^payments?\s+and\s+credits?$/i,
    /^payments?$/i,
    /^credits?$/i,
    /^transactions?$/i,
    /^account\s+activity$/i,
    /^transaction\s+detail$/i,
    /^transaction\s+history$/i,
  ];
  
  const normalized = line.trim();
  return sectionPatterns.some(pattern => pattern.test(normalized));
}

// Detect if a line is a summary label (not a transaction)
function isSummaryLabel(line: string): boolean {
  const summaryPatterns = [
    /^previous\s+balance/i,
    /^new\s+balance/i,
    /^payment\s+due/i,
    /^minimum\s+payment/i,
    /^credit\s+limit/i,
    /^available\s+credit/i,
    /^statement\s+closing/i,
    /^account\s+summary/i,
    /^account\s+number/i,
    /^billing\s+period/i,
    /^days\s+in\s+billing/i,
    /^total\s+credit\s+line/i,
    /^cash\s+credit\s+line/i,
    /^available\s+for/i,
    /^amount\s+due/i,
    /^total\s+fees/i,
    /^total\s+interest/i,
    /^annual\s+percentage/i,
    /^apr\s+for/i,
    /^balance\s+subject/i,
    /^interest\s+rate/i,
    /^member\s+since/i,
    /^reward/i,
    /^points?\s+earned/i,
    /^points?\s+redeemed/i,
    /^points?\s+balance/i,
  ];
  
  return summaryPatterns.some(pattern => pattern.test(line.trim()));
}

// Check if line starts with dual dates (Citibank format: MM/DD MM/DD)
function extractDualDates(line: string): { postDate: string; transDate: string; remaining: string } | null {
  // Pattern for dual dates at start: "11/09 11/09" or "11/09  11/13"
  const dualDatePattern = /^(\d{1,2}\/\d{1,2})\s+(\d{1,2}\/\d{1,2})\s+(.+)$/;
  const match = line.match(dualDatePattern);
  if (match) {
    return {
      postDate: match[1],
      transDate: match[2],
      remaining: match[3].trim(),
    };
  }
  return null;
}

function parseTransactionsFromText(text: string): Transaction[] {
  const transactions: Transaction[] = [];
  const lines = text.split("\n").map((line) => line.trim()).filter((line) => line.length > 0);
  
  // Detect if this is a Citibank statement
  const isCitibank = /citi|costco\s*(anywhere|visa)/i.test(text);
  console.log(`[PDF Parser] Processing ${lines.length} lines, Citibank detected: ${isCitibank}`);
  
  if (isCitibank) {
    // For Citibank: scan ALL lines for dual-date transaction pattern
    // Format: MM/DD MM/DD DESCRIPTION LOCATION $AMOUNT
    // Some transactions span multiple lines (amount on next line)
    
    let pendingTransaction: { date: string; details: string[] } | null = null;
    let inStandardPurchases = false;
    let inCreditsSection = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Track which section we're in
      if (/^standard\s+purchases?$/i.test(line)) {
        inStandardPurchases = true;
        inCreditsSection = false;
        console.log(`[PDF Parser] Entering Standard Purchases section`);
        continue;
      }
      if (/^credits?$/i.test(line) || /^payments?\s+(and\s+)?credits?$/i.test(line)) {
        inCreditsSection = true;
        inStandardPurchases = false;
        console.log(`[PDF Parser] Entering Credits section - will skip`);
        continue;
      }
      
      // Skip summary and header lines
      if (isSummaryLabel(line) || isTransactionSectionHeader(line)) {
        continue;
      }
      
      // Try Citibank dual-date format (MM/DD MM/DD DESCRIPTION AMOUNT)
      const dualDates = extractDualDates(line);
      if (dualDates) {
        // Save any pending transaction first
        if (pendingTransaction) {
          // Look for amount in current line before the dual dates
          const details = pendingTransaction.details.join(" ").replace(/\s+/g, " ").trim();
          console.log(`[PDF Parser] Discarding incomplete transaction: ${pendingTransaction.date} - ${details}`);
          pendingTransaction = null;
        }
        
        const amountResult = extractAmount(dualDates.remaining);
        if (amountResult) {
          // Complete transaction on one line
          const details = amountResult.remaining.replace(/\s+/g, " ").trim();
          // Skip credits (negative amounts) unless we're explicitly in purchases section
          if (amountResult.amount < 0 && !inStandardPurchases) {
            console.log(`[PDF Parser] Skipping credit transaction: ${dualDates.transDate} - ${details} - $${amountResult.amount}`);
            continue;
          }
          if (details.length > 0) {
            console.log(`[PDF Parser] Found Citibank transaction: ${dualDates.transDate} - ${details} - $${amountResult.amount}`);
            transactions.push({
              id: randomUUID(),
              date: dualDates.transDate,
              details,
              amount: amountResult.amount,
            });
          }
        } else {
          // No amount on this line - start collecting multi-line transaction
          pendingTransaction = {
            date: dualDates.transDate,
            details: [dualDates.remaining],
          };
        }
        continue;
      }
      
      // Check if this line has an amount for a pending transaction
      if (pendingTransaction) {
        const amountResult = extractAmount(line);
        if (amountResult) {
          // Add any remaining text to details
          if (amountResult.remaining.trim().length > 0) {
            pendingTransaction.details.push(amountResult.remaining.trim());
          }
          const details = pendingTransaction.details.join(" ").replace(/\s+/g, " ").trim();
          
          // Skip credits (negative amounts) unless we're explicitly in purchases section  
          if (amountResult.amount < 0 && !inStandardPurchases) {
            console.log(`[PDF Parser] Skipping credit transaction: ${pendingTransaction.date} - ${details} - $${amountResult.amount}`);
          } else if (details.length > 0) {
            console.log(`[PDF Parser] Found Citibank multi-line transaction: ${pendingTransaction.date} - ${details} - $${amountResult.amount}`);
            transactions.push({
              id: randomUUID(),
              date: pendingTransaction.date,
              details,
              amount: amountResult.amount,
            });
          }
          pendingTransaction = null;
        } else {
          // No amount - this is a continuation of the description
          pendingTransaction.details.push(line);
        }
      }
    }
  } else {
    // For other banks: use section-based parsing
    let inTransactionSection = false;
    let currentTransaction: { date: string; details: string[]; amount?: number } | null = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check for transaction section headers
      if (isTransactionSectionHeader(line)) {
        console.log(`[PDF Parser] Found section header: "${line}"`);
        inTransactionSection = true;
        
        // Save any pending transaction before switching sections
        if (currentTransaction && currentTransaction.amount !== undefined) {
          const details = currentTransaction.details.join(" ").replace(/\s+/g, " ").trim();
          if (details.length > 0) {
            transactions.push({
              id: randomUUID(),
              date: currentTransaction.date,
              details,
              amount: currentTransaction.amount,
            });
          }
          currentTransaction = null;
        }
        continue;
      }
      
      // Skip lines if not in a transaction section yet
      if (!inTransactionSection) {
        continue;
      }
      
      // Skip summary labels even within transaction sections
      if (isSummaryLabel(line)) {
        continue;
      }
      
      // Skip common header/footer lines
      if (/^(page\s+\d|description\s+amount|posting\s+date|statement\s+period|date\s+description|trans\s+date)/i.test(line)) {
        continue;
      }
      
      // Check for end of transaction section (new non-transaction section)
      if (/^(account\s+summary|important\s+information|contact\s+us|interest\s+charge|fee\s+summary|2\d{3}\s+totals)/i.test(line)) {
        inTransactionSection = false;
        continue;
      }
      
      // Try single date format
      const dateResult = extractDate(line);
      
      if (dateResult) {
        // If we have a pending transaction, save it
        if (currentTransaction && currentTransaction.amount !== undefined) {
          const details = currentTransaction.details.join(" ").replace(/\s+/g, " ").trim();
          if (details.length > 0) {
            transactions.push({
              id: randomUUID(),
              date: currentTransaction.date,
              details,
              amount: currentTransaction.amount,
            });
          }
        }
        
        // Start a new transaction
        currentTransaction = {
          date: dateResult.date,
          details: [],
        };
        
        // Check if amount is on the same line
        const amountResult = extractAmount(dateResult.remaining);
        if (amountResult) {
          currentTransaction.amount = amountResult.amount;
          if (amountResult.remaining.length > 0) {
            currentTransaction.details.push(amountResult.remaining);
          }
        } else if (dateResult.remaining.length > 0) {
          currentTransaction.details.push(dateResult.remaining);
        }
      } else if (currentTransaction) {
        // No date on this line - it's either a continuation or contains amount
        const amountResult = extractAmount(line);
        
        if (amountResult && currentTransaction.amount === undefined) {
          currentTransaction.amount = amountResult.amount;
          if (amountResult.remaining.length > 0) {
            currentTransaction.details.push(amountResult.remaining);
          }
        } else if (!amountResult) {
          // Line has no amount - treat as details continuation (multi-line description)
          currentTransaction.details.push(line);
        }
      }
    }
    
    // Don't forget the last transaction
    if (currentTransaction && currentTransaction.amount !== undefined) {
      const details = currentTransaction.details.join(" ").replace(/\s+/g, " ").trim();
      if (details.length > 0) {
        transactions.push({
          id: randomUUID(),
          date: currentTransaction.date,
          details,
          amount: currentTransaction.amount,
        });
      }
    }
  }
  
  // Log transaction count for debugging
  console.log(`[PDF Parser] Extracted ${transactions.length} transactions from PDF text`);
  
  // Return whatever transactions we found (even if empty)
  return transactions;
}

async function generateExcel(transactions: Transaction[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "StatementPro";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Transactions");

  // Set column widths and headers
  sheet.columns = [
    { header: "Date", key: "date", width: 15 },
    { header: "Transaction Details", key: "details", width: 50 },
    { header: "Amount (USD)", key: "amount", width: 18 },
  ];

  // Style the header row
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, size: 11 };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE5E7EB" },
  };
  headerRow.alignment = { horizontal: "left" };

  // Add data rows
  transactions.forEach((t) => {
    const row = sheet.addRow({
      date: t.date,
      details: t.details,
      amount: t.amount,
    });

    // Format amount column
    const amountCell = row.getCell("amount");
    amountCell.numFmt = '"$"#,##0.00;[Red]"-$"#,##0.00';
    amountCell.alignment = { horizontal: "right" };
  });

  // Add total row
  const totalRow = sheet.addRow({
    date: "",
    details: "Total",
    amount: transactions.reduce((sum, t) => sum + t.amount, 0),
  });
  totalRow.font = { bold: true };
  totalRow.getCell("amount").numFmt = '"$"#,##0.00;[Red]"-$"#,##0.00';
  totalRow.getCell("amount").alignment = { horizontal: "right" };

  // Add borders
  sheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin", color: { argb: "FFD1D5DB" } },
        left: { style: "thin", color: { argb: "FFD1D5DB" } },
        bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
        right: { style: "thin", color: { argb: "FFD1D5DB" } },
      };
    });
  });

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

async function generateWord(transactions: Transaction[]): Promise<Buffer> {
  const total = transactions.reduce((sum, t) => sum + t.amount, 0);
  const formatAmount = (amount: number) => {
    const formatted = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(Math.abs(amount));
    return amount < 0 ? `-${formatted}` : formatted;
  };

  const tableRows = [
    new TableRow({
      tableHeader: true,
      children: [
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: "Date", bold: true })] })],
          shading: { fill: "E5E7EB" },
          width: { size: 15, type: WidthType.PERCENTAGE },
        }),
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: "Transaction Details", bold: true })] })],
          shading: { fill: "E5E7EB" },
          width: { size: 60, type: WidthType.PERCENTAGE },
        }),
        new TableCell({
          children: [new Paragraph({ 
            children: [new TextRun({ text: "Amount (USD)", bold: true })],
            alignment: AlignmentType.RIGHT,
          })],
          shading: { fill: "E5E7EB" },
          width: { size: 25, type: WidthType.PERCENTAGE },
        }),
      ],
    }),
    ...transactions.map(
      (t) =>
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: t.date, font: "Consolas" })] })],
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: t.details })] })],
            }),
            new TableCell({
              children: [new Paragraph({ 
                children: [new TextRun({ 
                  text: formatAmount(t.amount),
                  font: "Consolas",
                  color: t.amount < 0 ? "DC2626" : undefined,
                })],
                alignment: AlignmentType.RIGHT,
              })],
            }),
          ],
        })
    ),
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph("")] }),
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: "Total", bold: true })] })],
        }),
        new TableCell({
          children: [new Paragraph({ 
            children: [new TextRun({ 
              text: formatAmount(total),
              bold: true,
              font: "Consolas",
            })],
            alignment: AlignmentType.RIGHT,
          })],
        }),
      ],
    }),
  ];

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            children: [new TextRun({ text: "Transaction Statement", bold: true, size: 48 })],
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 400 },
          }),
          new Paragraph({
            children: [
              new TextRun({ 
                text: `Generated on ${new Date().toLocaleDateString("en-US", { 
                  year: "numeric", 
                  month: "long", 
                  day: "numeric" 
                })}`,
                color: "6B7280",
              }),
            ],
            spacing: { after: 400 },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: tableRows,
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: "D1D5DB" },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: "D1D5DB" },
              left: { style: BorderStyle.SINGLE, size: 1, color: "D1D5DB" },
              right: { style: BorderStyle.SINGLE, size: 1, color: "D1D5DB" },
              insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "D1D5DB" },
              insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "D1D5DB" },
            },
          }),
          new Paragraph({
            children: [
              new TextRun({ 
                text: `${transactions.length} transaction${transactions.length !== 1 ? "s" : ""} extracted`,
                color: "6B7280",
                size: 20,
              }),
            ],
            spacing: { before: 400 },
          }),
        ],
      },
    ],
  });

  return Buffer.from(await Packer.toBuffer(doc));
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Upload and process statement
  app.post("/api/statements/upload", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Create statement record
      const statement = await storage.createStatement({
        filename: req.file.originalname,
        fileSize: req.file.size,
      });

      // Update status to processing
      await storage.updateStatement(statement.id, { status: "processing" });

      // Parse PDF using pdf-parse v2 API
      let transactions: Transaction[] = [];
      try {
        const parser = new PDFParse({ data: req.file.buffer });
        const pdfData = await parser.getText();
        console.log(`[PDF Parser] Pages: ${pdfData.numpages}, Text length: ${pdfData.text.length} chars`);
        // Log first 2000 chars to see PDF structure
        console.log(`[PDF Parser] Sample text:\n${pdfData.text.substring(0, 2000)}`);
        transactions = parseTransactionsFromText(pdfData.text);
        await parser.destroy();
      } catch (pdfError) {
        console.error("PDF parsing error:", pdfError);
        await storage.updateStatement(statement.id, {
          status: "error",
          errorMessage: "Failed to parse PDF file",
        });
        return res.status(400).json({ message: "Failed to parse PDF. Please ensure it's a valid bank or credit card statement." });
      }

      // Update with results
      await storage.updateStatement(statement.id, {
        status: "completed",
        transactions,
      });

      res.json({ statementId: statement.id, message: "Statement processed successfully" });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ message: "Failed to process statement" });
    }
  });

  // Get statement by ID
  app.get("/api/statements/:id", async (req, res) => {
    try {
      const statement = await storage.getStatement(req.params.id);
      if (!statement) {
        return res.status(404).json({ message: "Statement not found" });
      }
      res.json(statement);
    } catch (error) {
      console.error("Get statement error:", error);
      res.status(500).json({ message: "Failed to retrieve statement" });
    }
  });

  // Export statement as Excel or Word
  app.get("/api/statements/:id/export", async (req, res) => {
    try {
      const statement = await storage.getStatement(req.params.id);
      if (!statement) {
        return res.status(404).json({ message: "Statement not found" });
      }

      const format = req.query.format as string;
      if (format !== "xlsx" && format !== "docx") {
        return res.status(400).json({ message: "Invalid format. Use xlsx or docx" });
      }

      let buffer: Buffer;
      let contentType: string;
      let filename: string;

      if (format === "xlsx") {
        buffer = await generateExcel(statement.transactions);
        contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        filename = "transactions.xlsx";
      } else {
        buffer = await generateWord(statement.transactions);
        contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        filename = "transactions.docx";
      }

      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (error) {
      console.error("Export error:", error);
      res.status(500).json({ message: "Failed to export statement" });
    }
  });

  return httpServer;
}
