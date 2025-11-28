import {
  priceLists,
  orders,
  receipts,
  customers,
  sales,
  deposits,
  goodwillTransactions,
  expenses,
  type PriceList,
  type InsertPriceList,
  type Order,
  type InsertOrder,
  type Receipt,
  type InsertReceipt,
  type Customer,
  type InsertCustomer,
  type Sales,
  type InsertSales,
  type Deposit,
  type InsertDeposit,
  type GoodwillTransaction,
  type InsertGoodwill,
  type Expense,
  type InsertExpense,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getPriceLists(): Promise<PriceList[]>;
  getPriceList(id: string): Promise<PriceList | undefined>;
  createPriceList(priceList: InsertPriceList): Promise<PriceList>;
  updatePriceList(id: string, priceList: Partial<InsertPriceList>): Promise<PriceList | undefined>;
  deletePriceList(id: string): Promise<void>;
  
  getOrders(): Promise<Order[]>;
  getOrder(id: string): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  
  getReceipt(orderId: string): Promise<Receipt | undefined>;
  createReceipt(receipt: InsertReceipt): Promise<Receipt>;

  getCustomers(): Promise<Customer[]>;
  getCustomer(id: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;
  deleteCustomer(id: string): Promise<void>;

  getSales(): Promise<Sales[]>;
  createSale(sale: InsertSales): Promise<Sales>;

  getDeposits(): Promise<Deposit[]>;
  getCustomerDeposits(customerId: string): Promise<Deposit[]>;
  createDeposit(deposit: InsertDeposit): Promise<Deposit>;

  getGoodwill(): Promise<GoodwillTransaction[]>;
  getCustomerGoodwill(customerId: string): Promise<GoodwillTransaction[]>;
  createGoodwill(goodwill: InsertGoodwill): Promise<GoodwillTransaction>;

  getExpenses(): Promise<Expense[]>;
  createExpense(expense: InsertExpense): Promise<Expense>;
}

export class DatabaseStorage implements IStorage {
  async getPriceLists(): Promise<PriceList[]> {
    return await db.select().from(priceLists).orderBy(priceLists.category, priceLists.serviceName);
  }

  async getPriceList(id: string): Promise<PriceList | undefined> {
    const [priceList] = await db.select().from(priceLists).where(eq(priceLists.id, id));
    return priceList || undefined;
  }

  async createPriceList(priceList: InsertPriceList): Promise<PriceList> {
    const [created] = await db
      .insert(priceLists)
      .values(priceList)
      .returning();
    return created;
  }

  async updatePriceList(id: string, priceList: Partial<InsertPriceList>): Promise<PriceList | undefined> {
    const [updated] = await db
      .update(priceLists)
      .set(priceList)
      .where(eq(priceLists.id, id))
      .returning();
    return updated || undefined;
  }

  async deletePriceList(id: string): Promise<void> {
    await db.delete(priceLists).where(eq(priceLists.id, id));
  }

  async getOrders(): Promise<Order[]> {
    return await db.select().from(orders).orderBy(desc(orders.createdAt));
  }

  async getOrder(id: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order || undefined;
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const jobNumber = `JOB-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const [created] = await db
      .insert(orders)
      .values({ ...order, jobNumber })
      .returning();
    return created;
  }

  async getReceipt(orderId: string): Promise<Receipt | undefined> {
    const [receipt] = await db.select().from(receipts).where(eq(receipts.orderId, orderId));
    return receipt || undefined;
  }

  async createReceipt(receipt: InsertReceipt): Promise<Receipt> {
    const [created] = await db
      .insert(receipts)
      .values(receipt)
      .returning();
    return created;
  }

  async getCustomers(): Promise<Customer[]> {
    return await db.select().from(customers).orderBy(desc(customers.createdAt));
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer || undefined;
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const [created] = await db
      .insert(customers)
      .values(customer)
      .returning();
    return created;
  }

  async updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const [updated] = await db
      .update(customers)
      .set(customer)
      .where(eq(customers.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteCustomer(id: string): Promise<void> {
    await db.delete(customers).where(eq(customers.id, id));
  }

  async getSales(): Promise<Sales[]> {
    return await db.select().from(sales).orderBy(desc(sales.createdAt));
  }

  async createSale(sale: InsertSales): Promise<Sales> {
    const saleNumber = `SALE-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const [created] = await db
      .insert(sales)
      .values({ ...sale, saleNumber })
      .returning();
    return created;
  }

  async getDeposits(): Promise<Deposit[]> {
    return await db.select().from(deposits).orderBy(desc(deposits.createdAt));
  }

  async getCustomerDeposits(customerId: string): Promise<Deposit[]> {
    return await db.select().from(deposits).where(eq(deposits.customerId, customerId));
  }

  async createDeposit(deposit: InsertDeposit): Promise<Deposit> {
    const [created] = await db
      .insert(deposits)
      .values(deposit)
      .returning();
    if (created.customerId) {
      await this.updateCustomer(created.customerId, {
        totalDeposits: (await this.getCustomer(created.customerId))?.totalDeposits || "0",
      });
    }
    return created;
  }

  async getGoodwill(): Promise<GoodwillTransaction[]> {
    return await db.select().from(goodwillTransactions).orderBy(desc(goodwillTransactions.createdAt));
  }

  async getCustomerGoodwill(customerId: string): Promise<GoodwillTransaction[]> {
    return await db.select().from(goodwillTransactions).where(eq(goodwillTransactions.customerId, customerId));
  }

  async createGoodwill(goodwill: InsertGoodwill): Promise<GoodwillTransaction> {
    const [created] = await db
      .insert(goodwillTransactions)
      .values(goodwill)
      .returning();
    return created;
  }

  async getExpenses(): Promise<Expense[]> {
    return await db.select().from(expenses).orderBy(desc(expenses.createdAt));
  }

  async createExpense(expense: InsertExpense): Promise<Expense> {
    const [created] = await db
      .insert(expenses)
      .values(expense)
      .returning();
    return created;
  }

  async getWeeklyReport(startDate: Date, endDate: Date) {
    const weekOrders = await db.select().from(orders).where(
      expr => expr.and(expr.gte(orders.createdAt, startDate), expr.lte(orders.createdAt, endDate))
    );
    const weekSales = await db.select().from(sales).where(
      expr => expr.and(expr.gte(sales.createdAt, startDate), expr.lte(sales.createdAt, endDate))
    );
    const weekExpenses = await db.select().from(expenses).where(
      expr => expr.and(expr.gte(expenses.createdAt, startDate), expr.lte(expenses.createdAt, endDate))
    );
    
    const totalIncome = [
      ...weekOrders.map(o => parseFloat(o.total)),
      ...weekSales.map(s => parseFloat(s.total))
    ].reduce((a, b) => a + b, 0);
    
    const totalExpenses = weekExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const netIncome = totalIncome - totalExpenses;
    
    return { totalIncome, totalExpenses, netIncome, startDate, endDate };
  }

  async getMonthlyReport(year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    return this.getWeeklyReport(startDate, endDate);
  }
}

export const storage = new DatabaseStorage();
