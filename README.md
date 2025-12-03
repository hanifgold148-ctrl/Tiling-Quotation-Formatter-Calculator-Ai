# Tiling Quotation Formatter & Calculator AI

An AI-powered PWA (Progressive Web App) designed for professional tilers to convert rough notes, measurements, or OCR text into complete, professional tiling quotations.

## Features

*   **AI Generation**: Powered by Google Gemini 2.5 Flash to interpret natural language or rough notes.
*   **Image to Text**: Upload photos of handwritten notes for automatic processing.
*   **Calculations**: Automatic calculation of cartons, square meters, and material costs based on customizable settings.
*   **PDF Generation**: Export professional, branded PDF quotations and invoices.
*   **Cloud Sync**: Real-time data synchronization using Supabase (PostgreSQL).
*   **User Authentication**: Secure login and sign-up with email verification.
*   **Invoicing**: Convert quotes to invoices, track payments, and generate receipts.
*   **Site Diary**: Keep track of daily job progress.
*   **Offline Capable**: Installable as a PWA on mobile and desktop.

## Tech Stack

*   **Frontend**: React, TypeScript, Vite, Tailwind CSS
*   **AI**: Google GenAI SDK (`@google/genai`)
*   **Backend/DB**: Supabase (Auth & Database)
*   **Utilities**: `jspdf` (PDF), `xlsx` (Excel), `docx` (Word)

## Setup & Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/tiling-quotation-ai.git
    cd tiling-quotation-ai
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Variables:**
    Create a `.env` file in the root directory and add your keys (optional for local dev if hardcoded, but recommended for production):
    ```env
    API_KEY=your_google_gemini_api_key
    ```

4.  **Run Locally:**
    ```bash
    npm run dev
    ```

## Database Schema (Supabase)

This app requires the following tables in Supabase:
*   `quotations`
*   `invoices`
*   `clients`
*   `expenses`
*   `journal_entries`
*   `settings`

Ensure Row Level Security (RLS) is enabled for all tables to secure user data.

## Deployment

This project is optimized for deployment on Netlify or Vercel.

1.  Connect your GitHub repository.
2.  Set the `API_KEY` in the deployment platform's environment variables.
3.  Deploy!

## License

Private / Proprietary
