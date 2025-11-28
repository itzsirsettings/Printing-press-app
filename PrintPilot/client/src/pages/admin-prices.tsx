import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { PriceList } from "@shared/schema";
import { Badge } from "@/components/ui/badge";

const priceListSchema = z.object({
  serviceName: z.string().min(1, "Service name is required"),
  category: z.enum(["paper", "printing", "finishing", "largeformat", "products"], { required_error: "Category is required" }),
  basePrice: z.string().min(1, "Price is required"),
  unit: z.string().min(1, "Unit is required"),
  isActive: z.boolean().default(true),
});

type PriceListFormValues = z.infer<typeof priceListSchema>;

const categoryLabels: Record<string, string> = {
  paper: "Paper",
  printing: "Printing",
  finishing: "Finishing",
  largeformat: "Large Format",
  products: "Products",
};

export default function AdminPrices() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPrice, setEditingPrice] = useState<PriceList | null>(null);
  const { toast } = useToast();

  const { data: priceLists, isLoading } = useQuery<PriceList[]>({
    queryKey: ["/api/price-lists"],
  });

  const form = useForm<PriceListFormValues>({
    resolver: zodResolver(priceListSchema),
    defaultValues: {
      serviceName: "",
      category: "paper",
      basePrice: "",
      unit: "per sheet",
      isActive: true,
    },
  });

  const createPriceMutation = useMutation({
    mutationFn: async (data: PriceListFormValues) => {
      if (editingPrice) {
        return apiRequest("PUT", `/api/price-lists/${editingPrice.id}`, data);
      }
      return apiRequest("POST", "/api/price-lists", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/price-lists"] });
      toast({
        title: editingPrice ? "Price Updated" : "Price Added",
        description: `Price list has been ${editingPrice ? "updated" : "added"} successfully.`,
      });
      setIsDialogOpen(false);
      setEditingPrice(null);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save price list. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deletePriceMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/price-lists/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/price-lists"] });
      toast({
        title: "Price Deleted",
        description: "Price list has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete price list. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PriceListFormValues) => {
    createPriceMutation.mutate(data);
  };

  const handleEdit = (price: PriceList) => {
    setEditingPrice(price);
    form.reset({
      serviceName: price.serviceName,
      category: price.category as "paper" | "printing" | "finishing" | "largeformat" | "products",
      basePrice: price.basePrice,
      unit: price.unit,
      isActive: price.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this price item?")) {
      deletePriceMutation.mutate(id);
    }
  };

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingPrice(null);
      form.reset();
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "paper":
        return <Badge variant="default">Paper</Badge>;
      case "printing":
        return <Badge variant="secondary">Printing</Badge>;
      case "finishing":
        return <Badge variant="outline">Finishing</Badge>;
      case "largeformat":
        return <Badge className="bg-purple-600 hover:bg-purple-700">Large Format</Badge>;
      case "products":
        return <Badge className="bg-orange-600 hover:bg-orange-700">Products</Badge>;
      default:
        return <Badge>{category}</Badge>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle className="text-3xl">Price Lists</CardTitle>
              <CardDescription>Manage pricing for printing services</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-price">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Price Item
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingPrice ? "Edit Price Item" : "Add New Price Item"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingPrice
                      ? "Update the price information below"
                      : "Enter the details for the new price item"}
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="serviceName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Service Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., A4 Paper, Color Printing, Flex Banner" data-testid="input-service-name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-category">
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="paper">Paper</SelectItem>
                              <SelectItem value="printing">Printing</SelectItem>
                              <SelectItem value="finishing">Finishing</SelectItem>
                              <SelectItem value="largeformat">Large Format</SelectItem>
                              <SelectItem value="products">Products</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="basePrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Base Price (₦)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                data-testid="input-base-price"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="unit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Unit</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., per sheet, per sqft" data-testid="input-unit" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <DialogFooter>
                      <Button
                        type="submit"
                        disabled={createPriceMutation.isPending}
                        data-testid="button-submit-price"
                      >
                        {createPriceMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : editingPrice ? (
                          "Update Price"
                        ) : (
                          "Add Price"
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : priceLists && priceLists.length > 0 ? (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Base Price</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {priceLists.map((price) => (
                    <TableRow key={price.id}>
                      <TableCell className="font-medium">{price.serviceName}</TableCell>
                      <TableCell>{getCategoryBadge(price.category)}</TableCell>
                      <TableCell>₦{parseFloat(price.basePrice).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell>{price.unit}</TableCell>
                      <TableCell>
                        <Badge variant={price.isActive ? "default" : "secondary"}>
                          {price.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(price)}
                            data-testid={`button-edit-${price.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(price.id)}
                            data-testid={`button-delete-${price.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
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
              <p className="text-muted-foreground">No price items yet. Add your first price item to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
