# Manual Draft Pick Guide

## Overview
Manual Draft Pick adalah fitur yang memungkinkan user untuk memilih 5 hero secara manual dengan autocomplete input. Sistem akan menganalisis komposisi tim dan memberikan rekomendasi.

## Features

### 1. Autocomplete Input (HeroAutocomplete Component)
- **Real-time search** - Ketik nama hero untuk mencari
- **Debounced search** - 300ms delay untuk optimasi
- **API integration** - Fetch dari database MySQL heroes table
- **Clear button** - Hapus input dengan 1 klik
- **Loading indicator** - Visual feedback saat searching

### 2. 5 Draft Pick Slots
- Pick 1-5 dengan autocomplete untuk setiap slot
- Tidak wajib pilih semua 5 (bisa partial selection)
- Clear All button untuk reset semua picks

### 3. Team Composition Analysis

#### Auto-calculated metrics:
- **Role Distribution** - Hitung berapa hero per role
- **Damage Types** - Physical, Magic, Mixed
- **Balance Status** - Apakah team balanced (3+ different roles)
- **Visual indicators** - Progress bars dan color coding

#### Smart Recommendations:
- Suggest role diversity jika tidak balanced
- Warn jika hanya 1 damage type
- Celebrate jika composition bagus

### 4. Hero Details Display
- Show selected heroes dengan detail:
  - Hero name
  - Role
  - Damage type
  - Attack reliance
- Visual icons untuk setiap position
- Responsive grid layout

## Files Structure

```
components/
  ├── HeroAutocomplete.js       # Reusable autocomplete input
  └── ManualDraftPick.js         # Main manual draft pick component

pages/
  ├── draft-pick.js              # Main page dengan toggle Auto/Manual
  └── draft-pick-manual.js       # Standalone manual page

pages/api/
  ├── heroes_search.js           # Search heroes (existing)
  └── heroes/index.js            # Get all heroes (existing)
```

## API Endpoints

### GET /api/heroes_search?q={query}
Search heroes by name dengan LIKE query.

**Request:**
```
GET /api/heroes_search?q=miya
```

**Response:**
```json
["Miya", "Minotaur"]
```

### GET /api/heroes
Get all heroes dari database.

**Response:**
```json
[
  {
    "hero_name": "Miya",
    "role": "Marksman",
    "damage_type": "physical_attack_speed",
    "attack_reliance": "Finisher/Damage",
    "note": "..."
  },
  ...
]
```

## Usage

### Access Page
```
http://localhost:3001/draft-pick
```

### Toggle Modes
- **Auto Recommendation** - Pilih 1 hero, get 4 recommended partners
- **Manual Selection** - Pilih 5 heroes secara manual

### Manual Draft Pick Flow

1. **Select Heroes**
   - Ketik nama hero di Pick 1-5
   - Autocomplete akan show suggestions
   - Klik suggestion untuk select
   - Clear button untuk reset

2. **View Draft Summary**
   - Shows selected heroes dengan details
   - Real-time update as you type
   - Visual icons per position

3. **Team Analysis**
   - Role distribution dengan bar chart
   - Damage type breakdown
   - Balance status indicator
   - Smart recommendations

## Component Props

### HeroAutocomplete
```jsx
<HeroAutocomplete
  value={string}              // Current value
  onChange={(value) => {}}    // Callback when value changes
  placeholder={string}        // Input placeholder
  position={string}           // Position label (Pick 1, Pick 2, etc)
  disabled={boolean}          // Disable input
/>
```

## Examples

### Example 1: Balanced Team
```
Pick 1: Miya (Marksman)
Pick 2: Tigreal (Tank)
Pick 3: Eudora (Mage)
Pick 4: Ruby (Fighter)
Pick 5: Angela (Support)

✓ Balanced Team
Role Distribution: 5 different roles
Damage: 3 Physical, 2 Magic
```

### Example 2: Unbalanced Team
```
Pick 1: Miya (Marksman)
Pick 2: Layla (Marksman)
Pick 3: Claude (Marksman)
Pick 4: Karrie (Marksman)
Pick 5: Lesley (Marksman)

⚠ Unbalanced Team
Role Distribution: Marksman x5
Damage: 5 Physical, 0 Magic

Recommendations:
• Add more role diversity for better team balance
• Consider adding magic damage heroes for better penetration
```

### Example 3: Partial Selection
```
Pick 1: Miya (Marksman)
Pick 2: Tigreal (Tank)
Pick 3: Eudora (Mage)
Pick 4: (empty)
Pick 5: (empty)

Draft Summary: 3/5 heroes selected
Recommendations:
• Pick 2 more hero(es) to complete the draft
```

## Algorithm

### Role Distribution Calculation
```javascript
const roleCount = {};
heroes.forEach(hero => {
  const primaryRole = hero.role.split('/')[0].trim();
  roleCount[primaryRole] = (roleCount[primaryRole] || 0) + 1;
});
```

### Balance Check
```javascript
const isBalanced = Object.keys(roleCount).length >= 3;
```

### Damage Type Analysis
```javascript
const damageTypes = { physical: 0, magic: 0, mixed: 0 };
heroes.forEach(hero => {
  const damageType = hero.damage_type.toLowerCase();
  if (damageType.includes('physical')) damageTypes.physical++;
  else if (damageType.includes('magic')) damageTypes.magic++;
  else if (damageType.includes('mixed')) damageTypes.mixed++;
});
```

## Performance Optimizations

### 1. Debounced Search
- 300ms delay sebelum API call
- Mengurangi unnecessary requests

### 2. API Response Limit
- Heroes search limited to 15 results
- Faster response time

### 3. Lazy Hero Details Fetch
- Only fetch details after user stops typing
- 500ms debounce untuk detail fetch

### 4. Click Outside Detection
- Close autocomplete dropdown when clicking outside
- Better UX

## Styling

### Colors
- **Blue** (#3b82f6) - Primary actions, selected state
- **Green** (#10b981) - Balanced team
- **Yellow** (#f59e0b) - Warning/unbalanced
- **Red** (#ef4444) - Physical damage
- **Purple** (#a855f7) - Magic damage
- **Gray** (#1f2937, #374151) - Background, borders

### Layout
- Responsive grid: 1 col mobile, 5 cols desktop
- Max width: 6xl (1280px)
- Spacing: 4-6 units (1rem-1.5rem)

## Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires JavaScript enabled
- CSS Grid and Flexbox support

## Future Enhancements

### Possible Features:
1. **Save Draft** - Save draft picks ke local storage
2. **Share Draft** - Generate shareable link
3. **Counter Pick** - Suggest heroes to counter enemy picks
4. **Ban Phase** - Add ban phase simulation
5. **Hero Pool** - Filter by user's hero pool
6. **Win Rate** - Show win rate per hero
7. **Synergy Score** - Calculate synergy score antar heroes
8. **Export** - Export draft composition as image/PDF

## Troubleshooting

### Autocomplete tidak muncul
- Check `/api/heroes_search` endpoint
- Verify database connection
- Check browser console for errors

### Hero details tidak load
- Check `/api/heroes` endpoint
- Verify hero_name field di database
- Check network tab untuk API errors

### Styling issues
- Verify Tailwind CSS configured
- Check browser compatibility
- Clear browser cache
