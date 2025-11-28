import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertPriceListSchema, 
  insertOrderSchema,
  insertCustomerSchema,
  insertSalesSchema,
  insertDepositSchema,
  insertGoodwillSchema,
  insertExpenseSchema
} from "@shared/schema";
import { z } from "zod";
import PDFDocument from "pdfkit";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.get("/api/price-lists", async (req, res) => {
    try {
      const priceLists = await storage.getPriceLists();
      res.json(priceLists);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch price lists" });
    }
  });

  app.get("/api/price-lists/:id", async (req, res) => {
    try {
      const priceList = await storage.getPriceList(req.params.id);
      if (!priceList) {
        return res.status(404).json({ error: "Price list not found" });
      }
      res.json(priceList);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch price list" });
    }
  });

  app.post("/api/price-lists", async (req, res) => {
    try {
      const validatedData = insertPriceListSchema.parse(req.body);
      const priceList = await storage.createPriceList(validatedData);
      res.status(201).json(priceList);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create price list" });
    }
  });

  app.put("/api/price-lists/:id", async (req, res) => {
    try {
      const validatedData = insertPriceListSchema.partial().parse(req.body);
      const priceList = await storage.updatePriceList(req.params.id, validatedData);
      if (!priceList) {
        return res.status(404).json({ error: "Price list not found" });
      }
      res.json(priceList);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update price list" });
    }
  });

  app.delete("/api/price-lists/:id", async (req, res) => {
    try {
      await storage.deletePriceList(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete price list" });
    }
  });

  app.get("/api/orders", async (req, res) => {
    try {
      const ordersList = await storage.getOrders();
      res.json(ordersList);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  app.get("/api/orders/:id", async (req, res) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch order" });
    }
  });

  app.post("/api/orders", async (req, res) => {
    try {
      const validatedData = insertOrderSchema.parse(req.body);
      const priceLists = await storage.getPriceLists();
      const breakdown: Array<{ service: string; quantity: number; unitPrice: number; total: number }> = [];

      let subtotal = 0;

      const paperSizePrice = priceLists.find(
        (p) => p.category === "paper" && p.serviceName.toLowerCase().includes(validatedData.paperSize.toLowerCase())
      );
      if (paperSizePrice) {
        const itemTotal = parseFloat(paperSizePrice.basePrice) * validatedData.quantity;
        subtotal += itemTotal;
        breakdown.push({
          service: `${validatedData.paperSize} Paper`,
          quantity: validatedData.quantity,
          unitPrice: parseFloat(paperSizePrice.basePrice),
          total: itemTotal,
        });
      }

      const printTypePrice = priceLists.find(
        (p) => p.category === "printing" && p.serviceName.toLowerCase().includes(validatedData.printType)
      );
      if (printTypePrice) {
        const itemTotal = parseFloat(printTypePrice.basePrice) * validatedData.quantity;
        subtotal += itemTotal;
        breakdown.push({
          service: `${validatedData.printType === "color" ? "Color" : "Mono"} Printing`,
          quantity: validatedData.quantity,
          unitPrice: parseFloat(printTypePrice.basePrice),
          total: itemTotal,
        });
      }

      if (validatedData.finishingOptions) {
        for (const option of validatedData.finishingOptions) {
          const finishingPrice = priceLists.find(
            (p) => p.category === "finishing" && p.serviceName.toLowerCase().includes(option.toLowerCase())
          );
          if (finishingPrice) {
            const itemTotal = parseFloat(finishingPrice.basePrice) * validatedData.quantity;
            subtotal += itemTotal;
            breakdown.push({
              service: option.charAt(0).toUpperCase() + option.slice(1),
              quantity: validatedData.quantity,
              unitPrice: parseFloat(finishingPrice.basePrice),
              total: itemTotal,
            });
          }
        }
      }

      const TAX_RATE = 0.1;
      const tax = subtotal * TAX_RATE;
      const total = subtotal + tax;

      const order = await storage.createOrder({
        ...validatedData,
        subtotal: subtotal.toFixed(2),
        tax: tax.toFixed(2),
        total: total.toFixed(2),
      });

      const receiptNumber = `RCP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const receipt = await storage.createReceipt({
        receiptNumber,
        orderId: order.id,
        itemizedBreakdown: JSON.stringify(breakdown),
        subtotal: order.subtotal,
        tax: order.tax,
        total: order.total,
      });

      res.status(201).json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Order creation error:", error);
      res.status(500).json({ error: "Failed to create order" });
    }
  });

  app.get("/api/receipts/:orderId", async (req, res) => {
    try {
      const receipt = await storage.getReceipt(req.params.orderId);
      if (!receipt) {
        return res.status(404).json({ error: "Receipt not found" });
      }
      res.json(receipt);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch receipt" });
    }
  });

  app.get("/api/receipts/:orderId/pdf", async (req, res) => {
    try {
      const order = await storage.getOrder(req.params.orderId);
      const receipt = await storage.getReceipt(req.params.orderId);
      
      if (!order || !receipt) {
        return res.status(404).json({ error: "Receipt not found" });
      }

      const breakdown = JSON.parse(receipt.itemizedBreakdown);
      
      const doc = new PDFDocument({ margin: 50 });
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=Receipt-${receipt.receiptNumber}.pdf`);
      
      doc.pipe(res);

      doc.fontSize(24).text('PrintPress Pro', { align: 'center' });
      doc.fontSize(12).text('Professional Printing Services', { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).text('123 Print Street', { align: 'center' });
      doc.text('Business District, City 12345', { align: 'center' });
      doc.text('contact@printpress.com | (555) 123-4567', { align: 'center' });
      doc.moveDown(2);

      doc.fontSize(20).text('RECEIPT', { align: 'center' });
      doc.moveDown();

      doc.fontSize(10);
      doc.text(`Receipt #: ${receipt.receiptNumber}`, { align: 'right' });
      doc.text(`Job #: ${order.jobNumber}`, { align: 'right' });
      doc.text(`Date: ${new Date(receipt.createdAt).toLocaleDateString()}`, { align: 'right' });
      doc.moveDown(2);

      doc.fontSize(14).text('Job Details', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10);
      doc.text(`Paper Size: ${order.paperSize}`);
      doc.text(`Quantity: ${order.quantity}`);
      doc.text(`Print Type: ${order.printType === 'color' ? 'Color Printing' : 'Monochrome Printing'}`);
      if (order.finishingOptions && order.finishingOptions.length > 0) {
        doc.text(`Finishing Options: ${order.finishingOptions.join(', ')}`);
      }
      if (order.additionalSpecs) {
        doc.text(`Additional Specs: ${order.additionalSpecs}`);
      }
      doc.moveDown(2);

      doc.fontSize(14).text('Itemized Breakdown', { underline: true });
      doc.moveDown(0.5);
      
      const tableTop = doc.y;
      const col1 = 50;
      const col2 = 250;
      const col3 = 350;
      const col4 = 450;
      
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('Service', col1, tableTop);
      doc.text('Quantity', col2, tableTop);
      doc.text('Unit Price', col3, tableTop);
      doc.text('Total', col4, tableTop);
      
      doc.font('Helvetica');
      let yPosition = tableTop + 20;
      
      breakdown.forEach((item: any) => {
        doc.text(item.service, col1, yPosition);
        doc.text(item.quantity.toString(), col2, yPosition);
        doc.text(`₦${item.unitPrice.toFixed(2)}`, col3, yPosition);
        doc.text(`₦${item.total.toFixed(2)}`, col4, yPosition);
        yPosition += 20;
      });
      
      doc.moveDown(2);
      yPosition = doc.y;
      
      doc.text(`Subtotal:`, 350, yPosition);
      doc.text(`₦${parseFloat(receipt.subtotal).toFixed(2)}`, 450, yPosition, { align: 'right', width: 100 });
      yPosition += 20;
      
      doc.text(`Tax (10%):`, 350, yPosition);
      doc.text(`₦${parseFloat(receipt.tax).toFixed(2)}`, 450, yPosition, { align: 'right', width: 100 });
      yPosition += 20;
      
      doc.fontSize(12).font('Helvetica-Bold');
      doc.text(`Grand Total:`, 350, yPosition);
      doc.text(`₦${parseFloat(receipt.total).toFixed(2)}`, 450, yPosition, { align: 'right', width: 100 });
      
      doc.moveDown(3);
      doc.fontSize(10).font('Helvetica');
      doc.text('Thank you for your business!', { align: 'center' });
      doc.text('For any questions, please contact us at contact@printpress.com', { align: 'center' });
      
      doc.end();
    } catch (error) {
      console.error("PDF generation error:", error);
      res.status(500).json({ error: "Failed to generate PDF" });
    }
  });

  // CUSTOMERS
  app.get("/api/customers", async (req, res) => {
    try {
      const customersList = await storage.getCustomers();
      res.json(customersList);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch customers" });
    }
  });

  app.post("/api/customers", async (req, res) => {
    try {
      const validatedData = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(validatedData);
      res.status(201).json(customer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create customer" });
    }
  });

  app.put("/api/customers/:id", async (req, res) => {
    try {
      const validatedData = insertCustomerSchema.partial().parse(req.body);
      const customer = await storage.updateCustomer(req.params.id, validatedData);
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update customer" });
    }
  });

  app.delete("/api/customers/:id", async (req, res) => {
    try {
      await storage.deleteCustomer(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete customer" });
    }
  });

  // SALES
  app.get("/api/sales", async (req, res) => {
    try {
      const salesList = await storage.getSales();
      res.json(salesList);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch sales" });
    }
  });

  app.post("/api/sales", async (req, res) => {
    try {
      const validatedData = insertSalesSchema.parse(req.body);
      const sale = await storage.createSale(validatedData);
      res.status(201).json(sale);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create sale" });
    }
  });

  // DEPOSITS
  app.get("/api/deposits", async (req, res) => {
    try {
      const depositsList = await storage.getDeposits();
      res.json(depositsList);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch deposits" });
    }
  });

  app.post("/api/deposits", async (req, res) => {
    try {
      const validatedData = insertDepositSchema.parse(req.body);
      const deposit = await storage.createDeposit(validatedData);
      res.status(201).json(deposit);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create deposit" });
    }
  });

  // GOODWILL
  app.get("/api/goodwill", async (req, res) => {
    try {
      const goodwillList = await storage.getGoodwill();
      res.json(goodwillList);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch goodwill" });
    }
  });

  app.post("/api/goodwill", async (req, res) => {
    try {
      const validatedData = insertGoodwillSchema.parse(req.body);
      const goodwill = await storage.createGoodwill(validatedData);
      res.status(201).json(goodwill);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create goodwill" });
    }
  });

  // EXPENSES
  app.get("/api/expenses", async (req, res) => {
    try {
      const expensesList = await storage.getExpenses();
      res.json(expensesList);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch expenses" });
    }
  });

  app.post("/api/expenses", async (req, res) => {
    try {
      const validatedData = insertExpenseSchema.parse(req.body);
      const expense = await storage.createExpense(validatedData);
      res.status(201).json(expense);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create expense" });
    }
  });

  // REPORTS
  app.get("/api/reports/weekly", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      const report = await storage.getWeeklyReport(start, end);
      res.json(report);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch weekly report" });
    }
  });

  app.get("/api/reports/monthly", async (req, res) => {
    try {
      const { year, month } = req.query;
      const report = await storage.getMonthlyReport(parseInt(year as string), parseInt(month as string));
      res.json(report);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch monthly report" });
    }
  });

  app.get("/api/reports/pdf/weekly", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      const report = await storage.getWeeklyReport(start, end);
      
      const doc = new PDFDocument();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=weekly-report.pdf');
      doc.pipe(res);
      
      doc.fontSize(20).text('Weekly Income & Expense Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Period: ${start.toLocaleDateString()} - ${end.toLocaleDateString()}`, { align: 'center' });
      doc.moveDown(2);
      
      doc.fontSize(14).text('Income Summary:', { underline: true });
      doc.fontSize(11).text(`Total Income: ₦${report.totalIncome.toFixed(2)}`);
      doc.moveDown();
      
      doc.fontSize(14).text('Expense Summary:', { underline: true });
      doc.fontSize(11).text(`Total Expenses: ₦${report.totalExpenses.toFixed(2)}`);
      doc.moveDown(2);
      
      doc.fontSize(14).text('Net Income:', { underline: true });
      doc.fontSize(12).font('Helvetica-Bold').text(`₦${report.netIncome.toFixed(2)}`);
      
      doc.end();
    } catch (error) {
      res.status(500).json({ error: "Failed to generate weekly report PDF" });
    }
  });

  app.get("/api/reports/pdf/monthly", async (req, res) => {
    try {
      const { year, month } = req.query;
      const report = await storage.getMonthlyReport(parseInt(year as string), parseInt(month as string));
      
      const doc = new PDFDocument();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=monthly-report-${year}-${month}.pdf`);
      doc.pipe(res);
      
      const monthName = new Date(parseInt(year as string), parseInt(month as string) - 1).toLocaleString('default', { month: 'long' });
      doc.fontSize(20).text('Monthly Income & Expense Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`${monthName} ${year}`, { align: 'center' });
      doc.moveDown(2);
      
      doc.fontSize(14).text('Income Summary:', { underline: true });
      doc.fontSize(11).text(`Total Income: ₦${report.totalIncome.toFixed(2)}`);
      doc.moveDown();
      
      doc.fontSize(14).text('Expense Summary:', { underline: true });
      doc.fontSize(11).text(`Total Expenses: ₦${report.totalExpenses.toFixed(2)}`);
      doc.moveDown(2);
      
      doc.fontSize(14).text('Net Income:', { underline: true });
      doc.fontSize(12).font('Helvetica-Bold').text(`₦${report.netIncome.toFixed(2)}`);
      
      doc.end();
    } catch (error) {
      res.status(500).json({ error: "Failed to generate monthly report PDF" });
    }
  });

  return httpServer;
}
