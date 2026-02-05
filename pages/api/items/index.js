import { getAllItemsFromCSV, getItemsByCategoryFromCSV } from '../../../lib/itemsCSV';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get query parameters
    const category = typeof req.query.category === 'string' ? req.query.category.trim() : '';
    const sortBy = req.query.sortBy || 'name';
    const sortOrder = req.query.sortOrder === 'desc' ? 'desc' : 'asc';
    const minPrice = req.query.minPrice ? parseInt(req.query.minPrice) : null;
    const maxPrice = req.query.maxPrice ? parseInt(req.query.maxPrice) : null;

    // Pagination params
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    const fetchAll = req.query.fetchAll === 'true';

    // Get items from CSV
    let items = category ? getItemsByCategoryFromCSV(category) : getAllItemsFromCSV();

    // Apply price filter
    if (minPrice !== null) {
      items = items.filter((item) => item.price >= minPrice);
    }
    if (maxPrice !== null) {
      items = items.filter((item) => item.price <= maxPrice);
    }

    // Sort items
    items.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'price') {
        comparison = a.price - b.price;
      } else {
        comparison = a.item_name.localeCompare(b.item_name);
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    const total = items.length;

    // Apply pagination
    const paginatedItems = fetchAll ? items : items.slice(offset, offset + limit);
    const hasMore = !fetchAll && offset + paginatedItems.length < total;

    res.status(200).json({
      items: paginatedItems,
      total,
      hasMore,
      limit,
      offset,
      filters: {
        category,
        sortBy,
        sortOrder,
        minPrice,
        maxPrice,
      },
    });
  } catch (error) {
    console.error('Error fetching items from CSV:', error);
    res.status(200).json({
      items: [],
      total: 0,
      hasMore: false,
      limit: 20,
      offset: 0,
      filters: {},
    });
  }
}
