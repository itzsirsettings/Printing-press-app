# Design Guidelines: Printing Press Management System

## Design Approach
**Selected Framework**: Material Design-inspired Business Application
**Justification**: This is a utility-focused productivity tool requiring efficiency, clarity, and professional presentation for business operations. The design prioritizes usability, data organization, and workflow efficiency over visual flair.

## Typography System
- **Primary Font**: Inter (via Google Fonts CDN) - Clean, professional, excellent at small sizes
- **Hierarchy**:
  - Page Headers: text-3xl font-semibold
  - Section Headers: text-xl font-semibold
  - Card/Panel Headers: text-lg font-medium
  - Body Text: text-base font-normal
  - Labels/Metadata: text-sm font-medium
  - Helper Text: text-sm text-gray-600

## Layout System
**Spacing Units**: Use Tailwind units of 2, 4, 6, and 8 consistently
- Component padding: p-6 or p-8
- Section spacing: space-y-6 or space-y-8
- Form field gaps: gap-4
- Card margins: m-4
- Page containers: max-w-7xl mx-auto px-4

**Grid Structure**: 
- Main layout: Sidebar navigation (w-64) + content area
- Form layouts: Single column on mobile, 2-column grid on desktop (grid-cols-1 md:grid-cols-2)
- Admin dashboard: 3-4 column card grid for metrics (grid-cols-1 md:grid-cols-2 lg:grid-cols-4)

## Core Components

### Navigation
- **Sidebar**: Fixed left navigation (desktop), collapsible hamburger (mobile)
  - Logo/company name at top
  - Main nav items: New Job, Order History, Price Lists (admin), Dashboard (admin)
  - User profile/logout at bottom
  - Active state with subtle background treatment

### Job Entry Form
- **Layout**: Multi-step or single-page comprehensive form in centered card (max-w-4xl)
- **Sections**:
  - Job Details: Paper size dropdown, quantity number input, print type radio buttons
  - Finishing Options: Checkboxes for binding, lamination, cutting, etc.
  - Additional Specifications: Textarea for custom notes
  - Live price calculator: Sticky/fixed summary panel showing running total
- **Form Controls**: Use consistent Material-style inputs with floating labels
- **Validation**: Inline error messages below fields

### Price Calculator Display
- **Position**: Sticky sidebar (desktop) or bottom sheet (mobile)
- **Content**: 
  - Itemized breakdown list
  - Subtotal, tax, and grand total clearly separated
  - Large, prominent total amount (text-2xl font-bold)
  - "Generate Receipt" primary action button

### Receipt View
- **Layout**: Clean, printable document design (max-w-3xl centered)
- **Structure**:
  - Header: Company logo/name, receipt number, date/time
  - Customer/Job info section
  - Itemized table: Service, Quantity, Unit Price, Total columns
  - Summary box: Subtotal, taxes, grand total (right-aligned)
  - Footer: Terms, contact info, thank you message
- **Print Optimization**: Use print:hidden for non-printable elements (export buttons, nav)

### Admin Dashboard
- **Metrics Cards**: 4-column grid showing total orders, revenue, pending jobs, completed today
- **Recent Orders Table**: Sortable columns, pagination, search filter
- **Quick Actions**: Prominent buttons for "Add Price Item" and "View Reports"

### Price List Management
- **Table View**: Editable inline table or modal-based editing
- **Columns**: Service name, base price, unit, status (active/inactive)
- **Actions**: Edit, delete, duplicate row buttons
- **Add New**: Form modal with validation

### Order History
- **Layout**: Full-width table with filters sidebar
- **Filters**: Date range, status, search by job number
- **Table Columns**: Job #, Date, Customer, Total, Status, Actions (View/Download PDF)
- **Row Actions**: Eye icon (view details), download icon (PDF)

## Icon Library
**Font Awesome** (via CDN) for comprehensive business icons:
- fa-file-invoice (receipts)
- fa-print (print jobs)
- fa-dollar-sign (pricing)
- fa-download (PDF export)
- fa-edit, fa-trash (admin actions)
- fa-chart-line (dashboard)

## Component Patterns

### Buttons
- **Primary**: Solid background, rounded-lg, px-6 py-3, font-medium
- **Secondary**: Outline style, same dimensions
- **Icon buttons**: Square aspect ratio (w-10 h-10), centered icon
- **States**: All buttons have built-in hover/active states

### Cards
- **Standard**: rounded-lg shadow-md p-6 
- **Dashboard metrics**: Minimal with icon, label, large number
- **Order cards**: Include header with job number, content area, footer with actions

### Tables
- **Structure**: Striped rows (alternate row shading), sticky header
- **Typography**: Header (font-semibold), cells (font-normal)
- **Spacing**: px-6 py-4 cell padding
- **Responsive**: Horizontal scroll on mobile with min-width preservation

### Forms
- **Input fields**: Consistent height (h-12), rounded-md borders, proper focus states
- **Dropdowns**: Native select with custom styling or library component
- **Radio/Checkbox**: Grouped with proper spacing (space-y-2)

## Responsive Breakpoints
- Mobile: Base styles, single column layouts
- Tablet (md:): 2-column forms, visible sidebar
- Desktop (lg:): 3-4 column grids, full features

## PDF Export Styling
- Use clean, black-and-white printer-friendly design
- Adequate margins (p-8 on document container)
- No shadows or decorative elements in print view
- Clear typography hierarchy with sufficient contrast

## Images
**No hero images required** - this is a functional business application, not a marketing site. Focus purely on interface clarity and workflow efficiency.