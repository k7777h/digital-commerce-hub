import { Router } from "express";
import { db, productsTable } from "@workspace/db";
import { eq, ilike, and, gte, lte, asc, desc, sql } from "drizzle-orm";
import {
  ListProductsQueryParams,
  CreateProductBody,
  UpdateProductParams,
  UpdateProductBody,
  DeleteProductParams,
  GetProductParams,
  PurchaseProductParams,
  PurchaseProductBody,
} from "@workspace/api-zod";

const router = Router();

// GET /products
router.get("/products", async (req, res) => {
  try {
    const query = ListProductsQueryParams.safeParse(req.query);
    if (!query.success) {
      return res.status(400).json({ error: "Invalid query parameters" });
    }

    const { category, search, inStock, minPrice, maxPrice, sortBy, sortOrder } = query.data;

    const conditions = [];

    if (category) {
      conditions.push(eq(productsTable.category, category));
    }
    if (search) {
      conditions.push(ilike(productsTable.name, `%${search}%`));
    }
    if (inStock === true) {
      conditions.push(gte(productsTable.stock, 1));
    } else if (inStock === false) {
      conditions.push(eq(productsTable.stock, 0));
    }
    if (minPrice !== undefined) {
      conditions.push(gte(productsTable.price, String(minPrice)));
    }
    if (maxPrice !== undefined) {
      conditions.push(lte(productsTable.price, String(maxPrice)));
    }

    const sortColumn =
      sortBy === "price"
        ? productsTable.price
        : sortBy === "stock"
          ? productsTable.stock
          : sortBy === "name"
            ? productsTable.name
            : productsTable.createdAt;

    const orderFn = sortOrder === "asc" ? asc : desc;

    const products = await db
      .select()
      .from(productsTable)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(orderFn(sortColumn));

    return res.json(
      products.map((p) => ({
        ...p,
        price: Number(p.price),
        createdAt: p.createdAt.toISOString(),
        nameAr: p.nameAr ?? null,
        descriptionAr: p.descriptionAr ?? null,
        categoryAr: p.categoryAr ?? null,
      }))
    );
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /products
router.post("/products", async (req, res) => {
  try {
    const body = CreateProductBody.safeParse(req.body);
    if (!body.success) {
      return res.status(400).json({ error: body.error.message });
    }

    const [product] = await db
      .insert(productsTable)
      .values({
        name: body.data.name,
        nameAr: body.data.nameAr ?? null,
        description: body.data.description,
        descriptionAr: body.data.descriptionAr ?? null,
        price: String(body.data.price),
        stock: body.data.stock,
        category: body.data.category,
        categoryAr: body.data.categoryAr ?? null,
        imageUrl: body.data.imageUrl ?? null,
      })
      .returning();

    return res.status(201).json({
      ...product,
      price: Number(product.price),
      createdAt: product.createdAt.toISOString(),
      nameAr: product.nameAr ?? null,
      descriptionAr: product.descriptionAr ?? null,
      categoryAr: product.categoryAr ?? null,
    });
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /products/stats
router.get("/products/stats", async (_req, res) => {
  try {
    const [stats] = await db
      .select({
        totalProducts: sql<number>`count(*)::int`,
        totalCategories: sql<number>`count(distinct ${productsTable.category})::int`,
        totalValue: sql<number>`coalesce(sum(${productsTable.price} * ${productsTable.stock}), 0)::numeric`,
        inStockCount: sql<number>`count(*) filter (where ${productsTable.stock} > 0)::int`,
        outOfStockCount: sql<number>`count(*) filter (where ${productsTable.stock} = 0)::int`,
        lowStockCount: sql<number>`count(*) filter (where ${productsTable.stock} > 0 and ${productsTable.stock} <= 5)::int`,
      })
      .from(productsTable);

    return res.json({
      totalProducts: stats.totalProducts,
      totalCategories: stats.totalCategories,
      totalValue: Number(stats.totalValue),
      inStockCount: stats.inStockCount,
      outOfStockCount: stats.outOfStockCount,
      lowStockCount: stats.lowStockCount,
    });
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /products/:id
router.get("/products/:id", async (req, res) => {
  try {
    const params = GetProductParams.safeParse({ id: Number(req.params.id) });
    if (!params.success) {
      return res.status(400).json({ error: "Invalid product ID" });
    }

    const [product] = await db
      .select()
      .from(productsTable)
      .where(eq(productsTable.id, params.data.id));

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    return res.json({
      ...product,
      price: Number(product.price),
      createdAt: product.createdAt.toISOString(),
      nameAr: product.nameAr ?? null,
      descriptionAr: product.descriptionAr ?? null,
      categoryAr: product.categoryAr ?? null,
    });
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /products/:id
router.patch("/products/:id", async (req, res) => {
  try {
    const params = UpdateProductParams.safeParse({ id: Number(req.params.id) });
    const body = UpdateProductBody.safeParse(req.body);

    if (!params.success || !body.success) {
      return res.status(400).json({ error: "Invalid request" });
    }

    const updates: Record<string, unknown> = {};
    if (body.data.name !== undefined) updates.name = body.data.name;
    if (body.data.nameAr !== undefined) updates.nameAr = body.data.nameAr;
    if (body.data.description !== undefined) updates.description = body.data.description;
    if (body.data.descriptionAr !== undefined) updates.descriptionAr = body.data.descriptionAr;
    if (body.data.price !== undefined) updates.price = String(body.data.price);
    if (body.data.stock !== undefined) updates.stock = body.data.stock;
    if (body.data.category !== undefined) updates.category = body.data.category;
    if (body.data.categoryAr !== undefined) updates.categoryAr = body.data.categoryAr;
    if (body.data.imageUrl !== undefined) updates.imageUrl = body.data.imageUrl;

    if (Object.keys(updates).length === 0) {
      const [existing] = await db
        .select()
        .from(productsTable)
        .where(eq(productsTable.id, params.data.id));
      if (!existing) return res.status(404).json({ error: "Product not found" });
      return res.json({ ...existing, price: Number(existing.price), createdAt: existing.createdAt.toISOString(), nameAr: existing.nameAr ?? null, descriptionAr: existing.descriptionAr ?? null, categoryAr: existing.categoryAr ?? null });
    }

    const [product] = await db
      .update(productsTable)
      .set(updates)
      .where(eq(productsTable.id, params.data.id))
      .returning();

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    return res.json({
      ...product,
      price: Number(product.price),
      createdAt: product.createdAt.toISOString(),
      nameAr: product.nameAr ?? null,
      descriptionAr: product.descriptionAr ?? null,
      categoryAr: product.categoryAr ?? null,
    });
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /products/:id
router.delete("/products/:id", async (req, res) => {
  try {
    const params = DeleteProductParams.safeParse({ id: Number(req.params.id) });
    if (!params.success) {
      return res.status(400).json({ error: "Invalid product ID" });
    }

    const [deleted] = await db
      .delete(productsTable)
      .where(eq(productsTable.id, params.data.id))
      .returning();

    if (!deleted) {
      return res.status(404).json({ error: "Product not found" });
    }

    return res.status(204).send();
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /products/:id/purchase
router.post("/products/:id/purchase", async (req, res) => {
  try {
    const params = PurchaseProductParams.safeParse({ id: Number(req.params.id) });
    const body = PurchaseProductBody.safeParse(req.body);

    if (!params.success || !body.success) {
      return res.status(400).json({ error: "Invalid request" });
    }

    const [existing] = await db
      .select()
      .from(productsTable)
      .where(eq(productsTable.id, params.data.id));

    if (!existing) {
      return res.status(404).json({ error: "Product not found" });
    }

    if (existing.stock < body.data.quantity) {
      return res.status(400).json({
        error: `Insufficient stock. Available: ${existing.stock}, requested: ${body.data.quantity}`,
      });
    }

    const [product] = await db
      .update(productsTable)
      .set({ stock: existing.stock - body.data.quantity })
      .where(eq(productsTable.id, params.data.id))
      .returning();

    return res.json({
      ...product,
      price: Number(product.price),
      createdAt: product.createdAt.toISOString(),
      nameAr: product.nameAr ?? null,
      descriptionAr: product.descriptionAr ?? null,
      categoryAr: product.categoryAr ?? null,
    });
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
