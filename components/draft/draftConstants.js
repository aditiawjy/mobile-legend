// Shared constants for Draft Pick components

export const ROLE_ICONS = {
  Tank: '🛡️',
  Fighter: '⚔️',
  Mage: '✨',
  Marksman: '🎯',
  Assassin: '🗡️',
  Support: '💊',
};

export const getRoleIcon = (role) => {
  if (!role) return '';
  const key = role.split('/')[0].trim();
  return ROLE_ICONS[key] || '';
};

export const getDamageTypeIcon = (damageType) => {
  if (!damageType) return '';
  const dt = damageType.toLowerCase();
  if (dt.includes('physical')) return '⚔️';
  if (dt.includes('magic')) return '✨';
  if (dt.includes('mixed')) return '⚡';
  return '🔹';
};

export const DAMAGE_TYPE_COLORS = {
  physical: 'text-orange-400',
  magic: 'text-purple-400',
  mixed: 'text-yellow-400',
  default: 'text-gray-400',
};

export const getDamageTypeColor = (damageType) => {
  if (!damageType) return DAMAGE_TYPE_COLORS.default;
  const dt = damageType.toLowerCase();
  if (dt.includes('physical')) return DAMAGE_TYPE_COLORS.physical;
  if (dt.includes('magic')) return DAMAGE_TYPE_COLORS.magic;
  if (dt.includes('mixed')) return DAMAGE_TYPE_COLORS.mixed;
  return DAMAGE_TYPE_COLORS.default;
};
