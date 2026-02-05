import { searchItemsFromCSV, getItemsByCategoryFromCSV } from '../../lib/itemsCSV';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const category = typeof req.query.category === 'string' ? req.query.category.trim() : '';

  if (!q && !category) return res.status(200).json([]);

  try {
    console.log('[items_search] Query:', { q, category });

    let items;

    if (category && q) {
      // Filter by category first, then search
      const categoryItems = getItemsByCategoryFromCSV(category);
      const searchLower = q.toLowerCase();
      items = categoryItems.filter((item) => item.item_name.toLowerCase().includes(searchLower));
    } else if (category) {
      items = getItemsByCategoryFromCSV(category);
    } else {
      items = searchItemsFromCSV(q);
    }

    // Limit to 15 results
    items = items.slice(0, 15);

    console.log('[items_search] Found', items.length, 'items');

    // Return array of item names by default for simple autocomplete, but include rich data if requested
    if (req.query.rich === '1') {
      return res.status(200).json(
        items.map((item) => ({
          item_name: item.item_name,
          category: item.category,
          price: item.price,
          description: item.description,
        }))
      );
    }

    const names = items.map((r) => r.item_name);
    return res.status(200).json(names);
  } catch (e) {
    console.error('[items_search] ERROR:', {
      message: e.message,
      stack: e.stack,
    });
    // Return empty array instead of 500 to prevent infinite error loops
    return res.status(200).json([]);
  }
}
