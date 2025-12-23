# RFQ/RFI Analytics & Reporting System

A full-stack analytics platform for sourcing events (RFQ/RFI) with interactive query building, real-time filtering, and advanced reporting capabilities. Built with .NET 8, React, TypeScript, and Cube.js.

## Key Features

✅ **Interactive Query Builder** - Select KPIs, dimensions, and filters in real-time  
✅ **Advanced Filters with OR Support** - Combine multiple filter expressions with AND/OR logic  
✅ **Dynamic Field Filtering** - Show only RFQ or RFI-specific fields based on Event Type  
✅ **Real-time Updates** - Auto-run queries as you select columns (100ms debounce)  
✅ **Unified Events View** - RFQ and RFI data combined with smart field handling  
✅ **Semantic Layer** - Business-friendly field names with validation and security  
✅ **Responsive Design** - Full-page layout with sticky sidebar  
✅ **Empty State UX** - Clean messaging when no data is selected  

## Technology Stack

- **Backend**: .NET 8 (ASP.NET Core)
- **Frontend**: React 18 + TypeScript + Vite
- **Analytics Engine**: Cube.js (metrics layer & query optimization)
- **Database**: SQL Server (via Foreign Data Wrappers from multiple services)
- **Styling**: CSS Modules

## Architecture Overview

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│             │         │             │         │             │         │             │
│  Frontend   │────────▶│  .NET API   │────────▶│  Cube.js    │────────▶│  Database   │
│   (React)   │  HTTP   │ Controllers │  HTTP   │   Server    │   SQL   │ (SQL Server)│
│             │◀────────│             │◀────────│             │◀────────│             │
└─────────────┘  JSON   └─────────────┘  JSON   └─────────────┘  Data   └─────────────┘
```

## Project Structure & Layers

### 📂 Backend (`ReportingWithCube/`)

The .NET backend provides a semantic layer and API gateway between the frontend and Cube.js analytics engine.

#### **Controllers/** - API Endpoints
- `AnalyticsController.cs` - Main analytics API endpoints
  - `POST /api/analytics/query` - Execute analytics queries
  - `GET /api/analytics/datasets` - Get available datasets and their schemas
  - `GET /api/analytics/datasets/{id}/schema` - Get dataset schema (measures, dimensions, filters)
- `ReportManagementController.cs` - Saved report management
  - `POST /api/reports` - Save report configurations
  - `GET /api/reports` - List user's saved reports
  - `DELETE /api/reports/{id}` - Delete saved reports

#### **Services/** - Business Logic Layer
- `CubeService.cs` - Cube.js HTTP client wrapper
  - Communicates with Cube.js server via HTTP
  - Handles authentication and request formatting
  - Transforms Cube.js responses to application models
- `ReportManagementService.cs` - Report persistence
  - CRUD operations for saved reports
  - User report configuration management

#### **Analytics/** - Semantic Layer & Query Translation

**Analytics/Core/** - Core enumerations and types
- `EventType.cs` - Event type enumeration (RFQ, RFI, All) with metadata helpers
- `DimensionType.cs` - Dimension categorization (People, Organization, Time, Status, etc.)
- `MeasureType.cs` - Measure categorization (Count, Financial, Rate, TimeBased, etc.)

**Analytics/Models/** - Data Transfer Objects
- `AnalyticsModels.cs` - Core analytics models
  - `UiQueryRequest` - UI query format (user-friendly field names)
  - `CubeQuery` - Cube.js native query format
  - `AnalyticsResponse` - Standardized response format
- `ReportModels.cs` - Report management DTOs
  - `SavedReport` - Persisted report configuration
  - `ReportConfiguration` - Report settings and filters

**Analytics/Semantic/** - Business Metadata Layer
- `DatasetDefinition.cs` - Dataset schema definition
  - Defines available measures, dimensions, and filters
  - Maps user-friendly names to Cube.js technical names
  - Security and validation rules

**Analytics/Semantic/Definitions/Shared/** - Reusable field definitions
- `EventMeasures.cs` - Event-level KPIs (count, cycle time, rates)
- `EventDimensions.cs` - Event attributes (number, name, type, dates, creator)
- `EventFilters.cs` - Event filter definitions
- `ItemMeasures.cs` - Line item KPIs (quantities, prices, counts)
- `ItemDimensions.cs` - Item attributes (material, description, quantities)
- `ItemFilters.cs` - Item filter definitions
- `SupplierMeasures.cs` - Supplier metrics (counts, participation rates)
- `SupplierDimensions.cs` - Supplier attributes (name, contact, status)
- `SupplierFilters.cs` - Supplier filter definitions

**Analytics/Semantic/Builders/** - Dataset composition
- `IDatasetBuilder.cs` - Dataset builder interface
- `EventDatasetBuilder.cs` - Builds "events" dataset (RFQ/RFI unified view)
- `ItemDatasetBuilder.cs` - Builds "items" dataset (RFQ line items)
- `SupplierDatasetBuilder.cs` - Builds "suppliers" dataset (supplier participation)

**Analytics/Translation/** - Query translation layer
- `DatasetRegistry.cs` - Central registry of all available datasets
- `AnalyticsQueryBuilder.cs` - Converts UI queries to Cube.js queries
  - Translates user-friendly field names to Cube member paths
  - Handles filter group logic (AND/OR combinations)
  - Applies security and validation rules

**Analytics/Translation/Strategies/** - Translation patterns
- `ITranslationStrategy.cs` - Translation strategy interface
- `BaseTranslationStrategy.cs` - Common translation logic
- `EventTranslationStrategy.cs` - Event dataset translation (EventsView cube)
- `ItemTranslationStrategy.cs` - Item dataset translation (MaterialRfqDocumentItem cube)
- `SupplierTranslationStrategy.cs` - Supplier dataset translation (RequestForToSupplier cubes)

**Analytics/Validation/** - Query validation
- `AnalyticsQueryValidator.cs` - Validates queries against dataset schemas
  - Ensures only allowed fields are queried
  - Validates filter operators
  - Enforces date range limits
  - Prevents unauthorized data access

#### **Data/** - Database Context
- `ReportingDbContext.cs` - Entity Framework Core DbContext for saved reports

#### **Properties/** - Application Configuration
- `launchSettings.json` - Development launch profiles

### 📂 Frontend (`frontend/`)

React + TypeScript application with real-time analytics query builder.

#### **src/components/** - React Components
- `QueryEditor.tsx` - Main query builder interface
  - Dataset selector
  - KPI (measure) multi-select
  - Dimension multi-select with dynamic filtering
  - Advanced filter builder with OR support
- `AdvancedFilters.tsx` - Complex filter UI
  - Filter groups with AND/OR logic
  - Dynamic operator selection based on field type
  - Value input based on filter type (text, date, number, boolean)
- `QueryResult.tsx` - Results table display
  - Paginated data grid
  - Sortable columns
  - Responsive layout
- `AnalyticsChart.tsx` - Data visualization
  - Chart rendering for metrics
  - Support for different chart types
- `MultiSelect.tsx` - Reusable multi-select component
  - Search/filter options
  - Select all/clear functionality
  - Keyboard navigation

#### **src/hooks/** - React Hooks
- `useAnalyticsQuery.ts` - Analytics query execution hook
  - Manages query state (loading, error, data)
  - Handles API calls to backend
  - Debouncing and caching
- `useDatasetSchema.ts` - Dataset schema fetching hook
  - Loads available measures, dimensions, filters for selected dataset
  - Caches schema data

#### **src/api/** - API Client
- `analyticsClient.ts` - HTTP client for backend API
  - Typed API methods
  - Error handling
  - Request/response transformation

#### **src/types/** - TypeScript Type Definitions
- `analytics.ts` - Core analytics types
  - `AnalyticsQuery` - Query structure
  - `Filter`, `FilterGroup` - Filter types
  - `AnalyticsResponse` - Response structure
  - `DatasetSchema` - Schema metadata

#### **src/styles/** - Styling
- `MultiSelect.css` - MultiSelect component styles

### 📂 Cube.js Schema (`model/`)

Cube.js data models that define how to query the underlying databases via Foreign Data Wrappers.

#### **model/unified/** - Unified Views
- `EventsView.js` - Combined RFQ + RFI view
  - UNION query merging `material_rfq` and `request_for_information`
  - Standardized columns across both event types
  - Supplier participation metrics
  - Financial metrics (RFQ only)
  - Cycle time calculations

#### **model/shared/** - Shared Dimensions
- `User.js` - User data from `buyer_d_fdw_user_service.user`

#### **model/sourcing/common/** - Common Sourcing Entities
- `Order.js` - Purchase orders from `buyer_d_fdw_order_service.order`
- `Quotation.js` - Supplier quotations from `buyer_d_fdw_rfq_service.quotation`
- `StateQuotation.js` - Quotation states from `buyer_d_fdw_rfq_service.state_quotation`

#### **model/sourcing/rfi/** - RFI (Request for Information)
- `RequestForInformation.js` - Main RFI events from `buyer_d_fdw_rfq_service.request_for_information`
- `RequestForToSupplierRfi.js` - RFI supplier invitations
- `StateRequestForInformation.js` - RFI states
- `StateRequestForToSupplierRfi.js` - RFI supplier states

#### **model/sourcing/rfq/** - RFQ (Request for Quotation)
- `MaterialRfq.js` - Main RFQ events from `buyer_d_fdw_rfq_service.material_rfq`
- `MaterialRfqDocumentItem.js` - RFQ line items from `buyer_d_fdw_rfq_service.material_rfq_document_item`
- `RequestForToSupplierMaterialRfq.js` - RFQ supplier invitations
- `StateMaterialRfq.js` - RFQ states
- `StateRequestForToSupplierMaterialRfq.js` - RFQ supplier states

### 📂 Documentation

- `README.md` - This file
- `ARCHITECTURE_DOCUMENTATION.md` - Detailed architecture documentation
- `RATE-CALCULATION-GUIDE.md` - Rate calculation formulas and business logic
- `example-queries/` - Sample JSON queries for testing
  - `event-kpi-summary.json` - Event summary with KPIs
  - `complex-filter-combination.json` - Advanced filter examples
  - `or-filter-example.json` - OR logic filter examples
  - `organization-filters-example.json` - Organization filtering
  - And more...

### 📂 Configuration

- `docker-compose.yml` - Docker setup for Cube.js server
- `.env.example` - Environment variable template
- `appsettings.json` - .NET application configuration
- `appsettings.Development.json` - Development-specific settings

## Data Flow Architecture

### 1. User Query Flow

```
User selects in UI:
  - Dataset: "events"
  - KPIs: ["event_count", "cycle_time_days"]
  - Dimensions: ["event_number", "event_name", "event_type"]
  - Filters: [{ field: "event_type", operator: "equals", value: "RFQ" }]
    │
    ▼
