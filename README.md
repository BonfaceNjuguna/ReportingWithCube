# RFQ Reporting System - Backend

## Architecture Overview

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│             │         │             │         │             │         │             │
│  Frontend   │────────▶│  .NET API   │────────▶│  Cube.js    │────────▶│  Database   │
│   (React)   │  HTTP   │ Controllers │  HTTP   │   Server    │   SQL   │ (SQL Server)│
│             │◀────────│             │◀────────│             │◀────────│             │
└─────────────┘  JSON   └─────────────┘  JSON   └─────────────┘  Data   └─────────────┘
```

## Flow Diagram: UI → API → Cube → DB

### 1. User Request Flow

```
User Action (UI)
    │
    ├─ Select Filters (Event Type, Creator, Date Range)
    ├─ Choose Columns (RFQ No, Name, Dates, etc.)
    ├─ Request KPIs & Charts
    │
    ▼
POST /api/reports/generate
{
  "filters": {
    "eventType": "RFQ",
    "creatorId": "USER123",
    "startDate": "2024-01-01",
    "endDate": "2024-01-31"
  },
  "columns": {
    "rfqNo": true,
    "rfqName": true,
    "createdAt": true,
    ...
  },
  "includeKpis": true,
  "includeCharts": true
}
    │
    ▼
ReportsController receives request
    │
    ▼
ReportService.GenerateReportAsync()
    │
    ├─ Build Cube.js Query from Filters/Columns
    │  {
    │    "dimensions": ["RfqEvents.rfqNo", "RfqEvents.rfqName", ...],
    │    "measures": ["RfqEvents.count", "RfqEvents.avgQuotationRate", ...],
    │    "timeDimensions": [{"dimension": "RfqEvents.createdAt", "dateRange": [...]}],
    │    "filters": [{"member": "RfqEvents.creatorId", "operator": "equals", ...}]
    │  }
    │
    ▼
CubeService.ExecuteQueryAsync()
    │
    ├─ Send HTTP POST to Cube.js Server
    │  POST http://localhost:4000/cubejs-api/v1/load
    │
    ▼
Cube.js Server
    │
    ├─ Parse Query
    ├─ Use Schema Definition (RfqEvents.js)
    ├─ Generate SQL Query
    │  SELECT 
    │    RfqNo, RfqName, CreatedAt, Status,
    │    NumberOfInvitedSuppliers, NumberOfOfferedSuppliers,
    │    CASE WHEN NumberOfInvitedSuppliers > 0 
    │         THEN (CAST(NumberOfOfferedSuppliers AS FLOAT) / NumberOfInvitedSuppliers) * 100 
    │    END as QuotationRate
    │  FROM RfqEvents
    │  WHERE CreatorId = 'USER123' 
    │    AND CreatedAt BETWEEN '2024-01-01' AND '2024-01-31'
    │
    ▼
SQL Server Database
    │
    ├─ Execute Query
    ├─ Return Result Set
    │
    ▼
Cube.js Server
    │
    ├─ Transform to JSON
    ├─ Apply Aggregations
    ├─ Return Response
    │
    ▼
CubeService
    │
    ├─ Parse Cube.js Response
    │
    ▼
ReportService
    │
    ├─ Transform to ReportResponseDto
    ├─ Generate KPIs (if requested)
    │   └─ Execute additional Cube queries for aggregates
    ├─ Generate Charts (if requested)
    │   └─ Execute query for Quotation Rate by Creator
    │
    ▼
ReportsController
    │
    ├─ Return JSON Response
    │
    ▼
Frontend (React)
    │
    ├─ Display Data Table
    ├─ Render KPI Cards
    ├─ Render Charts (Bar Chart: Quotation Rate by Creator)
    └─ Enable Drill-down on Rows
```

### 2. Drill-Down Flow

```
User clicks on RFQ Row
    │
    ▼
GET /api/reports/events/{eventId}/drilldown
    │
    ▼
ReportService.GetEventDrillDownAsync()
    │
    ├─ Query Event Details from Cube
    ├─ Query Supplier Breakdown from Cube
    │   {
    │     "dimensions": ["RfqSuppliers.supplierName", "RfqSuppliers.status", ...],
    │     "filters": [{"member": "RfqSuppliers.rfqEventId", "operator": "equals", ...}]
    │   }
    │
    ▼
Return detailed event + supplier list
    │
    ▼
Frontend displays Supplier Breakdown Modal/Panel
```

### 3. Save Report Flow

```
User saves report configuration
    │
    ▼
POST /api/reports/save
{
  "name": "RFQ Jan by MÖCHEL",
  "userId": "USER123",
  "filters": {...},
  "columns": {...}
}
    │
    ▼
ReportService.SaveReportAsync()
    │
    ├─ Serialize filters/columns to JSON
    ├─ Store in SavedReports table (SQL Server)
    │
    ▼
Return saved report with ID
    │
    ▼
Frontend shows "Report Saved" confirmation
```

### 4. Run Saved Report Flow

```
User opens saved report
    │
    ▼
GET /api/reports/saved?userId=USER123
    │
    ▼
Display list of saved reports
    │
    ▼
User clicks "Run" on saved report
    │
    ▼
POST /api/reports/saved/{reportId}/run
    │
    ├─ Load saved configuration from database
    ├─ Execute with LIVE DATA (re-runs entire flow)
    │
    ▼
Return fresh report with current data
```

### 5. Export to Excel Flow

```
User clicks "Export to Excel"
    │
    ▼
POST /api/export/excel
{
  "filters": {...},
  "columns": {...}
}
    │
    ▼
ExportController.ExportToExcel()
    │
    ├─ Generate report data (same as report generation)
    ├─ Convert to CSV/Excel format
    │
    ▼
