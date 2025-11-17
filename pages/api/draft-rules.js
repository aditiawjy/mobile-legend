import { parseDraftRulesCSV } from '../../lib/draftPick';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse draft-rules.csv and return all rules
    const rules = parseDraftRulesCSV();

    res.status(200).json({
      success: true,
      data: {
        roleCompatibility: rules.roleCompatibility,
        heroPriority: rules.heroPriority,
        synergyRules: rules.synergyRules,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error loading draft rules:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to load draft rules',
    });
  }
}
