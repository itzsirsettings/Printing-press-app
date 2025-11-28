import { db } from "./server/db";
import { priceLists } from "./shared/schema";
import { sql } from "drizzle-orm";

const seedData = [
  // Paper sizes
  { serviceName: "A4", category: "paper", basePrice: "0.50", unit: "sheet" },
  { serviceName: "A3", category: "paper", basePrice: "1.00", unit: "sheet" },
  { serviceName: "A5", category: "paper", basePrice: "0.35", unit: "sheet" },
  { serviceName: "Letter", category: "paper", basePrice: "0.45", unit: "sheet" },
  { serviceName: "Legal", category: "paper", basePrice: "0.55", unit: "sheet" },
  { serviceName: "Tabloid", category: "paper", basePrice: "1.50", unit: "sheet" },
  
  // Print types
  { serviceName: "Color", category: "printing", basePrice: "0.15", unit: "page" },
  { serviceName: "Mono", category: "printing", basePrice: "0.05", unit: "page" },
  
  // Finishing options
  { serviceName: "Binding", category: "finishing", basePrice: "2.00", unit: "job" },
  { serviceName: "Lamination", category: "finishing", basePrice: "1.50", unit: "job" },
  { serviceName: "Cutting", category: "finishing", basePrice: "1.00", unit: "job" },
  { serviceName: "Folding", category: "finishing", basePrice: "0.75", unit: "job" },
  { serviceName: "Stapling", category: "finishing", basePrice: "0.50", unit: "job" },
  { serviceName: "Punching", category: "finishing", basePrice: "0.75", unit: "job" },
];

async function seed() {
  try {
    // Clear existing data
    await db.delete(priceLists);
    console.log("🗑️  Cleared existing price lists");
    
    // Insert fresh data
    for (const item of seedData) {
      await db.insert(priceLists).values(item);
      console.log(`✓ Added: ${item.serviceName} (${item.category})`);
    }
    console.log(`\n✅ Seed complete! Added ${seedData.length} items.`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  }
}

seed();
