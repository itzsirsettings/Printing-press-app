import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, DollarSign, Clock, CheckCircle, Loader2 } from "lucide-react";
import type { Order } from "@shared/schema";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function AdminDashboard() {
  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const { data: customers } = useQuery({ queryKey: ["/api/customers"] });
  const { data: sales } = useQuery({ queryKey: ["/api/sales"] });
  const { data: deposits } = useQuery({ queryKey: ["/api/deposits"] });
  const { data: expenses } = useQuery({ queryKey: ["/api/expenses"] });

  const totalOrders = orders?.length || 0;
  const totalRevenue = orders?.reduce((sum, order) => sum + parseFloat(order.total), 0) || 0;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const completedToday = orders?.filter((order) => {
    const orderDate = new Date(order.createdAt);
    orderDate.setHours(0, 0, 0, 0);
    return orderDate.getTime() === today.getTime();
  }).length || 0;

  const recentOrders = orders?.slice(0, 5) || [];

  const metrics = [
    {
      title: "Total Orders",
      value: totalOrders.toLocaleString(),
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-950",
      testId: "metric-total-orders",
    },
    {
      title: "Total Revenue",
      value: `₦${totalRevenue.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-950",
      testId: "metric-total-revenue",
    },
    {
      title: "Customers",
      value: `${(customers || []).length}`,
      icon: FileText,
      color: "text-indigo-600",
      bgColor: "bg-indigo-100 dark:bg-indigo-950",
      testId: "metric-customers",
    },
    {
      title: "Expenses",
      value: `₦${(expenses || []).reduce((s: number, e: any) => s + parseFloat(e.amount || 0), 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`,
      icon: Clock,
      color: "text-rose-600",
      bgColor: "bg-rose-100 dark:bg-rose-950",
      testId: "metric-expenses",
    },
    {
      title: "Completed Today",
      value: completedToday.toLocaleString(),
      icon: CheckCircle,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100 dark:bg-emerald-950",
      testId: "metric-completed-today",
    },
    {
      title: "Pending Jobs",
      value: "0",
      icon: Clock,
      color: "text-amber-600",
      bgColor: "bg-amber-100 dark:bg-amber-950",
      testId: "metric-pending-jobs",
    },
  ];

  const getServiceDescription = (order: Order) => {
    if (order.serviceType === "printing") {
      return `${order.paperSize} - ${order.printType}`;
    } else if (order.serviceType === "largeformat") {
      return `${order.serviceName} (${order.customWidth}×${order.customHeight})`;
    } else if (order.serviceType === "products") {
      return order.serviceName;
    }
    return order.serviceType;
  };

  const getServiceTypeBadge = (serviceType: string) => {
    switch (serviceType) {
      case "printing":
        return <Badge variant="default" className="text-xs">Document</Badge>;
      case "largeformat":
        return <Badge variant="secondary" className="text-xs">Large Format</Badge>;
      case "products":
        return <Badge variant="outline" className="text-xs">Product</Badge>;
      default:
        return <Badge className="text-xs">{serviceType}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your printing business</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => (
          <Card key={metric.title}>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
              <div className={`h-10 w-10 rounded-md ${metric.bgColor} flex items-center justify-center`}>
                <metric.icon className={`h-5 w-5 ${metric.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid={metric.testId}>
                {metric.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {recentOrders.length > 0 ? (
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 border rounded-md">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium">{order.jobNumber}</p>
                      {getServiceTypeBadge(order.serviceType)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {getServiceDescription(order)} - {order.quantity} {order.quantity === 1 ? 'unit' : 'units'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">₦{parseFloat(order.total).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(order.createdAt), "MMM dd, yyyy")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No recent orders</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
