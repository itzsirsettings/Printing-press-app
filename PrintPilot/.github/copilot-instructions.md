# PrintPilot: AI Agent Coding Instructions

## Project Overview
PrintPilot is a full-stack printing press management system built with React/TypeScript frontend, Express backend, PostgreSQL database (via Drizzle ORM), and styled with Tailwind + shadcn/ui. It manages job orders, pricing, receipts, customer accounts, and financial tracking (deposits, expenses, goodwill).

## Architecture & Data Flow

### Monorepo Structure
- **`client/`**: Vite + React SPA with routing via Wouter
- **`server/`**: Express API serving both endpoints and static files
- **`shared/`**: Database schema (Drizzle ORM) + Zod types used by both layers
- **`script/`**: Build orchestration (esbuild for server, Vite for client)

### Critical Data Flow Pattern
1. **Frontend (React)** → `apiRequest()` in `client/src/lib/queryClient.ts` → Fetch to `/api/*`
2. **Backend (Express)** → `server/routes.ts` validates Zod schemas → `storage.ts` handles DB operations
3. **Database**: PostgreSQL with Drizzle ORM; schema in `shared/schema.ts` drives both API validation and types

**Key insight**: All data types auto-derive from Drizzle schema using `createInsertSchema(table)` → Zod validators → TypeScript types. Single source of truth for data contracts.

### API Structure
Routes in `server/routes.ts` follow RESTful CRUD pattern:
- `/api/price-lists` (GET/POST/PUT/DELETE) - Product pricing master data
- `/api/orders` (GET/POST) - Job orders; POST auto-calculates breakdown via price matching
- `/api/receipts/:orderId` (GET), `/api/receipts/:orderId/pdf` (PDF generation via PDFKit)
- `/api/customers`, `/api/sales`, `/api/deposits`, `/api/expenses` - Financial tracking

**Price Calculation Logic** (critical for order flow):
- Server matches order fields (paperSize, printType, finishingOptions) against active price list entries
- Builds itemized breakdown array, applies 10% tax, stores raw JSON in receipt
- This happens in `POST /api/orders` at line ~115 of routes.ts

## Build & Dev Workflow

### Commands
```bash
npm run dev         # Start Express server with hot-reload (tsx watches server/index.ts)
npm run build       # Vite client + esbuild server (bundles allowlist deps to reduce cold-start)
npm start           # Run production bundle (dist/index.cjs)
npm run check       # TypeScript validation
npm run db:push     # Apply Drizzle migrations (requires DATABASE_URL env var)
```

### Build System Notes
- **Client**: Vite builds to `dist/public/` (defined in vite.config.ts root: client/)
- **Server**: esbuild bundles to `dist/index.cjs`; allowlist in `script/build.ts` controls bundled vs external deps
- **Port**: Always 5000 in Replit (hardcoded in server/index.ts); configured via PORT env var
- **Environment**: NODE_ENV=development loads Vite dev server; production uses static files

### Path Aliases (tsconfig.json)
- `@/` → `client/src/`
- `@shared/` → `shared/`
- `@assets/` → `attached_assets/`

## UI & Component Patterns

### Framework Stack
- **Shadcn/ui**: Headless Radix components (55+ pre-built in `client/src/components/ui/`)
- **Tailwind CSS**: Core styling with custom spacing units (p-6, gap-4, space-y-8 standard)
- **Wouter**: Lightweight router; routes defined in `App.tsx` (not file-based)

### Page Structure
- **Layout**: Sidebar + main content; sidebar collapses on mobile via SidebarProvider
- **Pages** in `client/src/pages/`:
  - `new-job.tsx` - Complex multi-service form with live price preview (600+ lines)
  - `order-history.tsx` - Orders table with filters and PDF export
  - `admin-dashboard.tsx` - Metrics cards and charts (Recharts)
  - `admin-prices.tsx` - Price list management table
  - `receipt-view.tsx` - Printable receipt document
  - `not-found.tsx` - 404 handler

