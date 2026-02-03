from django.db import models
from tenants.models import Restaurant

class Printer(models.Model):
    KITCHEN = 'kitchen'
    BAR = 'bar'
    FRONT = 'front'
    TYPES = [(KITCHEN, 'Kitchen'), (BAR, 'Bar'), (FRONT, 'Front Desk')]
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='printers')
    name = models.CharField(max_length=100)
    printer_type = models.CharField(max_length=20, choices=TYPES)
    address = models.CharField(max_length=255, blank=True)  # IP/USB path
    status = models.CharField(max_length=20, default='online', choices=[('online', 'Online'), ('offline', 'Offline')])
    last_checked = models.DateTimeField(auto_now=True)

class PrintJob(models.Model):
    printer_type = models.CharField(max_length=20, choices=Printer.TYPES)
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='print_jobs')
    payload = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)
    printed = models.BooleanField(default=False)