Return file download
```

## Database Schema

### RfqEvents Table
```sql
CREATE TABLE RfqEvents (
    Id UNIQUEIDENTIFIER PRIMARY KEY,
    RfqNo NVARCHAR(50) NOT NULL UNIQUE,
    RfqName NVARCHAR(200) NOT NULL,
    CreatedAt DATETIME2 NOT NULL,
    SubmissionDeadline DATETIME2 NOT NULL,
    Status NVARCHAR(50),
    CreatorId NVARCHAR(100),
    CreatorName NVARCHAR(200),
    NumberOfInvitedSuppliers INT,
    NumberOfOfferedSuppliers INT,
    QuotationTotal DECIMAL(18,2)
)
```

### RfqSuppliers Table
```sql
CREATE TABLE RfqSuppliers (
    Id UNIQUEIDENTIFIER PRIMARY KEY,
    RfqEventId UNIQUEIDENTIFIER NOT NULL,
    SupplierId NVARCHAR(100) NOT NULL,
    SupplierName NVARCHAR(200) NOT NULL,
    IsInvited BIT,
    HasSubmitted BIT,
    SubmittedAt DATETIME2,
    QuotationAmount DECIMAL(18,2),
    Status NVARCHAR(50),
    FOREIGN KEY (RfqEventId) REFERENCES RfqEvents(Id)
)
```

### SavedReports Table
```sql
CREATE TABLE SavedReports (
    Id UNIQUEIDENTIFIER PRIMARY KEY,
    Name NVARCHAR(200) NOT NULL,
    UserId NVARCHAR(100) NOT NULL,
    ReportType NVARCHAR(50),
    FilterJson NVARCHAR(MAX),
    ColumnsJson NVARCHAR(MAX),
    ChartConfigJson NVARCHAR(MAX),
    CreatedAt DATETIME2,
    UpdatedAt DATETIME2
)
```

## Cube.js Schema Definition

The Cube.js schema defines how data is queried and aggregated. Key files:
- `cube-schema/RfqEvents.js` - Main RFQ event cube with measures and dimensions
- `cube-schema/RfqSuppliers.js` - Supplier participation cube

### Key Measures (KPIs)
- `RfqEvents.avgQuotationRate` - Average % of suppliers who submitted quotes
- `RfqEvents.avgCycleTime` - Average days between creation and deadline
- `RfqEvents.totalQuotation` - Sum of all quotation values
- `RfqEvents.count` - Total number of RFQs

### Key Dimensions (Columns)
- `RfqEvents.rfqNo`, `rfqName`, `status`
- `RfqEvents.createdAt`, `submissionDeadline`
- `RfqEvents.creatorName`
- `RfqEvents.quotationRate` (calculated per event)

## API Endpoints

### Report Generation
- `POST /api/reports/generate` - Generate report with filters
- `GET /api/reports/events/{eventId}/drilldown` - Get event details with suppliers

### Saved Reports
- `POST /api/reports/save` - Save report configuration
- `GET /api/reports/saved?userId={userId}` - List saved reports
- `GET /api/reports/saved/{reportId}` - Get specific saved report
- `POST /api/reports/saved/{reportId}/run` - Run saved report with live data
- `DELETE /api/reports/saved/{reportId}` - Delete saved report

### Export
- `POST /api/export/excel` - Export report to Excel/CSV

## Setup Instructions

### 1. Install Dependencies
```powershell
cd ReportingWithCube
dotnet restore
```

### 2. Configure Database Connection
Edit `appsettings.json`:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=ReportingDb;Trusted_Connection=True;"
  }
}
```

### 3. Create Database Migration
```powershell
dotnet ef migrations add InitialCreate
dotnet ef database update
```

### 4. Configure Cube.js
Edit `appsettings.json`:
```json
{
  "Cube": {
    "ApiUrl": "http://localhost:4000",
    "ApiToken": "your-token-here"
  }
}
```

### 5. Setup Cube.js Server
```bash
# In a separate directory for Cube.js
npx cubejs-cli create reporting-cube -d postgres
cd reporting-cube

# Copy schema files from cube-schema/ folder
cp ../ReportingWithCube/cube-schema/*.js schema/

# Configure .env
CUBEJS_DB_TYPE=mssql
CUBEJS_DB_HOST=localhost
CUBEJS_DB_NAME=ReportingDb
CUBEJS_DB_USER=sa
CUBEJS_DB_PASS=your-password

# Start Cube.js
npm run dev
```

### 6. Run the Application
```powershell
cd ReportingWithCube
dotnet run
```

## Next Steps

1. **Add Authentication** - Integrate with your auth system
2. **Add Excel Library** - Install EPPlus or ClosedXML for proper Excel export
3. **Add More Filters** - Status, RFQ numbers, custom date ranges
4. **Add More Charts** - Cycle time trends, supplier participation rates
5. **Add Caching** - Implement Redis for frequently accessed reports
6. **Add Real-time Updates** - Use SignalR for live report updates

## Example Usage

### Frontend React Code Example
```typescript
// Generate Report
const response = await fetch('/api/reports/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    filters: {
      creatorId: 'USER123',
      startDate: '2024-01-01',
      endDate: '2024-01-31'
    },
    columns: {
      rfqNo: true,
      rfqName: true,
      createdAt: true,
      submissionDeadline: true,
      status: true,
      numberOfInvitedSuppliers: true,
      numberOfOfferedSuppliers: true,
      quotationTotal: true
    },
    includeKpis: true,
    includeCharts: true
  })
});

const report = await response.json();
// report.data - table rows
// report.kpis - KPI metrics
// report.charts - chart data
```
