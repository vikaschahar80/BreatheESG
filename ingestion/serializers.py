from rest_framework import serializers
from .models import Tenant, DataSource, IngestionRun, ActivityRecord

class TenantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tenant
        fields = '__all__'

class DataSourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = DataSource
        fields = '__all__'

class ActivityRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = ActivityRecord
        fields = '__all__'

class IngestionRunSerializer(serializers.ModelSerializer):
    data_source_name = serializers.CharField(source='data_source.name', read_only=True)
    records_count = serializers.SerializerMethodField()
    pending_count = serializers.SerializerMethodField()

    class Meta:
        model = IngestionRun
        fields = ['id', 'tenant', 'data_source', 'data_source_name', 'status', 'uploaded_by', 'created_at', 'records_count', 'pending_count']

    def get_records_count(self, obj):
        return obj.records.count()

    def get_pending_count(self, obj):
        return obj.records.filter(status='PENDING_REVIEW').count()
