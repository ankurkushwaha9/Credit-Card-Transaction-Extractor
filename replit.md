# StatementPro - Financial Statement Processor

## Overview

StatementPro is an enterprise-grade financial application that allows users to securely upload bank or credit card statements (PDF format), extract standardized transaction data, and download the results as Excel or Word documents. The application is designed with bank-grade security principles, emphasizing trust, data isolation, and professional aesthetics.

**Core Features:**
- PDF statement upload with drag-and-drop interface
- Transaction extraction (date, details, amount in USD)
- Export to Excel (.xlsx) or Word (.docx) formats
- Light/dark theme support
- Mobile-responsive design

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework:** React 18 with TypeScript
- **Routing:** Wouter (lightweight client-side routing)
- **State Management:** TanStack React Query for server state
- **Styling:** Tailwind CSS with shadcn/ui component library
- **Build Tool:** Vite with HMR support
- **Design System:** Material Design 3-inspired with Inter font family

The frontend follows a component-based architecture with:
- Pages in `client/src/pages/`
- Reusable components in `client/src/components/`
- UI primitives from shadcn/ui in `client/src/components/ui/`
- Custom hooks in `client/src/hooks/`

### Backend Architecture
- **Runtime:** Node.js with Express
- **Language:** TypeScript (ESM modules)
- **API Pattern:** RESTful endpoints under `/api/`
- **File Handling:** Multer for multipart form uploads (10MB limit, PDF only)
- **PDF Processing:** pdf-parse library for text extraction
- **Document Generation:** ExcelJS for .xlsx, docx library for .docx

### Data Storage
- **Current Implementation:** In-memory storage (MemStorage class)
- **Schema Definition:** Zod schemas in `shared/schema.ts`
- **Database Ready:** Drizzle ORM configured with PostgreSQL dialect
- **Session Storage:** connect-pg-simple available for production sessions

The storage layer uses an interface pattern (`IStorage`) allowing easy swap from memory to PostgreSQL when provisioned.

### API Structure
- `POST /api/statements/upload` - Upload PDF statement
- `GET /api/statements/:id` - Retrieve statement with transactions
- `GET /api/statements/:id/export/:format` - Download as xlsx/docx

### Build System
- Development: `tsx` for TypeScript execution with Vite dev server
- Production: esbuild bundles server, Vite builds client
- Output: `dist/` directory with `index.cjs` (server) and `public/` (client)

## External Dependencies

### Core Services
- **PostgreSQL:** Database (via Drizzle ORM when DATABASE_URL is set)
- **PDF Processing:** pdf-parse for extracting text from uploaded PDFs

### Key Libraries
- **Frontend:** React, TanStack Query, Radix UI primitives, Tailwind CSS
- **Backend:** Express, Multer, ExcelJS, docx
- **Validation:** Zod for runtime type checking and schema validation
- **ORM:** Drizzle ORM with drizzle-kit for migrations

### Development Tools
- **TypeScript:** Strict mode enabled, path aliases configured
- **Vite:** Development server with Replit-specific plugins
- **Tailwind:** Custom theme with CSS variables for theming