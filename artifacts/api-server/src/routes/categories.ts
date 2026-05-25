import { Router } from "express";
import { db, productsTable } from "@workspace/db";
import { sql } from "drizzle-orm";

const router = Router();

// GET /categories
router.get("/categories", async (_req, res) => {
  try {
    const categories = await db
      .select({
        name: productsTable.category,
        nameAr: sql<string | null>`max(${productsTable.categoryAr})`,
        productCount: sql<number>`count(*)::int`,
      })
      .from(productsTable)
      .groupBy(productsTable.category)
      .orderBy(productsTable.category);

    return res.json(categories);
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
