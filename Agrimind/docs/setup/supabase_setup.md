# Supabase Integration & Setup Guide for Agrimind

This guide details the exact steps to create, configure, and connect your Supabase database and authentication services with the Agrimind Next.js frontend application.

---

## 1. Create a Supabase Project

1. Navigate to **[supabase.com](https://supabase.com)** and sign in or create an account.
2. Click **New Project** from your organization dashboard.
3. Choose your project details:
   - **Name**: `agrimind-db` (or any preferred identifier)
   - **Database Password**: Generate a secure password and store it safely in your password manager.
   - **Region**: Select a region close to your primary users (e.g., `South Asia (Mumbai)` or `US East`).
   - **Pricing Plan**: Free tier is sufficient for development.
4. Click **Create new project** and wait 1–2 minutes for the database to provision.

---

## 2. Retrieve Supabase API Credentials

1. Once the project dashboard is ready, click the **Settings (gear icon)** at the bottom of the left sidebar.
2. Under the **Project Settings** menu, select **API**.
3. Under the **Project API Keys** and **Project URL** section, copy the following values:
   - **Project URL**: e.g., `https://abcdefghijklm.supabase.co`
   - **`anon` `public` key**: A JWT token starting with `eyJh...`

> [!WARNING]
> Never expose your `service_role` secret key in the frontend Next.js code or in client-side bundles. Only use `NEXT_PUBLIC_SUPABASE_ANON_KEY` in the frontend client.

---

## 3. Configure Frontend Environment Variables

1. Inside your terminal, navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Copy `.env.local.example` to create your local `.env.local` file:
   ```bash
   cp .env.local.example .env.local
   ```
3. Open `frontend/.env.local` and paste your actual values:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
4. Save the file. `.env.local` is automatically excluded by `.gitignore` to prevent leaking secrets.

---

## 4. Install Dependencies & Launch Dev Server

1. Install npm dependencies in the `frontend` folder:
   ```bash
   cd frontend
   npm install
   ```
2. Start the Next.js local development server:
   ```bash
   npm run dev
   ```
3. Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## 5. Verify Connectivity via Connection Test Page

1. Open **[http://localhost:3000/test-supabase](http://localhost:3000/test-supabase)** in your browser.
2. The diagnostics page will automatically run:
   - **Environment Variables**: Confirms `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are present and valid.
   - **Client Initializer**: Verifies the `@supabase/supabase-js` instance.
   - **Auth Service Reachability**: Sends an active ping to `supabase.auth.getSession()` and measures network latency (ms).
   - **PostgREST Database API**: Verifies the REST API endpoint responds.
3. You should see a green **"Supabase Connected & Reachable"** status card with latency metrics.

---

## 6. Project Code Reference

- **Client Definition**: [`frontend/lib/supabase.ts`](file:///c:/Users/surya/Downloads/agri%20world/Agrimind/frontend/lib/supabase.ts)
- **Environment Template**: [`frontend/.env.local.example`](file:///c:/Users/surya/Downloads/agri%20world/Agrimind/frontend/.env.local.example)
- **Diagnostic Page**: [`frontend/app/test-supabase/page.tsx`](file:///c:/Users/surya/Downloads/agri%20world/Agrimind/frontend/app/test-supabase/page.tsx)
- **Schema & Migrations Directory**: [`data/schemas/`](file:///c:/Users/surya/Downloads/agri%20world/Agrimind/data/schemas)
