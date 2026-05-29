# Decisions

## SAP (Fuel & Procurement)
- **Subset Handled:** ALV Grid CSV exports for fuel consumption.
- **Ambiguity:** SAP column headers are often in German (`MATNR` for Material) and use semicolons instead of commas.
- **Decision:** Built a parser that handles semicolon-separated values and maps the German column names. Created a hardcoded list to map SAP material IDs to actual fuel types for this prototype.

## Utility Data (Electricity)
- **Subset Handled:** Monthly billing CSV exports (like PG&E Green Button).
- **Ambiguity:** Billing periods rarely match calendar months (e.g., Jan 15 - Feb 14).
- **Decision:** I did not try to split or guess daily usage. The database stores the exact start and end dates from the bill, preserving reality.

## Corporate Travel (Navan)
- **Subset Handled:** Flight booking API data.
- **Ambiguity:** APIs often don't provide exact flight distances, just airport codes.
- **Decision:** The parser extracts the Origin and Destination airport codes instead of expecting distances. In a real system, a separate service would calculate distance based on these codes.
