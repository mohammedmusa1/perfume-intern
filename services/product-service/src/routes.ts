import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import pool from './db';

const router = Router();

// ─── List Perfumes with Filters ──────────────────────────────────────────────
router.get('/', async (req: Request, res: Response) => {
  try {
    const { category, fragranceFamily, brand, minPrice, maxPrice, minRating, search, sortBy, page = '1', limit = '12' } = req.query;
    const conditions: string[] = [];
    const params: (string | number)[] = [];
    let idx = 1;

    if (category) { conditions.push(`p.category = $${idx++}`); params.push(String(category)); }
    if (fragranceFamily) { conditions.push(`p.fragrance_family = $${idx++}`); params.push(String(fragranceFamily)); }
    if (brand) { conditions.push(`p.brand ILIKE $${idx++}`); params.push(`%${brand}%`); }
    if (minPrice) { conditions.push(`p.price >= $${idx++}`); params.push(Number(minPrice)); }
    if (maxPrice) { conditions.push(`p.price <= $${idx++}`); params.push(Number(maxPrice)); }
    if (minRating) { conditions.push(`p.average_rating >= $${idx++}`); params.push(Number(minRating)); }
    if (search) { conditions.push(`(p.name ILIKE $${idx} OR p.brand ILIKE $${idx} OR p.description ILIKE $${idx})`); params.push(`%${search}%`); idx++; }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    let orderBy = 'ORDER BY p.created_at DESC';
    if (sortBy === 'price_asc') orderBy = 'ORDER BY p.price ASC';
    else if (sortBy === 'price_desc') orderBy = 'ORDER BY p.price DESC';
    else if (sortBy === 'rating') orderBy = 'ORDER BY p.average_rating DESC';
    else if (sortBy === 'name') orderBy = 'ORDER BY p.name ASC';

    const pg = Math.max(1, Number(page));
    const lim = Math.min(100, Math.max(1, Number(limit)));
    const offset = (pg - 1) * lim;

    const countQuery = `SELECT COUNT(*) FROM perfumes p ${where}`;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count, 10);

    const dataQuery = `SELECT p.*, i.quantity as stock FROM perfumes p LEFT JOIN inventory i ON i.perfume_id = p.id ${where} ${orderBy} LIMIT ${lim} OFFSET ${offset}`;
    const result = await pool.query(dataQuery, params);

    res.json({
      success: true, data: result.rows,
      pagination: { page: pg, limit: lim, total, totalPages: Math.ceil(total / lim) },
    });
  } catch (err) {
    console.error('List perfumes error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch products' });
  }
});

// ─── Get Single Perfume ──────────────────────────────────────────────────────
router.get('/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const result = await pool.query(
      `SELECT p.*, i.quantity as stock FROM perfumes p LEFT JOIN inventory i ON i.perfume_id = p.id WHERE p.slug = $1 OR p.id::text = $1`, [slug]
    );
    if (result.rows.length === 0) { res.status(404).json({ success: false, message: 'Product not found' }); return; }
    // Get reviews
    const reviews = await pool.query(
      `SELECT r.*, u.first_name, u.last_name FROM reviews r JOIN users u ON u.id = r.user_id WHERE r.perfume_id = $1 ORDER BY r.created_at DESC LIMIT 20`, [result.rows[0].id]
    );
    res.json({ success: true, data: { ...result.rows[0], reviews: reviews.rows } });
  } catch (err) {
    console.error('Get perfume error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch product' });
  }
});

// ─── Create Perfume (Admin) ──────────────────────────────────────────────────
router.post('/', async (req: Request, res: Response) => {
  try {
    const auth = req.headers.authorization?.split(' ')[1];
    if (!auth) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }
    const decoded = jwt.verify(auth, process.env['JWT_SECRET']!) as { role: string };
    if (decoded.role !== 'admin') { res.status(403).json({ success: false, message: 'Admin only' }); return; }

    const { name, brand, description, shortDescription, price, salePrice, category, fragranceFamily, topNotes, middleNotes, baseNotes, sizeML, images, thumbnail, isFeatured, isBestSeller, isTrending } = req.body;
    const slug = name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/^-+|-+$/g, '');

    const result = await pool.query(
      `INSERT INTO perfumes (name, slug, brand, description, short_description, price, sale_price, category, fragrance_family, top_notes, middle_notes, base_notes, size_ml, images, thumbnail, is_featured, is_best_seller, is_trending)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING *`,
      [name, slug, brand, description, shortDescription, price, salePrice || null, category, fragranceFamily, topNotes, middleNotes, baseNotes, sizeML, images, thumbnail, isFeatured || false, isBestSeller || false, isTrending || false]
    );
    // Create inventory
    await pool.query('INSERT INTO inventory (perfume_id, quantity) VALUES ($1, 0)', [result.rows[0].id]);
    res.status(201).json({ success: true, message: 'Product created', data: result.rows[0] });
  } catch (err) {
    console.error('Create perfume error:', err);
    res.status(500).json({ success: false, message: 'Failed to create product' });
  }
});

