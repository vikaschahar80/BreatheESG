from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Tenant, DataSource, IngestionRun, ActivityRecord
from .serializers import TenantSerializer, DataSourceSerializer, IngestionRunSerializer, ActivityRecordSerializer
from .parsers import parse_sap_alv_csv, parse_pge_green_button_csv, process_navan_mock_sync

class IngestionRunViewSet(viewsets.ModelViewSet):
    queryset = IngestionRun.objects.all().order_by('-created_at')
    serializer_class = IngestionRunSerializer

    @action(detail=False, methods=['post'])
    def upload_file(self, request):
        tenant_id = request.data.get('tenant_id')
        source_id = request.data.get('source_id')
        source_type = request.data.get('source_type')
        uploaded_by = request.data.get('uploaded_by', 'analyst@breathe.esg')
        file_obj = request.FILES.get('file')

        if not tenant_id or not file_obj or not (source_id or source_type):
            return Response({"error": "Missing parameters"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            tenant = Tenant.objects.get(id=tenant_id)
            if source_id:
                source = DataSource.objects.get(id=source_id)
            else:
                source = DataSource.objects.get(source_type=source_type)
        except (Tenant.DoesNotExist, DataSource.DoesNotExist):
            return Response({"error": "Invalid tenant or source"}, status=status.HTTP_404_NOT_FOUND)

        run = IngestionRun.objects.create(
            tenant=tenant,
            data_source=source,
            uploaded_by=uploaded_by,
            status='IN_PROGRESS'
        )

        try:
            content = file_obj.read().decode('utf-8')
            if source.source_type == 'SAP_ALV':
                parse_sap_alv_csv(content, tenant, run)
            elif source.source_type == 'PGE_GREEN_BUTTON':
                parse_pge_green_button_csv(content, tenant, run)
            else:
                raise ValueError("Invalid source type for file upload")
            
            run.status = 'COMPLETED'
            run.save()
            return Response(IngestionRunSerializer(run).data, status=status.HTTP_201_CREATED)
        except Exception as e:
            run.status = 'FAILED'
            run.save()
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'])
    def sync_navan(self, request):
        tenant_id = request.data.get('tenant_id')
        uploaded_by = request.data.get('uploaded_by', 'system_sync')

        try:
            tenant = Tenant.objects.get(id=tenant_id)
            source = DataSource.objects.get(source_type='NAVAN_API')
        except (Tenant.DoesNotExist, DataSource.DoesNotExist):
            return Response({"error": "Invalid tenant or missing Navan source"}, status=status.HTTP_404_NOT_FOUND)

        run = IngestionRun.objects.create(
            tenant=tenant,
            data_source=source,
            uploaded_by=uploaded_by,
            status='IN_PROGRESS'
        )

        try:
            process_navan_mock_sync(tenant, run)
            run.status = 'COMPLETED'
            run.save()
            return Response(IngestionRunSerializer(run).data, status=status.HTTP_201_CREATED)
        except Exception as e:
            run.status = 'FAILED'
            run.save()
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ActivityRecordViewSet(viewsets.ModelViewSet):
    queryset = ActivityRecord.objects.all().order_by('-created_at')
    serializer_class = ActivityRecordSerializer
    filterset_fields = ['ingestion_run', 'status', 'category']

    def get_queryset(self):
        qs = super().get_queryset()
        run_id = self.request.query_params.get('ingestion_run')
        if run_id:
            qs = qs.filter(ingestion_run_id=run_id)
        return qs

    @action(detail=False, methods=['post'])
    def bulk_update_status(self, request):
        record_ids = request.data.get('record_ids', [])
        new_status = request.data.get('status')

        if not record_ids or not new_status:
            return Response({"error": "Missing record_ids or status"}, status=status.HTTP_400_BAD_REQUEST)

        if new_status not in dict(ActivityRecord.STATUS_CHOICES):
            return Response({"error": "Invalid status"}, status=status.HTTP_400_BAD_REQUEST)

        # Bulk update
        ActivityRecord.objects.filter(id__in=record_ids).update(status=new_status)
        return Response({"message": f"Updated {len(record_ids)} records to {new_status}"}, status=status.HTTP_200_OK)

class SetupViewSet(viewsets.ViewSet):
    @action(detail=False, methods=['post'])
    def seed_data(self, request):
        # Create a default tenant and sources for the prototype
        tenant, _ = Tenant.objects.get_or_create(name="Acme Corp")
        DataSource.objects.get_or_create(name="SAP ERP", source_type="SAP_ALV")
        DataSource.objects.get_or_create(name="PG&E Portal", source_type="PGE_GREEN_BUTTON")
        DataSource.objects.get_or_create(name="Navan Expense", source_type="NAVAN_API")
        
        return Response({"tenant_id": tenant.id, "message": "Seeded"}, status=status.HTTP_200_OK)