POST /api/analytics/query
{
  "datasetId": "events",
  "kpis": ["event_count", "cycle_time_days"],
  "groupBy": ["event_number", "event_name", "event_type"],
  "filters": [{ "field": "event_type", "operator": "equals", "value": "RFQ" }]
}
    │
    ▼
AnalyticsController.Query()
    │
    ├─ Resolve dataset from DatasetRegistry
    ├─ Validate query using AnalyticsQueryValidator
    │  └─ Check fields exist, operators allowed, security rules
    │
    ▼
AnalyticsQueryBuilder.BuildCubeQuery()
    │
    ├─ Get translation strategy (EventTranslationStrategy)
    ├─ Translate user-friendly names to Cube.js members
    │  - "event_count" → "EventsView.count"
    │  - "event_number" → "EventsView.eventNumber"
    │  - "event_type" filter → Cube.js filter format
    │
    ▼
CubeService.QueryAsync()
    │
    ├─ Build Cube.js HTTP request
    │  {
    │    "measures": ["EventsView.count"],
    │    "dimensions": ["EventsView.eventNumber", "EventsView.eventName", "EventsView.eventType"],
    │    "filters": [{ "member": "EventsView.eventType", "operator": "equals", "values": ["RFQ"] }]
    │  }
    │
    ▼
