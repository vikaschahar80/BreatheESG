# Decisions

## Ambiguities Resolved & Subsets of Reality Handled

### 1. SAP Data (Fuel & Procurement)
*   **Subset Handled:** We are handling ALV Grid CSV exports for Material Consumption (Scope 1 stationary/mobile combustion).
*   **Decisions Made:**
    *   I assumed the export uses German technical headers (`MATNR` for Material, `MENGE` for Quantity, `MEINS` for Unit, `BUDAT` for Posting Date, `WERKS` for Plant).
    *   I assumed the file might use a semicolon (`;`) delimiter, which is extremely common in SAP systems where the comma is used as a decimal separator (e.g., European configurations).
    *   *Ambiguity:* How to map `MATNR` to fuel types? *Resolution:* I implemented a static lookup table in the backend for the prototype. In a real deployment, we would need a mapping UI.

### 2. Utility Data (Electricity)
*   **Subset Handled:** Monthly billing summary CSVs exported from utility portals (similar to PG&E's "Green Button" export).
*   **Decisions Made:**
    *   I explicitly chose *not* to handle 15-minute interval data. While interval data exists, monthly summary totals (`Service Start Date`, `Service End Date`, `Usage`, `Usage Units`) are the realistic standard for basic corporate GHG accounting.
    *   *Ambiguity:* Overlapping billing periods. *Resolution:* The data model stores the exact `date_start` and `date_end`. The backend does not attempt to split usage across calendar months during ingestion; it preserves the billing period reality for the analyst to review.

### 3. Corporate Travel (Navan)
*   **Subset Handled:** A simulated API pull of Booking Data (Flights).
*   **Decisions Made:**
    *   Since distances aren't always provided by travel APIs reliably, the parser is designed to extract the `Origin Airport` and `Destination Airport`.
    *   *Ambiguity:* Navan provides both Transaction data (spend) and Booking data (itinerary). *Resolution:* I chose to sync Booking data because it contains the physical activity data (airports, cabin class) needed for accurate Scope 3 Category 6 emissions.

## General Design Decisions
*   **Don't Drop Data:** If a row is malformed (e.g., missing a unit), the parser still creates an `ActivityRecord`, but flags it with `validation_issues` and sets the status to `PENDING_REVIEW`. This allows the analyst to see the failure in the UI rather than wondering why rows disappeared.

## Questions for the PM
1.  For SAP, do we eventually want a self-serve mapping UI where clients map their own `MATNR` codes to our standard fuel types, or does our implementation team do that?
2.  In the Review Dashboard, do analysts prefer to review data grouped by `IngestionRun` (i.e., "Review this specific SAP file upload") or grouped by Category (i.e., "Review all pending Scope 1 Fuel data across all sources")? The current design leans towards grouping by IngestionRun.
