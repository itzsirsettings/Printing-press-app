import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, Download, Search, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";
import type { Order } from "@shared/schema";
import { Badge } from "@/components/ui/badge";

export default function OrderHistory() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const filteredOrders = orders?.filter((order) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      order.jobNumber.toLowerCase().includes(searchLower) ||
      (order.paperSize && order.paperSize.toLowerCase().includes(searchLower)) ||
      (order.printType && order.printType.toLowerCase().includes(searchLower)) ||
      (order.serviceName && order.serviceName.toLowerCase().includes(searchLower)) ||
      order.serviceType.toLowerCase().includes(searchLower)
    );
  });

  const handleDownloadPDF = async (orderId: string, jobNumber: string) => {
    try {
      const response = await fetch(`/api/receipts/${orderId}/pdf`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Receipt-${jobNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Failed to download PDF:", error);
    }
  };

  const getServiceDescription = (order: Order) => {
    if (order.serviceType === "printing") {
      return `${order.paperSize} - ${order.printType === "color" ? "Color" : "Mono"}`;
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
        return <Badge variant="default">Document</Badge>;
      case "largeformat":
        return <Badge variant="secondary">Large Format</Badge>;
      case "products":
        return <Badge variant="outline">Product</Badge>;
      default:
        return <Badge>{serviceType}</Badge>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Order History</CardTitle>
          <CardDescription>View and manage all print job orders</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by job number, service, or type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredOrders && filteredOrders.length > 0 ? (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job Number</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium" data-testid={`text-job-${order.jobNumber}`}>
                        {order.jobNumber}
                      </TableCell>
                      <TableCell>
                        {format(new Date(order.createdAt), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell>
                        {getServiceTypeBadge(order.serviceType)}
                      </TableCell>
                      <TableCell>{getServiceDescription(order)}</TableCell>
                      <TableCell>{order.quantity}</TableCell>
                      <TableCell className="text-right font-medium">
                        ₦{parseFloat(order.total).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                            data-testid={`button-view-${order.jobNumber}`}
                          >
                            <Link href={`/receipt/${order.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDownloadPDF(order.id, order.jobNumber)}
                            data-testid={`button-download-${order.jobNumber}`}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {searchQuery ? "No orders found matching your search" : "No orders yet"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
