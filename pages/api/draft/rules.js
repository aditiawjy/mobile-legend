import { parseDraftRulesCSV } from '../../../lib/draftPick';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { roleCompatibility, heroPriority } = parseDraftRulesCSV();

    res.status(200).json({
      success: true,
      data: {
        roleCompatibility,
        heroPriority,
      },
      meta: {
        source: 'public/csv/draft-rules.csv',
        description: 'Draft pick rules loaded from CSV (no hardcoded magic values)',
      },
    });
  } catch (error) {
    console.error('Error fetching draft rules:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error fetching draft rules',
    });
  }
}