POST http://localhost:4000/cubejs-api/v1/load
    │
    ▼
Cube.js Server
    │
    ├─ Load EventsView.js schema
    ├─ Generate SQL from schema definition
    │  SELECT 
    │    event_number, event_name, event_type, COUNT(*) as count
    │  FROM (
    │    SELECT ... FROM buyer_d_fdw_rfq_service.material_rfq WHERE ...
    │    UNION ALL
    │    SELECT ... FROM buyer_d_fdw_rfq_service.request_for_information WHERE ...
    │  ) AS EventsView
    │  WHERE event_type = 'RFQ'
    │  GROUP BY event_number, event_name, event_type
    │
    ▼
SQL Server Database (via Foreign Data Wrappers)
    │
    ├─ Query buyer_d_fdw_rfq_service (connects to RFQ microservice DB)
    ├─ Query buyer_d_fdw_order_service (connects to Order microservice DB)
    ├─ Query buyer_d_fdw_user_service (connects to User microservice DB)
    │
    ▼
Cube.js Server
    │
    ├─ Transform results to JSON
    ├─ Apply post-aggregations
    ├─ Return formatted response
    │
    ▼
CubeService
    │
    ├─ Parse Cube.js response
    ├─ Map to AnalyticsResponse model
    │
    ▼
