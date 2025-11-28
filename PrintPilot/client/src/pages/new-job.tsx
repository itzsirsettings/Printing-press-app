import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import type { PriceList } from "@shared/schema";

const paperSizes = [
  { value: "A4", label: "A4 (210 × 297 mm)" },
  { value: "A3", label: "A3 (297 × 420 mm)" },
  { value: "Letter", label: "Letter (8.5 × 11 in)" },
  { value: "Legal", label: "Legal (8.5 × 14 in)" },
  { value: "Tabloid", label: "Tabloid (11 × 17 in)" },
];

const finishingOptions = [
  { id: "binding", label: "Binding" },
  { id: "lamination", label: "Lamination" },
  { id: "cutting", label: "Cutting" },
  { id: "folding", label: "Folding" },
  { id: "stapling", label: "Stapling" },
];

const serviceTypes = [
  { value: "printing", label: "Document Printing" },
  { value: "largeformat", label: "Large Format Printing" },
  { value: "products", label: "Print Products" },
];

const largeFormatServices = [
  { value: "Flex Banner", label: "Flex Banner" },
  { value: "Sticker", label: "Sticker" },
  { value: "PU (Polyurethane)", label: "PU (Polyurethane)" },
  { value: "Window Graphics", label: "Window Graphics" },
];

const productServices = [
  { value: "Jotter", label: "Jotter" },
  { value: "Brochure", label: "Brochure" },
];

const jobFormSchema = z.object({
  serviceType: z.enum(["printing", "largeformat", "products"], { required_error: "Service type is required" }),
  serviceName: z.string().optional(),
  paperSize: z.string().optional(),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  printType: z.enum(["color", "mono"]).optional(),
  customWidth: z.coerce.number().min(0).optional(),
  customHeight: z.coerce.number().min(0).optional(),
  finishingOptions: z.array(z.string()).default([]),
  additionalSpecs: z.string().optional(),
});

type JobFormValues = z.infer<typeof jobFormSchema>;

