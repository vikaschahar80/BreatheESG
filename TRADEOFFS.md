# Tradeoffs

Here are three things deliberately not built in this prototype and why:

### 1. No Dynamic SAP Material Number (MATNR) Mapping UI
**What wasn't built:** A frontend interface for analysts or clients to map custom SAP material numbers (e.g., "100452") to standard ESG fuel types (e.g., "Diesel").
**Why:** Time constraints. Building a robust mapping UI requires complex state management and database schema support for tenant-specific mapping rules. For the 4-day prototype, a hardcoded backend dictionary mapping a few sample `MATNR` codes to fuel types demonstrates the normalization logic sufficiently without getting bogged down in CRUD screens for mappings.

### 2. No Live API Integration for Navan
**What wasn't built:** Actual OAuth flows and live HTTP requests to the Navan API.
**Why:** We do not have partner API keys or a sandbox environment for Navan. To demonstrate the ingestion mechanism realistically, I built a "Sync from Navan" button that triggers a backend task. This task parses a statically hosted JSON payload that strictly mimics the documented Navan Reporting API shape. This proves the architecture can handle API-based ingestion (fetching, parsing, transforming to our model) without requiring actual credentials.

### 3. Not Handling 15-Minute Interval Utility Data
**What wasn't built:** Time-series ingestion and aggregation of 15-minute or hourly smart meter data.
**Why:** While utilities (like PG&E) offer interval data, it requires a fundamentally different data architecture (e.g., TimescaleDB or InfluxDB) and visualization approach. For standard corporate GHG reporting, monthly billing totals are the typical source of truth. Building interval data ingestion would overcomplicate the data model (`ActivityRecord`) and distract from the core goal of providing an analyst review workflow for standard invoices.