AnalyticsController
    │
    ├─ Return JSON to frontend
    │
    ▼
Frontend (useAnalyticsQuery hook)
    │
    ├─ Update component state
    ├─ Render results in QueryResult component
    └─ Display charts in AnalyticsChart component
```

### 2. Dataset Schema Discovery Flow

```
User selects dataset "events"
    │
    ▼
GET /api/analytics/datasets/events/schema
    │
    ▼
AnalyticsController.GetDatasetSchema()
    │
    ├─ Resolve dataset from DatasetRegistry
    ├─ Return DatasetDefinition
    │  {
    │    "measures": { "event_count": {...}, "cycle_time_days": {...} },
    │    "dimensions": { "event_number": {...}, "event_name": {...} },
    │    "filters": { "event_type": {...}, "created_at": {...} }
    │  }
    │
    ▼
Frontend (useDatasetSchema hook)
    │
    ├─ Populate KPI selector with available measures
    ├─ Populate dimension selector with available dimensions
    ├─ Build filter UI with allowed filters and operators
    └─ Enable/disable fields based on event type (dynamic filtering)
```

### 3. Filter Translation Examples

**Simple Filter:**
```
UI Filter: { field: "event_type", operator: "equals", value: "RFQ" }
    ↓
Cube Filter: { member: "EventsView.eventType", operator: "equals", values: ["RFQ"] }
```

**OR Filter Group:**
```
UI FilterGroup: {
  logic: "OR",
  filters: [
    { field: "event_type", operator: "equals", value: "RFQ" },
    { field: "event_type", operator: "equals", value: "RFI" }
  ]
}
    ↓
Cube Filter: {
  or: [
    { member: "EventsView.eventType", operator: "equals", values: ["RFQ"] },
    { member: "EventsView.eventType", operator: "equals", values: ["RFI"] }
  ]
}
```

**Date Range Filter:**
```
UI Filter: { field: "created_at", operator: "inDateRange", value: ["2024-01-01", "2024-12-31"] }
    ↓