// ─── Update Perfume (Admin) ──────────────────────────────────────────────────
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const auth = req.headers.authorization?.split(' ')[1];
    if (!auth) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }
    const decoded = jwt.verify(auth, process.env['JWT_SECRET']!) as { role: string };
    if (decoded.role !== 'admin') { res.status(403).json({ success: false, message: 'Admin only' }); return; }

    const { id } = req.params;
    const fields = req.body;
    const setClauses: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    for (const [key, value] of Object.entries(fields)) {
      const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      setClauses.push(`${dbKey} = $${idx++}`);
      values.push(value);
    }
    if (setClauses.length === 0) { res.status(400).json({ success: false, message: 'No fields to update' }); return; }
    values.push(id);

    const result = await pool.query(`UPDATE perfumes SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`, values);
    if (result.rows.length === 0) { res.status(404).json({ success: false, message: 'Product not found' }); return; }
    res.json({ success: true, message: 'Product updated', data: result.rows[0] });
  } catch (err) {
    console.error('Update perfume error:', err);
    res.status(500).json({ success: false, message: 'Failed to update product' });
  }
});

// ─── Delete Perfume (Admin) ──────────────────────────────────────────────────
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const auth = req.headers.authorization?.split(' ')[1];
    if (!auth) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }
    const decoded = jwt.verify(auth, process.env['JWT_SECRET']!) as { role: string };
    if (decoded.role !== 'admin') { res.status(403).json({ success: false, message: 'Admin only' }); return; }

    await pool.query('DELETE FROM perfumes WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Product deleted' });
  } catch (err) {
    console.error('Delete perfume error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete product' });
  }
});

// ─── Reviews ─────────────────────────────────────────────────────────────────
router.post('/:id/reviews', async (req: Request, res: Response) => {
  try {
    const auth = req.headers.authorization?.split(' ')[1];
    if (!auth) { res.status(401).json({ success: false, message: 'Login required' }); return; }
    const decoded = jwt.verify(auth, process.env['JWT_SECRET']!) as { userId: string };
    const { rating, title, comment } = req.body;
    const perfumeId = req.params.id;

    await pool.query('INSERT INTO reviews (perfume_id, user_id, rating, title, comment, is_verified) VALUES ($1,$2,$3,$4,$5,true)', [perfumeId, decoded.userId, rating, title, comment]);
    // Update average rating
    const avg = await pool.query('SELECT AVG(rating)::numeric(3,2) as avg, COUNT(*) as cnt FROM reviews WHERE perfume_id = $1', [perfumeId]);
    await pool.query('UPDATE perfumes SET average_rating = $1, total_reviews = $2 WHERE id = $3', [avg.rows[0].avg, avg.rows[0].cnt, perfumeId]);
    res.status(201).json({ success: true, message: 'Review added' });
  } catch (err) {
    console.error('Review error:', err);
    res.status(500).json({ success: false, message: 'Failed to add review' });
  }
});

// ─── Update Inventory (Admin) ────────────────────────────────────────────────
router.put('/:id/inventory', async (req: Request, res: Response) => {
  try {
    const auth = req.headers.authorization?.split(' ')[1];
    if (!auth) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }
    const decoded = jwt.verify(auth, process.env['JWT_SECRET']!) as { role: string };
    if (decoded.role !== 'admin') { res.status(403).json({ success: false, message: 'Admin only' }); return; }

    const { quantity, lowStockThreshold } = req.body;
    await pool.query(
      'UPDATE inventory SET quantity = COALESCE($1, quantity), low_stock_threshold = COALESCE($2, low_stock_threshold) WHERE perfume_id = $3',
      [quantity, lowStockThreshold, req.params.id]
    );
    res.json({ success: true, message: 'Inventory updated' });
  } catch (err) {
    console.error('Inventory error:', err);
    res.status(500).json({ success: false, message: 'Failed to update inventory' });
  }
});

// ─── Categories ──────────────────────────────────────────────────────────────
router.get('/categories/all', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM category_groups ORDER BY sort_order');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Categories error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch categories' });
  }
});

export default router;
