# Tradeoffs

Three things I deliberately did not build:

1. **A UI for mapping SAP Codes:** I hardcoded the mapping between SAP material numbers (MATNR) and fuel types. Building a dynamic drag-and-drop mapping UI would take too much time for a 4-day prototype.

2. **Live Navan API Connection:** I used a static JSON file that perfectly matches the Navan API format instead of setting up OAuth and real API keys. This proves the logic works without needing partner credentials.

3. **15-Minute Smart Meter Data:** I chose to parse monthly billing summaries instead of raw 15-minute interval data. Interval data requires a specialized time-series database architecture, whereas monthly bills are the realistic standard for basic GHG accounting.