### Form Pattern (React Hook Form + Zod)
Example from `new-job.tsx`:
```typescript
const form = useForm<JobFormValues>({
  resolver: zodResolver(jobFormSchema),
  defaultValues: { serviceType: "printing", quantity: 1 }
});
```
All forms use this pattern. Validators live in component or import from shared schema.

### Data Fetching (TanStack React Query)
- `queryClient` configured with staleTime: Infinity, no refetch on focus
- GET requests use `getQueryFn({ on401: "throw" })` helper
- Mutations handle POST/PUT/DELETE
- On success: `queryClient.invalidateQueries()` or manual refetch

**Custom hooks**:
- `use-toast.ts` - Toast notification provider pattern
- `use-mobile.tsx` - Responsive breakpoint detection

### Styling Conventions (from design_guidelines.md)
- Typography hierarchy: text-3xl (headers) → text-base (body) → text-sm (labels)
- Component padding: p-6 or p-8; gaps: gap-4, space-y-6
- Admin grids: `grid-cols-1 md:grid-cols-2 lg:grid-cols-4` for 4-col layout
- Buttons: `rounded-lg px-6 py-3 font-medium`
- Cards: `rounded-lg shadow-md p-6`
- Tables: Sticky header, striped rows, px-6 py-4 cells

## Domain Model & Business Logic

### Core Entities (from shared/schema.ts)
1. **Price Lists** - Master data; category (paper/printing/finishing) + serviceName + basePrice + unit
2. **Orders** - Job order; links to prices via name matching; stores itemized breakdown in receipt
3. **Receipts** - Generated per order; itemizedBreakdown stored as JSON string
4. **Customers** - Contact + balance tracking (deposits, goodwill deductions)
5. **Sales**, **Deposits**, **Expenses**, **Goodwill Transactions** - Financial ledgers

### Price Matching Strategy
Order creation doesn't store foreign keys to price_lists. Instead:
- Query all price lists when order is created
- Filter by category (e.g., `category === "paper" AND serviceName contains "A4"`)
- Use matched basePrice to calculate item total
- Store entire breakdown as JSON for auditability

**This means**: Changes to price_lists won't auto-update past orders (historical accuracy), but new orders always use current prices.

### Receipt Generation
- PDF generation in `GET /api/receipts/:orderId/pdf` uses PDFKit
- Outputs job details, itemized table, and company branding
- Breakdown data retrieves from receipt.itemizedBreakdown (JSON)

## Key Developer Patterns

### Adding a New API Endpoint
1. Define Zod schema in `shared/schema.ts` (with `createInsertSchema()`)
2. Add storage method in `server/storage.ts` (DatabaseStorage class)
3. Register route in `server/routes.ts` with try/catch and Zod validation
4. Call `apiRequest()` from client OR use React Query mutation

### Adding a New Page
1. Create `.tsx` file in `client/src/pages/`
2. Add `<Route path="/path" component={Component} />` in `App.tsx`
3. Import UI components from `@/components/ui/` and hooks
4. Use React Query for data fetching

### Adding a Database Table
1. Define in `shared/schema.ts` with Drizzle types
2. Export Zod schema via `createInsertSchema()`
3. Add methods to `DatabaseStorage` in `server/storage.ts`
4. Run `npm run db:push` to apply migration

### Error Handling
- Frontend: `apiRequest()` throws on HTTP errors; mutations/queries handle with `.onError()`
- Backend: Express error middleware catches errors; returns JSON `{ message: "..." }`
- Zod errors: Caught explicitly; return `{ error: error.errors }` with 400 status

## Common Gotchas
- **Tax hardcoded to 10%** in order creation (line ~150 routes.ts) - change requires schema update
- **No authentication** currently; all routes public
- **Price matching is string-based** (`.includes()`) - watch for name mismatches
- **Breadcrumb/navs**: Use design_guidelines.md for spacing/sizing; don't invent new patterns
- **PDF export**: Receipt data retrieves from DB via receipt.itemizedBreakdown JSON; order data for header
