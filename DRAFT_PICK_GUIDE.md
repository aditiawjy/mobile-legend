# Draft Pick Simulator Guide

## Overview
Draft Pick Simulator adalah fitur yang membantu pemain memilih hero dan mendapatkan rekomendasi partner hero yang cocok. 

**2 Modes Available:**
1. **Auto Recommendation** - Pilih 1 hero dan sistem memberikan 4 rekomendasi partner terbaik
2. **Manual Selection** - Pilih 5 heroes secara manual dengan autocomplete input

## Files Created

### 1. `/lib/draftPick.js`
Berisi logic utama draft pick simulation dengan fungsi-fungsi:
- `parseHeroesCSV()` - Parse CSV heroes dari `public/csv/heroes.csv`
- `getPrimaryRole(roleString)` - Extract primary role (sebelum `/`)
- `getHeroesByRole(role)` - Get all heroes dengan role tertentu
- `getRecommendedPartners(heroName)` - Get 4 rekomendasi partner
- `simulateDraftPick(heroName)` - Main function untuk simulasi draft pick
- `validateDraftTeam(heroes)` - Validate team composition

### 2. API Endpoints

#### `/api/draft-simulation?hero={heroName}`
GET request untuk mendapatkan draft pick simulation hasil.

**Request:**
```
GET /api/draft-simulation?hero=Miya
```

**Response:**
```json
{
  "success": true,
  "data": {
    "selectedHero": {
      "name": "Miya",
      "role": "Marksman",
      "damageType": "physical_attack_speed",
      "attackReliance": "Finisher/Damage",
      "note": "..."
    },
    "recommendedPartners": [
      { "name": "Akai", "role": "Tank/Guard", ... },
      { "name": "Angela", "role": "Support", ... },
      { "name": "Cecilion", "role": "Mage", ... },
      { "name": "Arlott", "role": "Fighter/Assassin", ... }
    ],
    "draft": {
      "options": [
        { "name": "Miya", "role": "Marksman" },
        { "name": "Akai", "role": "Tank" },
        ...
      ],
      "roles": [...]
    },
    "recommendations": {
      "pickReason": "Miya adalah Marksman dengan kemampuan Finisher/Damage",
      "partnerRoles": [
        {
          "name": "Akai",
          "role": "Tank",
          "reason": "Akai sebagai tank untuk protect Miya di backline"
        },
        ...
      ]
    },
    "teamValidation": {
      "isBalanced": true,
      "roleDistribution": {
        "Marksman": 1,
        "Tank": 1,
        "Support": 1,
        "Mage": 1,
        "Fighter": 1
      }
    }
  }
}
```

#### `/api/heroes-list`
GET request untuk mendapatkan list semua heroes.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "name": "Miya",
      "role": "Marksman",
      "damageType": "physical_attack_speed",
      "attackReliance": "Finisher/Damage",
      "note": "..."
    },
    ...
  ],
  "total": 70
}
```

### 3. Components

#### `/components/DraftPickSimulator.js`
React component untuk UI Draft Pick Simulator.

**Features:**
- Hero selection dropdown (all 70 heroes)
- Real-time draft simulation
- Display selected hero dengan detail
- Display 5 draft options
- Show recommended partners dengan reasoning
- Team composition validation

### 4. Components

#### `/components/HeroAutocomplete.js`
Reusable autocomplete input component untuk search dan select heroes.

**Features:**
- Real-time search dengan debounce (300ms)
- API integration dengan `/api/heroes_search`
- Click outside detection
- Clear button
- Loading indicator

#### `/components/ManualDraftPick.js`
Component untuk manual draft pick dengan 5 autocomplete inputs.

**Features:**
- 5 hero selection slots dengan autocomplete
- Real-time team composition analysis
- Role distribution calculation
- Damage type analysis
- Smart recommendations

### 5. Pages

#### `/pages/draft-pick.js`
Main page dengan toggle antara Auto Recommendation dan Manual Selection modes.

**Access:** http://localhost:3001/draft-pick

#### `/pages/draft-pick-manual.js`
Standalone page untuk Manual Draft Pick (optional).

**Access:** http://localhost:3001/draft-pick-manual

## How to Use

### 1. Start Development Server
```bash
npm run dev
```

### 2. Access Draft Pick UI
Navigate ke `http://localhost:3001/draft-pick`

### 3. Choose Mode

#### Auto Recommendation Mode:
1. Pilih hero dari dropdown
2. Sistem otomatis memberikan 4 rekomendasi partner
3. View draft simulation dengan reasoning

#### Manual Selection Mode:
1. Toggle ke "Manual Selection"
2. Ketik nama hero di setiap Pick 1-5 input
3. Autocomplete akan muncul dengan suggestions
4. Pilih hero dari suggestions
5. View team composition analysis

### 4. View Results

#### Auto Mode Results:
- **Hero Utama Dipilih**: Detail hero yang dipilih
- **5 Pilihan Draft**: 1 hero dipilih + 4 rekomendasi
- **Tim Rekomendasi**: 4 partner dengan reasoning
- **Komposisi Tim**: Validasi apakah team balanced

#### Manual Mode Results:
- **Draft Summary**: Shows all selected heroes (1-5)
- **Hero Details**: Name, role, damage type, attack reliance
- **Team Composition Analysis**:
  - Balance status (✓ Balanced or ⚠ Unbalanced)
  - Role distribution dengan progress bars
  - Damage types breakdown
  - Smart recommendations

### API Usage Example (cURL)

```bash
# Get draft simulation untuk Miya
curl "http://localhost:3001/api/draft-simulation?hero=Miya"

# Get all heroes
curl "http://localhost:3001/api/heroes-list"
```

## Role Compatibility Matrix

Sistem rekomendasi berdasarkan compatibility antar role:

```
Marksman -> Tank, Support, Mage, Fighter
Mage     -> Tank, Support, Marksman, Assassin, Fighter
Tank     -> Marksman, Mage, Support, Fighter, Assassin
Support  -> Marksman, Tank, Mage, Fighter, Assassin
Fighter  -> Tank, Support, Mage, Assassin, Marksman
Assassin -> Support, Mage, Tank, Fighter
Jungler  -> Tank, Marksman, Mage, Support
```

## Algorithm Logic

1. **Parse Heroes CSV** - Load semua heroes dari CSV
2. **Get Primary Role** - Extract role utama (sebelum `/`)
3. **Find Compatible Roles** - Cari role yang kompatibel dengan hero yang dipilih
4. **Select Best Partners** - Dari setiap compatible role, ambil 1 hero terbaik
5. **Validate Team** - Check apakah team composition balanced (min 3 different roles)

## Testing

Untuk test logic tanpa UI:

```javascript
// Node.js test
const { simulateDraftPick } = require('./lib/draftPick');

const result = simulateDraftPick('Miya');
console.log(result);
```

## Dependencies

- `csv-parse` - For parsing CSV files (v5.4.1+)
- `next` - React framework (14.2.5+)
- `react` - React library (18.3.1+)

## Notes

- Heroes data bersumber dari `public/csv/heroes.csv`
- Maksimal 4 rekomendasi partner (total 5 heroes: 1 selected + 4 recommended)
- Team validation mengecek apakah ada minimal 3 role berbeda
- Untuk mendapatkan role distribution yang lebih detail, API returns breakdown per role
