import { getItemByNameFromCSV } from '../../../lib/itemsCSV';

export default async function handler(req, res) {
  const raw = Array.isArray(req.query.name) ? req.query.name[0] : req.query.name;
  const name = (raw || '').trim();
  if (!name) return res.status(400).json({ error: 'name is required' });

  try {
    if (req.method === 'GET') {
      const item = getItemByNameFromCSV(name);
      if (!item) {
        return res.status(200).json({});
      }
      return res.status(200).json(item);
    }

    if (req.method === 'PUT') {
      // PUT not supported with CSV storage
      return res.status(501).json({
        error: 'Updating items via API is not supported with CSV storage',
        message: 'Please update items directly in public/csv/items.csv file',
      });
    }

    res.setHeader('Allow', 'GET, PUT');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error('[DEBUG] CSV error:', e);
    return res.status(500).json({ error: 'Server error', details: e.message });
  }
}
