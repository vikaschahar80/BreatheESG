# Sources

## 1. SAP 
- **Format Researched:** ALV Grid CSV export.
- **What I Learned:** Columns are often in German (`MATNR`, `MENGE`). Because European numbers use commas for decimals, the CSV usually uses semicolons (`;`) to separate columns.
- **Sample Data:** 
  `MATNR;MENGE;MEINS;WERKS;BUDAT`
  `000000000000010023;500,00;L;1000;15.01.2023`
- **What breaks in reality:** Excel might strip the leading zeros from the material number before the user uploads it, breaking the mapping.

## 2. Utility Bills
- **Format Researched:** PG&E "Green Button" CSV export.
- **What I Learned:** Contains start dates, end dates, usage, and cost. Billing periods overlap calendar months.
- **Sample Data:**
  `Account Number,Service Start Date,Service End Date,Usage,Usage Units,Cost`
  `12345,2023-01-12,2023-02-10,1450.5,kWh,320.45`
- **What breaks in reality:** Some utility CSVs put 5 lines of random text at the very top of the file before the actual column headers. A simple parser will crash on this.

## 3. Corporate Travel (Navan)
- **Format Researched:** Navan Booking API JSON response.
- **What I Learned:** Flight distance is often missing. The most reliable data points are the airport codes and cabin class.
- **Sample Data:**
  `{"tripUuid": "uuid-123", "origin": "SFO", "destination": "JFK", "cabinClass": "Economy"}`
- **What breaks in reality:** An API pagination change, or a client using a different tool (like Concur) that only provides dollar amounts instead of airport codes.