export default function NewJob() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedFinishing, setSelectedFinishing] = useState<string[]>([]);

  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      serviceType: "printing",
      serviceName: "",
      paperSize: "",
      quantity: 1,
      printType: "color",
      customWidth: 0,
      customHeight: 0,
      finishingOptions: [],
      additionalSpecs: "",
    },
  });

  const serviceType = form.watch("serviceType");

  const { data: priceLists, isLoading: isPriceListsLoading } = useQuery<PriceList[]>({
    queryKey: ["/api/price-lists"],
  });

  const calculatePrice = (values: JobFormValues) => {
    if (!priceLists) return { subtotal: 0, tax: 0, total: 0, breakdown: [] };

    let subtotal = 0;
    const breakdown: Array<{ service: string; quantity: number | string; unitPrice: number; total: number }> = [];

    if (values.serviceType === "printing") {
      const paperSizePrice = priceLists.find(
        (p) => p.category === "paper" && p.serviceName.toLowerCase().includes(values.paperSize?.toLowerCase() || "")
      );
      if (paperSizePrice) {
        const total = parseFloat(paperSizePrice.basePrice) * values.quantity;
        subtotal += total;
        breakdown.push({
          service: `${values.paperSize} Paper`,
          quantity: values.quantity,
          unitPrice: parseFloat(paperSizePrice.basePrice),
          total,
        });
      }

      const printTypePrice = priceLists.find(
        (p) => p.category === "printing" && p.serviceName.toLowerCase().includes(values.printType || "")
      );
      if (printTypePrice) {
        const total = parseFloat(printTypePrice.basePrice) * values.quantity;
        subtotal += total;
        breakdown.push({
          service: `${values.printType === "color" ? "Color" : "Mono"} Printing`,
          quantity: values.quantity,
          unitPrice: parseFloat(printTypePrice.basePrice),
          total,
        });
      }

      values.finishingOptions.forEach((option) => {
        const finishingPrice = priceLists.find(
          (p) => p.category === "finishing" && p.serviceName.toLowerCase().includes(option.toLowerCase())
        );
        if (finishingPrice) {
          const total = parseFloat(finishingPrice.basePrice) * values.quantity;
          subtotal += total;
          breakdown.push({
            service: option.charAt(0).toUpperCase() + option.slice(1),
            quantity: values.quantity,
            unitPrice: parseFloat(finishingPrice.basePrice),
            total,
          });
        }
      });
    } else if (values.serviceType === "largeformat") {
      const largeFormatPrice = priceLists.find(
        (p) => p.category === "largeformat" && p.serviceName === values.serviceName
      );
      if (largeFormatPrice && values.customWidth && values.customHeight) {
        const sqft = (values.customWidth * values.customHeight);
        const total = parseFloat(largeFormatPrice.basePrice) * sqft * values.quantity;
        subtotal += total;
        breakdown.push({
          service: values.serviceName || "Large Format",
          quantity: `${values.customWidth}×${values.customHeight} sqft × ${values.quantity}`,
          unitPrice: parseFloat(largeFormatPrice.basePrice),
          total,
        });
      }
    } else if (values.serviceType === "products") {
      const productPrice = priceLists.find(
        (p) => p.category === "products" && p.serviceName === values.serviceName
      );
      if (productPrice) {
        const total = parseFloat(productPrice.basePrice) * values.quantity;
        subtotal += total;
        breakdown.push({
          service: values.serviceName || "Product",
          quantity: values.quantity,
          unitPrice: parseFloat(productPrice.basePrice),
          total,
        });
      }
    }

    const tax = subtotal * 0.1;
    const total = subtotal + tax;

    return { subtotal, tax, total, breakdown };
  };

  const watchedValues = form.watch();
  const priceCalculation = calculatePrice(watchedValues);

  const createOrderMutation = useMutation({
    mutationFn: async (data: JobFormValues) => {
      return apiRequest("POST", "/api/orders", {
        serviceType: data.serviceType,
        serviceName: data.serviceName || null,
        paperSize: data.paperSize || null,
        quantity: data.quantity,
        printType: data.printType || null,
        customWidth: data.customWidth?.toString() || null,
        customHeight: data.customHeight?.toString() || null,
        finishingOptions: data.finishingOptions,
        additionalSpecs: data.additionalSpecs || "",
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Order Created",
        description: `Job #${data.jobNumber} has been created successfully.`,
      });
      setLocation(`/receipt/${data.id}`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create order. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: JobFormValues) => {
    createOrderMutation.mutate(data);
  };

  const handleFinishingChange = (optionId: string, checked: boolean) => {
    const updated = checked
      ? [...selectedFinishing, optionId]
      : selectedFinishing.filter((id) => id !== optionId);
    setSelectedFinishing(updated);
    form.setValue("finishingOptions", updated);
  };

  if (isPriceListsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">New Print Job</CardTitle>
            <CardDescription>
              Enter job details to calculate pricing and generate a receipt
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="serviceType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-service-type">
                            <SelectValue placeholder="Select service type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {serviceTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {serviceType === "printing" && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="paperSize"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Paper Size</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-paper-size">
                                  <SelectValue placeholder="Select paper size" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {paperSizes.map((size) => (
                                  <SelectItem key={size.value} value={size.value}>
                                    {size.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="quantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantity</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                placeholder="Enter quantity"
                                data-testid="input-quantity"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="printType"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>Print Type</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex gap-6"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="color" id="color" data-testid="radio-color" />
                                <Label htmlFor="color" className="cursor-pointer">Color Printing</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="mono" id="mono" data-testid="radio-mono" />
                                <Label htmlFor="mono" className="cursor-pointer">Monochrome Printing</Label>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-3">
                      <Label>Finishing Options</Label>
                      <div className="grid grid-cols-2 gap-4">
                        {finishingOptions.map((option) => (
                          <div key={option.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={option.id}
                              checked={selectedFinishing.includes(option.id)}
                              onCheckedChange={(checked) =>
                                handleFinishingChange(option.id, checked as boolean)
                              }
                              data-testid={`checkbox-${option.id}`}
                            />
                            <Label htmlFor={option.id} className="cursor-pointer font-normal">
                              {option.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {serviceType === "largeformat" && (
                  <>
                    <FormField
                      control={form.control}
                      name="serviceName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Service</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-large-format-service">
                                <SelectValue placeholder="Select service" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {largeFormatServices.map((service) => (
                                <SelectItem key={service.value} value={service.value}>
                                  {service.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <FormField
                        control={form.control}
                        name="customWidth"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Width (sqft)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.1"
                                min="0"
                                placeholder="Enter width"
                                data-testid="input-custom-width"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="customHeight"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Height (sqft)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.1"
                                min="0"
                                placeholder="Enter height"
                                data-testid="input-custom-height"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="quantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantity</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                placeholder="Enter quantity"
                                data-testid="input-quantity-large"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </>
                )}

                {serviceType === "products" && (
                  <>
                    <FormField
                      control={form.control}
                      name="serviceName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Product</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-product-service">
                                <SelectValue placeholder="Select product" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {productServices.map((service) => (
                                <SelectItem key={service.value} value={service.value}>
                                  {service.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantity</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              placeholder="Enter quantity"
                              data-testid="input-quantity-product"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                <FormField
                  control={form.control}
                  name="additionalSpecs"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Specifications</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter any special requirements or notes"
                          className="resize-none"
                          rows={4}
                          data-testid="textarea-specs"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={createOrderMutation.isPending}
                  data-testid="button-submit-job"
                >
                  {createOrderMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Order...
                    </>
                  ) : (
                    "Generate Receipt"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-1">
        <Card className="sticky top-6">
          <CardHeader>
            <CardTitle className="text-xl">Price Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {priceCalculation.breakdown.length > 0 ? (
              <>
                <div className="space-y-2">
                  {priceCalculation.breakdown.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {item.service} ({item.quantity})
                      </span>
                      <span className="font-medium" data-testid={`price-${item.service.toLowerCase().replace(/\s+/g, '-')}`}>
                        ₦{item.total.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium" data-testid="text-subtotal">
                      ₦{priceCalculation.subtotal.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">VAT (10%)</span>
                    <span className="font-medium" data-testid="text-tax">
                      ₦{priceCalculation.tax.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total</span>
                  <span className="text-2xl font-bold text-primary" data-testid="text-total">
                    ₦{priceCalculation.total.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>Fill in the job details to see pricing</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
