import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Download, Loader2, FileText } from "lucide-react";
import { format } from "date-fns";
import type { Order, Receipt } from "@shared/schema";

export default function ReceiptView() {
  const { id } = useParams<{ id: string }>();

  const { data: order, isLoading: orderLoading } = useQuery<Order>({
    queryKey: ["/api/orders", id],
    enabled: !!id,
  });

  const { data: receipt, isLoading: receiptLoading } = useQuery<Receipt>({
    queryKey: ["/api/receipts", id],
    enabled: !!id,
  });

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    try {
      const response = await fetch(`/api/receipts/${id}/pdf`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Receipt-${receipt?.receiptNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Failed to download PDF:", error);
    }
  };

  if (orderLoading || receiptLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!order || !receipt) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Receipt not found</p>
      </div>
    );
  }

  const breakdown = JSON.parse(receipt.itemizedBreakdown);

  const getServiceDescription = () => {
    if (order.serviceType === "printing") {
      return `${order.paperSize} - ${order.printType === "color" ? "Color" : "Mono"} Printing`;
    } else if (order.serviceType === "largeformat") {
      return `${order.serviceName} - ${order.customWidth}×${order.customHeight} sqft`;
    } else if (order.serviceType === "products") {
      return order.serviceName;
    }
    return "Print Job";
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="print:hidden mb-6 flex gap-4">
        <Button onClick={handlePrint} variant="outline" data-testid="button-print">
          <FileText className="mr-2 h-4 w-4" />
          Print Receipt
        </Button>
        <Button onClick={handleDownloadPDF} data-testid="button-download-pdf">
          <Download className="mr-2 h-4 w-4" />
          Download PDF
        </Button>
      </div>

      <Card className="print:shadow-none print:border-0">
        <CardHeader className="space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary text-primary-foreground">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">PrintPress Pro</h1>
                  <p className="text-sm text-muted-foreground">Professional Printing Services</p>
                </div>
              </div>
              <div className="text-sm text-muted-foreground mt-4">
                <p>123 Print Street</p>
                <p>Lagos, Nigeria</p>
                <p>contact@printpress.com</p>
                <p>+234 123 456 7890</p>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-3xl font-bold mb-2">RECEIPT</h2>
              <div className="text-sm space-y-1">
                <p className="font-medium">
                  Receipt #: <span className="text-primary" data-testid="text-receipt-number">{receipt.receiptNumber}</span>
                </p>
                <p className="font-medium">
                  Job #: <span data-testid="text-job-number">{order.jobNumber}</span>
                </p>
                <p className="text-muted-foreground">
                  Date: {format(new Date(receipt.createdAt), "MMM dd, yyyy")}
                </p>
                <p className="text-muted-foreground">
                  Time: {format(new Date(receipt.createdAt), "hh:mm a")}
                </p>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Job Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Service Type</p>
                <p className="font-medium capitalize" data-testid="text-service-type">{order.serviceType}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Quantity</p>
                <p className="font-medium" data-testid="text-quantity">{order.quantity}</p>
              </div>
              {order.serviceType === "printing" && (
                <>
                  <div>
                    <p className="text-muted-foreground">Paper Size</p>
                    <p className="font-medium" data-testid="text-paper-size">{order.paperSize}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Print Type</p>
                    <p className="font-medium" data-testid="text-print-type">
                      {order.printType === "color" ? "Color Printing" : "Monochrome Printing"}
                    </p>
                  </div>
                </>
              )}
              {order.serviceType === "largeformat" && (
                <>
                  <div>
                    <p className="text-muted-foreground">Service</p>
                    <p className="font-medium">{order.serviceName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Size</p>
                    <p className="font-medium">{order.customWidth} × {order.customHeight} sqft</p>
                  </div>
                </>
              )}
              {order.serviceType === "products" && (
                <div>
                  <p className="text-muted-foreground">Product</p>
                  <p className="font-medium">{order.serviceName}</p>
                </div>
              )}
              {order.finishingOptions && order.finishingOptions.length > 0 && (
                <div className="col-span-2">
                  <p className="text-muted-foreground">Finishing Options</p>
                  <p className="font-medium">
                    {order.finishingOptions.join(", ")}
                  </p>
                </div>
              )}
            </div>
            {order.additionalSpecs && (
              <div className="mt-4">
                <p className="text-muted-foreground">Additional Specifications</p>
                <p className="font-medium">{order.additionalSpecs}</p>
              </div>
            )}
          </div>

          <Separator />

          <div>
            <h3 className="text-lg font-semibold mb-4">Itemized Breakdown</h3>
            <div className="border rounded-md overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Service</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold">Quantity</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold">Unit Price</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {breakdown.map((item: any, index: number) => (
                    <tr key={index}>
                      <td className="px-6 py-4 text-sm">{item.service}</td>
                      <td className="px-6 py-4 text-sm text-center">{item.quantity}</td>
                      <td className="px-6 py-4 text-sm text-right">
                        ₦{parseFloat(item.unitPrice).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-sm text-right font-medium">
                        ₦{parseFloat(item.total).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end">
            <div className="w-80 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">₦{parseFloat(receipt.subtotal).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">VAT (10%)</span>
                <span className="font-medium">₦{parseFloat(receipt.tax).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-xl font-semibold">Grand Total</span>
                <span className="text-2xl font-bold text-primary" data-testid="text-grand-total">
                  ₦{parseFloat(receipt.total).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          <Separator className="my-8" />

          <div className="text-center text-sm text-muted-foreground space-y-2">
            <p className="font-medium">Thank you for your business!</p>
            <p>For any questions regarding this receipt, please contact us at contact@printpress.com</p>
            <p className="text-xs">This is a computer-generated receipt and does not require a signature.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
