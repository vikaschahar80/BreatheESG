import uuid
from django.db import models

class Tenant(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class DataSource(models.Model):
    SOURCE_CHOICES = [
        ('SAP_ALV', 'SAP ALV CSV'),
        ('PGE_GREEN_BUTTON', 'PG&E Green Button CSV'),
        ('NAVAN_API', 'Navan Reporting API Mock'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    source_type = models.CharField(max_length=50, choices=SOURCE_CHOICES)

    def __str__(self):
        return f"{self.name} ({self.source_type})"

class IngestionRun(models.Model):
    STATUS_CHOICES = [
        ('IN_PROGRESS', 'In Progress'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE)
    data_source = models.ForeignKey(DataSource, on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='IN_PROGRESS')
    uploaded_by = models.CharField(max_length=255) # could be a User FK, keeping string for prototype
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Run {self.id} for {self.data_source.name} at {self.created_at}"

class ActivityRecord(models.Model):
    SCOPE_CHOICES = [
        ('SCOPE_1', 'Scope 1'),
        ('SCOPE_2', 'Scope 2'),
        ('SCOPE_3', 'Scope 3'),
    ]
    CATEGORY_CHOICES = [
        ('STATIONARY_COMBUSTION', 'Stationary Combustion'),
        ('MOBILE_COMBUSTION', 'Mobile Combustion'),
        ('PURCHASED_ELECTRICITY', 'Purchased Electricity'),
        ('BUSINESS_TRAVEL', 'Business Travel'),
    ]
    STATUS_CHOICES = [
        ('PENDING_REVIEW', 'Pending Review'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
        ('LOCKED_FOR_AUDIT', 'Locked for Audit'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE)
    ingestion_run = models.ForeignKey(IngestionRun, on_delete=models.CASCADE, related_name='records')
    
    scope = models.CharField(max_length=20, choices=SCOPE_CHOICES, null=True, blank=True)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, null=True, blank=True)
    
    source_of_truth_id = models.CharField(max_length=255, null=True, blank=True)
    raw_data = models.JSONField(default=dict)
    
    date_start = models.DateField(null=True, blank=True)
    date_end = models.DateField(null=True, blank=True)
    
    quantity = models.DecimalField(max_digits=19, decimal_places=4, null=True, blank=True)
    unit = models.CharField(max_length=50, null=True, blank=True)
    emission_factor_hint = models.CharField(max_length=255, null=True, blank=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING_REVIEW')
    validation_issues = models.JSONField(default=list, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Record {self.id} - {self.category} ({self.status})"
