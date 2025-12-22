# StatementPro - Financial Statement Processor

## Overview
StatementPro is a secure web application that allows users to upload bank or credit card statements (PDF format), extract transaction data, and download the results as Excel (.xlsx) or Word (.docx) files.

## Current State
**Status:** MVP Complete
- Upload functionality with drag-and-drop support
- PDF parsing with transaction extraction
- Transaction table display with sorting
- Excel and Word export functionality
- Dark/light theme toggle
- Responsive design for mobile and desktop

## Project Architecture

### Frontend (React + TypeScript)
- **client/src/App.tsx** - Main app component with routing and providers
- **client/src/pages/home.tsx** - Main page with upload, processing, and results states
- **client/src/components/**
  - `theme-provider.tsx` - Dark/light theme context
  - `header.tsx` - App header with branding and theme toggle
  - `file-dropzone.tsx` - Drag-and-drop file upload component
  - `transaction-table.tsx` - Sortable transaction data table
  - `format-selector.tsx` - Excel/Word format selection
  - `processing-view.tsx` - Loading state during processing

### Backend (Express + TypeScript)
- **server/routes.ts** - API endpoints for upload, retrieval, and export
- **server/storage.ts** - In-memory storage for statements

### Shared
- **shared/schema.ts** - TypeScript types and Zod schemas for transactions and statements

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/statements/upload` | POST | Upload PDF file (multipart/form-data) |
| `/api/statements/:id` | GET | Get statement with transactions |
| `/api/statements/:id/export` | GET | Export as xlsx or docx (query param: format) |

## Technologies Used
- **Frontend:** React, TanStack Query, Tailwind CSS, Shadcn/UI, Wouter
- **Backend:** Express.js, Multer (file upload), pdf-parse (PDF parsing)
- **Document Generation:** ExcelJS (xlsx), docx (Word documents)

## Design System
- **Primary Font:** Inter (UI text)
- **Monospace Font:** JetBrains Mono (transaction data)
- **Color Scheme:** Professional blue tones (210 hue)
- **Theme:** Dark and light mode support

## User Preferences
- None recorded yet

## Recent Changes
- December 22, 2025: Initial MVP implementation with complete upload-to-export flow
