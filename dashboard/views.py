from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import DecimalField, ExpressionWrapper, F, Sum, Count, Q
from django.db.models.functions import TruncDate, ExtractHour
from pos.models import Order, OrderItem, Table, TableSession
from inventory.models import Ingredient, StockMovement
from tenants.models import Restaurant
from tenants.utils import get_current_tenant
from accounts.models import TenantUser
from accounting.models import JournalEntry, JournalItem, AccountType

class TenantDashboardView(APIView):
    def get(self, request, tenant_slug=None):
        user = request.user
        tenant = get_current_tenant()

        if not tenant and user.is_superuser:
            return self.get_super_admin_data()

        if not tenant:
            return Response({'error': 'Tenant context required'}, status=400)

        try:
            tenant_user = TenantUser.objects.get(user=user, restaurant=tenant)
            role_name = tenant_user.role.name if tenant_user.role else 'custom'
        except TenantUser.DoesNotExist:
            if user.is_superuser:
                role_name = 'owner'
            else:
                return Response({'error': 'User not found in this tenant'}, status=403)

        if role_name == 'owner':
            return self.get_owner_data(tenant)
        elif role_name == 'manager':
            return self.get_manager_data(tenant)
        elif role_name == 'waiter':
            return self.get_waiter_data(tenant, user)
        elif role_name == 'kitchen':
            return self.get_kitchen_data(tenant)
        elif role_name in ['cashier', 'reception']:
            return self.get_cashier_data(tenant)
        elif role_name == 'accountant':
            return self.get_accountant_data(tenant)
        elif role_name == 'table_user':
            return self.get_table_user_data(tenant)
        else:
            return self.get_owner_data(tenant)

    def get_super_admin_data(self):
        total_restaurants = Restaurant.objects.count()
        active_restaurants = Restaurant.objects.filter(is_active=True).count()
        suspended_restaurants = Restaurant.objects.filter(subscription_status='suspended').count()
        
        return Response({
            'role': 'super_admin',
            'metrics': {
                'total_restaurants': total_restaurants,
                'active_restaurants': active_restaurants,
                'suspended_restaurants': suspended_restaurants,
                'total_users': 0,
            },
            'financials': {
                'total_revenue': 0,
                'subscription_income': 0,
                'pending_payments': 0
            }
        })

    def get_owner_data(self, tenant):
        now = timezone.now()
        today = now.date()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        last_30_days = now - timezone.timedelta(days=30)

        # 1. KPIs
        today_sales = Order.objects.filter(restaurant=tenant, created_at__gte=today_start, status='completed').aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        monthly_sales = Order.objects.filter(restaurant=tenant, created_at__gte=month_start, status='completed').aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        total_orders_today = Order.objects.filter(restaurant=tenant, created_at__gte=today_start).count()
        avg_order_value = (today_sales / total_orders_today) if total_orders_today > 0 else 0

        active_tables = Table.objects.filter(restaurant=tenant, status='occupied').count()

        # 2. Charts Data
        
        # Hourly Sales (Today)
        hourly_sales = Order.objects.filter(
            restaurant=tenant, 
            created_at__gte=today_start, 
            status='completed'
        ).annotate(hour=ExtractHour('created_at')).values('hour').annotate(total=Sum('total_amount')).order_by('hour')
        
        sales_hourly_data = [{'hour': h['hour'], 'total': h['total']} for h in hourly_sales]
        # Fill missing hours
        sales_hourly_map = {d['hour']: d['total'] for d in sales_hourly_data}
        sales_hourly_final = [{'hour': h, 'total': sales_hourly_map.get(h, 0)} for h in range(24)]

        # Daily Sales (Last 30 days)
        daily_sales = Order.objects.filter(
            restaurant=tenant, 
            created_at__gte=last_30_days, 
            status='completed'
        ).annotate(day=TruncDate('created_at')).values('day').annotate(total=Sum('total_amount')).order_by('day')
        
        daily_sales_data = [{'date': d['day'].strftime('%Y-%m-%d'), 'total': d['total']} for d in daily_sales]

        # Revenue Breakdown (Monthly)
        revenue_breakdown = Order.objects.filter(
            restaurant=tenant,
            created_at__gte=month_start,
            status='completed'
        ).aggregate(
            sales=Sum(F('total_amount') - F('tax_amount') - F('service_charge_amount')),
            tax=Sum('tax_amount'),
            service=Sum('service_charge_amount')
        )

        # 3. Expenses & Profit
        purchase_cost_expr = ExpressionWrapper(
            F('quantity') * F('ingredient__cost_per_unit'),
            output_field=DecimalField(max_digits=12, decimal_places=2),
        )
        expenses = (
            StockMovement.objects.filter(
                tenant=tenant,
                movement_type='in',
                reason='purchase',
                created_at__gte=month_start,
            ).aggregate(total_cost=Sum(purchase_cost_expr))['total_cost']
            or 0
        )

        gross_profit = float(monthly_sales) - float(expenses)

        # 4. Alerts
        low_stock_count = Ingredient.objects.filter(tenant=tenant, current_stock__lte=F('min_stock')).count()
        open_sessions_count = TableSession.objects.filter(table__restaurant=tenant, is_active=True).count()
        # "Failed payments" -> Cancelled orders today
        cancelled_orders = Order.objects.filter(restaurant=tenant, status='cancelled', created_at__gte=today_start).count()
        
        # Accounting Imbalance (Basic check: total debit != total credit for posted entries)
        # Ideally this is done per entry, but for dashboard summary we check if any exist
        imbalanced_entries = JournalEntry.objects.filter(tenant=tenant, posted=True).annotate(
            total_dr=Sum('items__debit'),
            total_cr=Sum('items__credit')
        ).filter(~Q(total_dr=F('total_cr'))).count()

        return Response({
            'role': 'owner',
            'kpis': {
                'today_sales': today_sales,
                'monthly_sales': monthly_sales,
                'gross_profit': gross_profit,
                'total_orders_today': total_orders_today,
                'avg_order_value': avg_order_value,
            },
            'charts': {
                'hourly_sales': sales_hourly_final,
                'daily_sales': daily_sales_data,
                'revenue_breakdown': revenue_breakdown
            },
            'alerts': {
                'low_stock': low_stock_count,
                'open_sessions': open_sessions_count,
                'cancelled_orders': cancelled_orders,
                'accounting_imbalance': imbalanced_entries
            },
            'operational': {
                'active_tables': active_tables,
                'orders_in_progress': Order.objects.filter(restaurant=tenant, status__in=['open', 'confirmed', 'preparing', 'ready']).count(),
                'kitchen_load': Order.objects.filter(restaurant=tenant, status='preparing').count(),
                'staff_on_duty': TenantUser.objects.filter(restaurant=tenant, is_active=True).count()
            },
             'inventory': {
                'total_value': Ingredient.objects.filter(tenant=tenant).aggregate(
                    total=Sum(
                        ExpressionWrapper(
                            F('current_stock') * F('cost_per_unit'),
                            output_field=DecimalField(max_digits=12, decimal_places=2),
                        )
                    )
                )['total']
                or 0,
                'low_stock_items': low_stock_count
            }
        })

    def get_manager_data(self, tenant):
        now = timezone.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        
        today_sales = Order.objects.filter(restaurant=tenant, created_at__gte=today_start, status='completed').aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        
        return Response({
            'role': 'manager',
            'sales_orders': {
                'today_sales': today_sales,
                'orders_in_queue': Order.objects.filter(restaurant=tenant, status='open').count(),
                'completed_orders': Order.objects.filter(restaurant=tenant, status='completed', created_at__gte=today_start).count(),
                'cancelled_orders': Order.objects.filter(restaurant=tenant, status='cancelled', created_at__gte=today_start).count(),
            },
            'inventory': {
                'low_stock_alerts': Ingredient.objects.filter(tenant=tenant, current_stock__lte=F('min_stock')).count(),
            },
            'staff': {
                'active_staff': TenantUser.objects.filter(restaurant=tenant, is_active=True).count(),
            }
        })

    def get_cashier_data(self, tenant):
        open_bills = Order.objects.filter(restaurant=tenant, status__in=['served', 'ready']).count()
        pending_payments = Order.objects.filter(restaurant=tenant, status='served').aggregate(Sum('total_amount'))['total_amount__sum'] or 0

        return Response({
            'role': 'cashier',
            'billing': {
                'open_bills': open_bills,
                'pending_payments': pending_payments,
                'completed_bills_today': Order.objects.filter(restaurant=tenant, status='completed', created_at__date=timezone.now().date()).count()
            },
            'tables': {
                'occupied': Table.objects.filter(restaurant=tenant, status='occupied').count(),
                'available': Table.objects.filter(restaurant=tenant, status='available').count(),
                'reserved': Table.objects.filter(restaurant=tenant, status='reserved').count(),
            }
        })

    def get_waiter_data(self, tenant, user):
        try:
            waiter_user = TenantUser.objects.get(user=user, restaurant=tenant)
        except TenantUser.DoesNotExist:
            waiter_user = None

        assigned_tables = Table.objects.filter(restaurant=tenant, status='occupied').count()

        my_orders_pending = Order.objects.filter(restaurant=tenant, waiter=waiter_user, status__in=['open', 'confirmed', 'preparing']).count() if waiter_user else 0
        ready_to_serve = Order.objects.filter(restaurant=tenant, waiter=waiter_user, status='ready').count() if waiter_user else 0

        return Response({
            'role': 'waiter',
            'tables': {
                'assigned_count': assigned_tables,
                'your_tables': []
            },
            'orders': {
                'pending': my_orders_pending,
                'ready_to_serve': ready_to_serve,
                'served_today': Order.objects.filter(restaurant=tenant, waiter=waiter_user, status='served', created_at__date=timezone.now().date()).count() if waiter_user else 0
            }
        })

    def get_kitchen_data(self, tenant):
        pending_items = OrderItem.objects.filter(order__restaurant=tenant, status__in=['sent', 'preparing']).count()
        orders_preparing = Order.objects.filter(restaurant=tenant, status='preparing').count()

        return Response({
            'role': 'kitchen',
            'queue': {
                'pending_items': pending_items,
                'orders_preparing': orders_preparing,
            },
            'performance': {
                'avg_prep_time': '15 mins',
                'completed_today': OrderItem.objects.filter(order__restaurant=tenant, status='ready', created_at__date=timezone.now().date()).count()
            }
        })

    def get_accountant_data(self, tenant):
        month_start = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        revenue = Order.objects.filter(restaurant=tenant, status='completed', created_at__gte=month_start).aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        purchase_cost_expr = ExpressionWrapper(
            F('quantity') * F('ingredient__cost_per_unit'),
            output_field=DecimalField(max_digits=12, decimal_places=2),
        )
        expenses = (
            StockMovement.objects.filter(
                tenant=tenant,
                movement_type='in',
                reason='purchase',
                created_at__gte=month_start,
            ).aggregate(total_cost=Sum(purchase_cost_expr))['total_cost']
            or 0
        )

        return Response({
            'role': 'accountant',
            'financials': {
                'total_revenue': revenue,
                'total_expenses': expenses,
                'net_profit': float(revenue) - float(expenses)
            },
            'status': {
                'pending_invoices': 0,
                'unreconciled': 0
            }
        })

    def get_table_user_data(self, tenant):
        return Response({
            'role': 'table_user',
            'session': {
                'status': 'active',
                'table': 'Unknown'
            },
            'order_summary': {
                'item_count': 0,
                'status': 'none'
            }
        })
