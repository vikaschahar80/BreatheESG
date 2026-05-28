# Data Model Architecture

The data model for Breathe ESG's data ingestion prototype is designed to handle multiple tenants, raw data retention (for auditability), validation state tracking, and normalized metric mapping.

## Core Entities

### 1. `Tenant`
Represents the client company. Essential for a multi-tenant architecture to ensure data isolation.
- `id`: UUID
- `name`: String
- `created_at`: DateTime

### 2. `DataSource`
Defines the distinct systems we ingest from (e.g., SAP, Utility Portal, Corporate Travel). This allows us to track source-specific configurations and parsing rules.
- `id`: UUID
- `name`: String
- `source_type`: Choice (SAP_ALV, PGE_GREEN_BUTTON, NAVAN_API)

### 3. `IngestionRun`
An audit entity representing a single batch sync or file upload. Whenever a user uploads a file or clicks "Sync API", an `IngestionRun` is created.
- `id`: UUID
- `tenant_id`: FK to Tenant
- `data_source_id`: FK to DataSource
- `status`: Choice (IN_PROGRESS, COMPLETED, FAILED)
- `uploaded_by`: String / User ID (Source of truth tracking: *who* and *when*)
- `created_at`: DateTime

### 4. `ActivityRecord`
This is the core normalized row. Rather than mutating data during approval, we store the raw JSON and map what we can to our normalized fields. If there are mapping gaps, they are captured in `validation_issues`.
- `id`: UUID
- `tenant_id`: FK to Tenant
- `ingestion_run_id`: FK to IngestionRun
- `scope`: Choice (SCOPE_1, SCOPE_2, SCOPE_3)
- `category`: Choice (STATIONARY_COMBUSTION, MOBILE_COMBUSTION, PURCHASED_ELECTRICITY, BUSINESS_TRAVEL)
- `source_of_truth_id`: String (e.g., Navan `tripUuid`, SAP `MATNR` + row num, Utility Account #). Tracks *which* source produced this row.
- `raw_data`: JSON. The exact payload received from the source. Critical for audit trails. If the source data changes, we can re-parse it without losing fidelity.
- `date_start`: Date (Handles billing periods or travel start dates)
- `date_end`: Date
- `quantity`: Decimal (The normalized quantity)
- `unit`: String (The normalized unit, e.g., 'kWh', 'Liters', 'km')
- `emission_factor_hint`: String (Used by downstream calculators, e.g., 'Diesel', 'PG&E', 'Air Travel - Short Haul')
- `status`: Choice (PENDING_REVIEW, APPROVED, REJECTED, LOCKED_FOR_AUDIT)
- `validation_issues`: JSON Array. (e.g., `["Unit 'GAL' not recognized", "Unknown MATNR '10023'"]`). Drives the analyst UI.
- `created_at`, `updated_at`: DateTime

## Justification against Requirements

*   **Multi-tenancy:** Handled inherently by `Tenant` and propagating `tenant_id` to `IngestionRun` and `ActivityRecord`. Database queries always filter by `tenant_id`.
*   **Scope 1/2/3 Categorization:** The parser maps raw data to `scope` and `category` fields based on the `DataSource` (e.g., SAP Fuel = Scope 1, Utility = Scope 2, Navan = Scope 3).
*   **Source-of-truth tracking:** We store the `IngestionRun` (who, when), the `DataSource` (which system), the `source_of_truth_id` (the ID inside that system), and the immutable `raw_data` JSON.
*   **Unit Normalization:** The parser attempts to map source units (e.g., SAP's 'L' or Navan's missing distances) to a normalized `quantity` and `unit`. Failure to map results in a `validation_issue`.
*   **Audit Trail:** The `status` field explicitly has a `LOCKED_FOR_AUDIT` state. Once locked, records are immutable. `raw_data` ensures auditors can always see what the original system provided.
