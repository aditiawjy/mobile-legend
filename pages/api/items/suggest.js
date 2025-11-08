import { suggestItems, getBudgetItems } from '../../../lib/itemRecommendation';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { role, damageType, phase = 'early', budget = 'false', maxPrice = 1500, maxItems = 5 } = req.query;

    // Validate required parameters
    if (!role) {
      return res.status(400).json({ 
        error: 'Missing required parameter: role',
        validRoles: ['Tank', 'Fighter', 'Assassin', 'Mage', 'Marksman', 'Support'],
      });
    }

    if (!damageType) {
      return res.status(400).json({ 
        error: 'Missing required parameter: damageType',
        validTypes: ['physical', 'magic', 'mixed'],
      });
    }

    // Normalize inputs
    const normalizedRole = role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
    const normalizedDamageType = damageType.toLowerCase();

    // Budget mode: return cheap but effective items
    if (budget === 'true') {
      const budgetItems = getBudgetItems(
        normalizedDamageType, 
        Number(maxPrice), 
        Number(maxItems)
      );

      return res.status(200).json({
        success: true,
        mode: 'budget',
        data: {
          items: budgetItems,
          meta: {
            role: normalizedRole,
            damageType: normalizedDamageType,
            maxPrice: Number(maxPrice),
            totalItems: budgetItems.length,
          },
        },
      });
    }

    // Standard mode: boots + penetration + core items
    const recommendations = suggestItems(normalizedRole, normalizedDamageType, phase);

    res.status(200).json({
      success: true,
      mode: 'standard',
      data: recommendations,
    });
  } catch (error) {
    console.error('Item suggestion error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error generating item suggestions',
    });
  }
}
