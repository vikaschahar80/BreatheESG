# Data Model

The data model ingests and tracks data for multiple clients while keeping an audit trail. 

## Entities

- **Tenant:** Represents a client. Every piece of data is linked to a `tenant_id` to keep client data separate (Multi-tenancy).
- **DataSource:** Tracks where the data came from (e.g., SAP, Utility Portal, Navan).
- **IngestionRun:** Tracks who uploaded data, from which source, and when. 
- **ActivityRecord:** The main data row. We store exactly what was uploaded, plus our normalized version of it.
  - `raw_data`: The exact original data. Never changed. (Audit trail).
  - `source_of_truth_id`: The ID from the original system (e.g., SAP row number, Navan Trip UUID).
  - `scope` & `category`: Mapped based on the source (e.g., SAP = Scope 1, Navan = Scope 3).
  - `quantity` & `unit`: The clean, normalized numbers we extracted (Unit normalization).
  - `status`: Tracks if an analyst has approved it. Can be locked for audit.
  - `validation_issues`: Lists any problems found during upload (like missing units or unknown materials) so the analyst can fix them.

## Why this works
We never delete or overwrite the `raw_data`. If the analyst or auditor needs to know where a number came from, they can see the exact file and row that produced it, who uploaded it, and what the original values were.
