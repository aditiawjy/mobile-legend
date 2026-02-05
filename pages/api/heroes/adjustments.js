import { getAllAdjustments } from './[name]/adjustments';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const limit = parseInt(req.query.limit) || 10;
    const sort = req.query.sort || 'date_desc';

    // Fetch adjustments from CSV
    const adjustments = getAllAdjustments({ limit, sort });

    console.log(
      `[ADJUSTMENTS] Fetched ${adjustments ? adjustments.length : 0} adjustments with sort=${sort}`
    );

    if (!adjustments || adjustments.length === 0) {
      console.log('[ADJUSTMENTS] No adjustments found in CSV');
      return res.status(200).json([]);
    }

    return res.status(200).json(adjustments);
  } catch (e) {
    console.error('[ADJUSTMENTS] error:', e);
    return res.status(500).json({ error: 'Server error', details: e.message });
  }
}
