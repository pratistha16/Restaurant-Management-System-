from rest_framework import viewsets, permissions
from rest_framework.response import Response
from .models import PrintJob, Printer
from accounts.permissions import HasPermission
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

class PrintJobViewSet(viewsets.ViewSet):
    permission_classes = [HasPermission]
    required_permission = 'printing.manage'

    def list(self, request):
        tenant = getattr(request, 'tenant', None)
        jobs = PrintJob.objects.filter(restaurant=tenant, printed=False).order_by('created_at')[:50]
        return Response([{"id": j.id, "type": j.printer_type, "payload": j.payload} for j in jobs])

    def create(self, request):
        tenant = getattr(request, 'tenant', None)
        job = PrintJob.objects.create(
            restaurant=tenant,
            printer_type=request.data.get("type"),
            payload=request.data.get("payload", {}),
        )
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"printer:{tenant.id}:{job.printer_type}",
            {"type": "print.job", "payload": job.payload}
        )
        return Response({"id": job.id})
