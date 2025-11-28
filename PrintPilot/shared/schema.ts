import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const priceLists = pgTable("price_lists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serviceName: text("service_name").notNull(),
  category: text("category").notNull(),
  basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(),
  unit: text("unit").notNull(),
  isActive: boolean("is_active").notNull().default(true),
});

export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobNumber: text("job_number").notNull().unique(),
  serviceType: text("service_type").notNull().default("printing"),
  serviceName: text("service_name"),
  paperSize: text("paper_size"),
  quantity: integer("quantity").notNull(),
  printType: text("print_type"),
  customWidth: decimal("custom_width", { precision: 10, scale: 2 }),
  customHeight: decimal("custom_height", { precision: 10, scale: 2 }),
  finishingOptions: text("finishing_options").array(),
  additionalSpecs: text("additional_specs"),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  tax: decimal("tax", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text("payment_method"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const receipts = pgTable("receipts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  receiptNumber: text("receipt_number").notNull().unique(),
  orderId: varchar("order_id").notNull().references(() => orders.id),
  itemizedBreakdown: text("itemized_breakdown").notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  tax: decimal("tax", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  company: text("company"),
  address: text("address"),
  balance: decimal("balance", { precision: 10, scale: 2 }).notNull().default("0"),
  totalDeposits: decimal("total_deposits", { precision: 10, scale: 2 }).notNull().default("0"),
  goodwill: decimal("goodwill", { precision: 10, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const sales = pgTable("sales", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  saleNumber: text("sale_number").notNull().unique(),
  paperType: text("paper_type").notNull(),
  paperVariant: text("paper_variant").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text("payment_method"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const deposits = pgTable("deposits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull().references(() => customers.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  paymentMethod: text("payment_method"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const goodwillTransactions = pgTable("goodwill_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull().references(() => customers.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  reason: text("reason").notNull(),
  type: text("type").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const expenses = pgTable("expenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  category: text("category").notNull(),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text("payment_method").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertPriceListSchema = createInsertSchema(priceLists).omit({
  id: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  jobNumber: true,
  subtotal: true,
  tax: true,
  total: true,
  createdAt: true,
});

export const insertReceiptSchema = createInsertSchema(receipts).omit({
  id: true,
  createdAt: true,
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
});

export const insertSalesSchema = createInsertSchema(sales).omit({
  id: true,
  saleNumber: true,
  createdAt: true,
});

export const insertDepositSchema = createInsertSchema(deposits).omit({
  id: true,
  createdAt: true,
});

export const insertGoodwillSchema = createInsertSchema(goodwillTransactions).omit({
  id: true,
  createdAt: true,
});

export const insertExpenseSchema = createInsertSchema(expenses).omit({
  id: true,
  createdAt: true,
});

export type PriceList = typeof priceLists.$inferSelect;
export type InsertPriceList = z.infer<typeof insertPriceListSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type Receipt = typeof receipts.$inferSelect;
export type InsertReceipt = z.infer<typeof insertReceiptSchema>;

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;

export type Sales = typeof sales.$inferSelect;
export type InsertSales = z.infer<typeof insertSalesSchema>;

export type Deposit = typeof deposits.$inferSelect;
export type InsertDeposit = z.infer<typeof insertDepositSchema>;

export type GoodwillTransaction = typeof goodwillTransactions.$inferSelect;
export type InsertGoodwill = z.infer<typeof insertGoodwillSchema>;

export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
