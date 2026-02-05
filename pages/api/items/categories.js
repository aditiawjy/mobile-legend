import { getUniqueCategoriesFromCSV } from '../../../lib/itemsCSV';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const categories = getUniqueCategoriesFromCSV();

    res.status(200).json({
      categories,
      count: categories.length,
    });
  } catch (error) {
    console.error('Error fetching categories from CSV:', error);
    res.status(200).json({ categories: [], count: 0 });
  }
}
