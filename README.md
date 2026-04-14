# 💳 Credit Card Transaction Extractor

A Python/Node.js PDF parser that extracts credit card transactions from statements (Citibank, AMEX) and exports to Excel/Word using pdf-parse, ExcelJS, and docx. All processing done locally — no data leaves your machine.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)

## 🚀 Features

- **PDF Statement Parsing** - Upload credit card statements in PDF format
- **Multi-Bank Support** - Works with Citibank, American Express (AMEX), and other major banks
- **Smart Transaction Detection** - Automatically identifies and extracts transaction details
- **Export Options** - Download transactions as Excel (.xlsx) or Word (.docx) documents
- **Modern UI** - Clean, responsive interface with dark/light theme support
- **Privacy Focused** - All processing done locally, no data stored on servers

## 🏦 Supported Banks

| Bank | Status |
|------|--------|
| Citibank (Costco Anywhere Visa) | ✅ Full Support |
| American Express (AMEX) | ✅ Full Support |
| Other Banks | 🔄 Generic Parser |

## 📋 Prerequisites

- Node.js >= 18.0.0
- npm or yarn

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ankurkushwaha9/Credit-Card-Transaction-Extractor.git
   cd Credit-Card-Transaction-Extractor
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   ```
   http://localhost:5000
   ```

## 🏗️ Tech Stack

### Frontend
- React 18
- TypeScript
- Tailwind CSS
- Radix UI Components
- Framer Motion
- React Query

### Backend
- Node.js
- Express.js
- pdf-parse (PDF extraction)
- ExcelJS (Excel generation)
- docx (Word document generation)

## 📁 Project Structure

```
Credit-Card-Transaction-Extractor/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utility functions
│   └── public/            # Static assets
├── server/                # Backend Express server
│   ├── index.ts          # Server entry point
│   ├── routes.ts         # API routes & PDF parsing logic
│   ├── storage.ts        # Data storage
│   └── vite.ts           # Vite middleware
├── shared/               # Shared types/schemas
│   └── schema.ts         # Transaction types
└── package.json
```

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run check` | TypeScript type checking |

## 📊 How It Works

1. **Upload** - Drag & drop or select your credit card PDF statement
2. **Process** - The app parses the PDF and extracts all transactions
3. **Review** - View extracted transactions in a clean table format
4. **Export** - Download as Excel or Word document for further use

## 🔒 Privacy & Security

- **No Cloud Storage** - Your statements are processed locally and never uploaded to external servers
- **Memory Only** - Uploaded files are processed in memory and immediately discarded
- **No Tracking** - No analytics or tracking of your financial data

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License

## 👨‍💻 Author

**Ankur Kushwaha**
- GitHub: [@ankurkushwaha9](https://github.com/ankurkushwaha9)

---

⭐ **If you find this project useful, please consider giving it a star!**