Cube TimeDimension: {
  dimension: "EventsView.createdAt",
  dateRange: ["2024-01-01", "2024-12-31"]
}
```

## Foreign Data Wrapper Schema Mapping

The system uses SQL Server Foreign Data Wrappers to access data from multiple microservices:

| Service | Schema | Tables |
|---------|--------|--------|
| **User Service** | `buyer_d_fdw_user_service` | `user` |
| **Order Service** | `buyer_d_fdw_order_service` | `order` |
| **RFQ Service** | `buyer_d_fdw_rfq_service` | `material_rfq`<br>`material_rfq_document_item`<br>`request_for_information`<br>`request_for_to_supplier_material_rfq`<br>`request_for_to_supplier_request_for_information`<br>`quotation`<br>`quotation_document_item`<br>`state_*` tables |

All Cube.js schemas reference these FDW schemas to query data across microservices transparently.

## Key Design Patterns

### 1. Semantic Layer Pattern
The backend provides a **semantic layer** that translates business-friendly terms to technical database fields:
- **User sees**: "Event Count", "Cycle Time Days", "Created At"
- **Database has**: `COUNT(*)`, `DATEDIFF(...)`, `created_at`
- **Benefit**: Business users don't need SQL knowledge

### 2. Strategy Pattern (Translation)
Different datasets use different translation strategies:
- `EventTranslationStrategy` → Maps to `EventsView` cube
- `ItemTranslationStrategy` → Maps to `MaterialRfqDocumentItem` cube
- `SupplierTranslationStrategy` → Maps to supplier cubes

### 3. Builder Pattern (Dataset Construction)
Datasets are composed from reusable building blocks:
- `EventDatasetBuilder` combines `EventMeasures` + `EventDimensions` + `EventFilters`
- Promotes DRY (Don't Repeat Yourself)
- Easy to add new datasets

### 4. Validator Pattern
`AnalyticsQueryValidator` ensures:
- Only allowed fields are queried
- Correct operators are used
- Security policies are enforced (e.g., max date ranges)
- Prevents SQL injection through whitelist validation

### 5. Unified View Pattern (Cube.js)
`EventsView` merges RFQ and RFI data with a UNION query:
- Standardized column names across event types
- NULL for fields that don't exist in one type
- Single query interface for heterogeneous data

## Setup & Running

### Prerequisites
- .NET 8 SDK
- Node.js 18+
- Docker (for Cube.js)
- SQL Server with Foreign Data Wrappers configured

### 1. Start Cube.js Server
```bash
docker-compose up -d
```

### 2. Install Frontend Dependencies
```bash
cd frontend
npm install
```

### 3. Run Backend API
```bash
cd ReportingWithCube
dotnet run
```
Backend runs on `https://localhost:5001`

### 4. Run Frontend Dev Server
```bash
cd frontend
npm run dev
```
Frontend runs on `http://localhost:5173`

### 5. Build for Production
```bash
# Backend
cd ReportingWithCube
dotnet publish -c Release

# Frontend
cd frontend
npm run build
```

## Environment Configuration

### Backend (`appsettings.json`)
```json
{
  "CubeJs": {
    "ApiUrl": "http://localhost:4000",
    "ApiSecret": "your-cube-secret"
  },
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=ReportingDb;..."
  }
}
```

### Cube.js (`.env`)
```env
CUBEJS_DB_TYPE=mssql
CUBEJS_DB_HOST=your-sql-server
CUBEJS_DB_NAME=your-database
CUBEJS_DB_USER=your-user
CUBEJS_DB_PASS=your-password
CUBEJS_API_SECRET=your-secret
```

## API Documentation

### Analytics Endpoints

#### POST /api/analytics/query
Execute an analytics query.

**Request:**
```json
{
  "datasetId": "events",
  "kpis": ["event_count", "cycle_time_days"],
  "groupBy": ["event_number", "event_name", "event_type"],
  "filters": [{ "field": "event_type", "operator": "equals", "value": "RFQ" }],
  "sort": { "by": "created_at", "direction": "desc" },
  "page": { "limit": 100, "offset": 0 }
}
```

**Response:**
```json
{
  "data": [{ "event_number": "RFQ-2024-001", ... }],
  "metadata": { "columns": [...], "total": 1 }
}
```

#### GET /api/analytics/datasets
List all available datasets.

#### GET /api/analytics/datasets/{id}/schema
Get dataset schema (measures, dimensions, filters).

### Report Management Endpoints

#### POST /api/reports - Save report configuration
#### GET /api/reports - List saved reports
#### DELETE /api/reports/{id} - Delete saved report

## Contributing

When adding new fields:
1. Define in Semantic Layer (`Analytics/Semantic/Definitions/Shared/`)
2. Update Dataset Builder (`Analytics/Semantic/Builders/`)
3. Update Cube.js Schema (`model/`)
4. Update Translation Strategy (`Analytics/Translation/Strategies/`)
5. Test with example queries