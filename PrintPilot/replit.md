# PrintPress Pro - Professional Printing Management System

## Overview

PrintPress Pro is a full-stack web application designed for printing press businesses to manage print jobs, calculate pricing, generate receipts, and track orders. The system provides an intuitive interface for creating new print jobs with customizable options (paper size, quantity, print type, finishing options), automatically calculates costs based on configurable price lists, and generates professional PDF receipts. It includes an administrative dashboard for managing pricing and viewing business metrics.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript, using Wouter for client-side routing

**UI Component Library**: Radix UI primitives with shadcn/ui components following the "new-york" style variant

**Styling**: Tailwind CSS with custom design system based on Material Design principles
- Custom CSS variables for theming (light/dark mode support)
- Consistent spacing system using Tailwind units (2, 4, 6, 8)
- Typography hierarchy using Inter font family
- Elevation system with shadow utilities

**State Management**: 
- TanStack React Query for server state and API interactions
- React Hook Form with Zod for form validation
- Local component state with React hooks

**Key Design Decisions**:
- Single-page application with client-side routing for smooth navigation
- Responsive sidebar navigation that collapses on mobile
- Material Design-inspired business application focusing on utility and efficiency
- Consistent form layouts with inline validation

### Backend Architecture

**Runtime**: Node.js with Express.js server

**Database ORM**: Drizzle ORM with PostgreSQL (via Neon serverless driver)
- Schema-first approach with TypeScript types
- Zod schema validation derived from Drizzle schemas

**API Design**: RESTful JSON API with the following endpoints:
- `/api/price-lists` - CRUD operations for pricing configuration
- `/api/orders` - Create and retrieve print job orders
- `/api/receipts` - Generate and retrieve receipts with PDF export

**PDF Generation**: PDFKit library for server-side receipt generation

**Build System**:
- Vite for frontend bundling with HMR in development
- esbuild for server-side bundling in production
- Selective dependency bundling to optimize cold start times

**Key Architectural Decisions**:
- Separation of concerns with dedicated storage layer abstraction (`IStorage` interface)
- Server-side PDF generation for consistent receipt formatting
- Middleware-based request logging for observability
- Raw body preservation for potential webhook integrations

### Data Model

**Price Lists Table**: Configurable pricing for different services
- Fields: serviceName, category (paper/printing/finishing), basePrice, unit, isActive
- Supports categorized pricing for modular cost calculation

**Orders Table**: Print job records
- Fields: jobNumber (unique), paperSize, quantity, printType, finishingOptions (array), additionalSpecs, subtotal, tax, total
- Auto-generated UUID primary keys
- Timestamp tracking with createdAt

**Receipts Table**: Receipt records linked to orders
- Fields: receiptNumber (unique), orderId (foreign key), itemizedBreakdown, subtotal, tax, total
- One-to-one relationship with orders

**Schema Design Rationale**: 
- Normalized structure to avoid data duplication
- Array type for finishingOptions allows flexible multi-select options
- Decimal precision for financial calculations
- Auto-generated identifiers for data integrity

### External Dependencies

**Database**: PostgreSQL via Neon serverless platform
- Requires `DATABASE_URL` environment variable
- WebSocket connection pooling for serverless compatibility

**UI Components**: Radix UI headless component library
- Provides accessible, unstyled primitives
- Full keyboard navigation and ARIA support

**Styling Framework**: Tailwind CSS v3
- Utility-first CSS framework
- Custom configuration extending base theme

**Development Tools**:
- TypeScript for type safety across full stack
- Vite plugins for Replit integration (runtime error overlay, cartographer, dev banner)

**Third-party Services**: Currently none - the application is self-contained with no external API integrations for payment processing, email, or authentication