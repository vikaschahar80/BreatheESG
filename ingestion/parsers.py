import csv
import json
from io import StringIO
from datetime import datetime
from .models import ActivityRecord

def parse_sap_alv_csv(file_content, tenant, ingestion_run):
    # SAP CSV often uses semicolon
    reader = csv.DictReader(StringIO(file_content), delimiter=';')
    
    # MATNR mapping mock
    matnr_mapping = {
        '000000000000010023': 'Diesel',
        '000000000000010024': 'Petrol',
        '10023': 'Diesel',
        '10024': 'Petrol',
        '10025': 'Natural Gas',
    '10026': 'Heating Oil',
    '10027': 'Propane',
    '10028': 'Lubricant',  # will still need analyst review — not a combustion fuel
    '10029': 'Refrigerant R-410A',
    }

    records = []
    for row_num, row in enumerate(reader, start=1):
        issues = []
        matnr = row.get('MATNR', '').strip()
        menge = row.get('MENGE', '').strip().replace(',', '.') # Handle German decimal comma
        meins = row.get('MEINS', '').strip()
        budat = row.get('BUDAT', '').strip()
        werks = row.get('WERKS', '').strip()

        if not meins:
            issues.append("Missing unit (MEINS)")

        # Date parsing
        date_start = None
        if budat:
            try:
                date_start = datetime.strptime(budat, '%d.%m.%Y').date()
            except ValueError:
                issues.append(f"Invalid date format for BUDAT: {budat}")

        # Quantity parsing
        quantity = None
        if menge:
            try:
                quantity = float(menge)
            except ValueError:
                issues.append(f"Invalid quantity MENGE: {menge}")
        else:
            issues.append("Missing quantity MENGE")

        fuel_type = matnr_mapping.get(matnr)
        if not fuel_type:
            # Strip leading zeros and try again
            stripped_matnr = matnr.lstrip('0')
            fuel_type = matnr_mapping.get(stripped_matnr)
        
        if not fuel_type:
            issues.append(f"Unknown MATNR: {matnr}")

        status = 'PENDING_REVIEW'

        record = ActivityRecord(
            tenant=tenant,
            ingestion_run=ingestion_run,
            scope='SCOPE_1',
            category='STATIONARY_COMBUSTION',
            source_of_truth_id=f"SAP_ROW_{row_num}",
            raw_data=row,
            date_start=date_start,
            date_end=date_start,
            quantity=quantity,
            unit=meins,
            emission_factor_hint=fuel_type or matnr,
            status=status,
            validation_issues=issues
        )
        records.append(record)
    
    ActivityRecord.objects.bulk_create(records)


def parse_pge_green_button_csv(file_content, tenant, ingestion_run):
    reader = csv.DictReader(StringIO(file_content))
    records = []
    for row_num, row in enumerate(reader, start=1):
        issues = []
        start_date_str = row.get('Service Start Date', '').strip()
        end_date_str = row.get('Service End Date', '').strip()
        usage_str = row.get('Usage', '').strip()
        unit = row.get('Usage Units', '').strip()
        account = row.get('Account Number', '').strip()
        
        date_start = None
        date_end = None
        try:
            date_start = datetime.strptime(start_date_str, '%Y-%m-%d').date()
            date_end = datetime.strptime(end_date_str, '%Y-%m-%d').date()
        except ValueError:
            issues.append("Invalid date format, expected YYYY-MM-DD")

        quantity = None
        if usage_str:
            try:
                quantity = float(usage_str)
            except ValueError:
                issues.append(f"Invalid usage value: {usage_str}")
        else:
            issues.append("Missing usage value")

        record = ActivityRecord(
            tenant=tenant,
            ingestion_run=ingestion_run,
            scope='SCOPE_2',
            category='PURCHASED_ELECTRICITY',
            source_of_truth_id=f"PGE_{account}_{start_date_str}",
            raw_data=row,
            date_start=date_start,
            date_end=date_end,
            quantity=quantity,
            unit=unit,
            emission_factor_hint="PG&E Utility",
            status='PENDING_REVIEW',
            validation_issues=issues
        )
        records.append(record)

    ActivityRecord.objects.bulk_create(records)


def process_navan_mock_sync(tenant, ingestion_run):
    # Simulated JSON API response from Navan
    mock_response = [
        {
            "tripUuid": "navan-5501",
            "travelerName": "Alice Smith",
            "origin": "SFO",
            "destination": "JFK",
            "cabinClass": "Economy",
            "bookingDate": "2023-04-10T08:00:00Z"
        },
        {
            "tripUuid": "navan-5502",
            "travelerName": "Bob Jones",
            "origin": "LHR",
            "destination": "CDG",
            "cabinClass": "Business",
            "bookingDate": "2023-04-12T09:30:00Z"
        },
        {
            "tripUuid": "navan-5503",
            "travelerName": "Charlie Brown",
            "origin": "UNKNOWN",
            "destination": "FRA",
            "cabinClass": "Economy",
            "bookingDate": "2023-04-15T10:00:00Z"
        }
    ]

    records = []
    for item in mock_response:
        issues = []
        origin = item.get('origin')
        destination = item.get('destination')
        
        if origin == "UNKNOWN" or not origin:
            issues.append("Missing origin airport code")
        if destination == "UNKNOWN" or not destination:
            issues.append("Missing destination airport code")

        date_start = None
        booking_date = item.get('bookingDate')
        if booking_date:
            date_start = datetime.strptime(booking_date[:10], '%Y-%m-%d').date()

        record = ActivityRecord(
            tenant=tenant,
            ingestion_run=ingestion_run,
            scope='SCOPE_3',
            category='BUSINESS_TRAVEL',
            source_of_truth_id=item.get('tripUuid'),
            raw_data=item,
            date_start=date_start,
            date_end=date_start,
            quantity=1, # 1 flight
            unit='Flight',
            emission_factor_hint=f"{origin}-{destination} ({item.get('cabinClass')})",
            status='PENDING_REVIEW',
            validation_issues=issues
        )
        records.append(record)
    
    ActivityRecord.objects.bulk_create(records)
