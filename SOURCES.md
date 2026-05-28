# Sources

## 1. SAP (Fuel & Procurement)
**Research:** Looked into SAP's ALV (ABAP List Viewer) Grid exports. When users export reports to a local file, it's often a CSV.
**What I Learned:** 
- The columns are typically German technical names: `MATNR` (Material Number), `MENGE` (Quantity), `MEINS` (Base Unit of Measure), `WERKS` (Plant), `BUDAT` (Posting Date).
- Because many SAP configurations use a comma for decimals (e.g., `1.000,50`), the CSV delimiter is often a semicolon (`;`).
**Sample Data Look:** 
```csv
MATNR;MENGE;MEINS;WERKS;BUDAT
000000000000010023;500,00;L;1000;15.01.2023
000000000000010024;150,50;GAL;2000;20.01.2023
```
**What would break in real deployment:** If the client uses an Excel export instead of CSV, or if the delimiter is different. Also, leading zeros in `MATNR` are often stripped by Excel before the user uploads the file to us.

## 2. Utility Data (Electricity)
**Research:** Researched PG&E's "Green Button - Download My Data" export format, which provides CSVs of energy usage.
**What I Learned:** 
- The files contain summary billing information with columns like `Service Start Date`, `Service End Date`, `Usage`, `Usage Units`, and `Cost`.
- Billing periods almost never align with calendar months (e.g., Jan 12 to Feb 10).
**Sample Data Look:**
```csv
Account Number,Service Start Date,Service End Date,Usage,Usage Units,Cost
1234567890,2023-01-12,2023-02-10,1450.5,kWh,320.45
1234567890,2023-02-11,2023-03-11,1300.0,kWh,290.10
```
**What would break in real deployment:** If the client uploads an EDI 810 invoice file or a scraped PDF, our CSV parser will fail. Some utility CSVs also have a preamble (meta-data rows at the top) before the actual header row, which would break a naive CSV parser.

## 3. Corporate Travel (Navan)
**Research:** Reviewed Navan (formerly TripActions) API documentation and reporting structures.
**What I Learned:** 
- Navan provides Booking Reports. The key fields for emissions are `tripUuid` (unique identifier), `origin` (Airport Code), `destination` (Airport Code), `cabinClass` (e.g., Economy, Business), and `bookingDate`.
- Distance is not always reliably provided via API, so relying on airport codes for distance calculation is safer.
**Sample Data Look (JSON API Response):**
```json
[
  {
    "tripUuid": "uuid-1234",
    "travelerName": "Jane Doe",
    "origin": "SFO",
    "destination": "JFK",
    "cabinClass": "Economy",
    "bookingDate": "2023-03-01T10:00:00Z"
  }
]
```
**What would break in real deployment:** If the Navan API paginates differently than our mock, or if a client uses an alternative platform like Concur Expense that only provides financial data (spend) rather than itinerary data (airports), requiring spend-based emission factors instead of distance-based.
