import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const filePath = path.join(process.cwd(), 'public/csv/emblems.csv');
      if (!fs.existsSync(filePath)) {
        return res.status(200).json([]);
      }

      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const records = parse(fileContent, { columns: true, trim: true, skip_empty_lines: true });

      const emblems = records.map((record, index) => ({
        id: record.id || (index + 1),
        name: record.emblem_name || record.name,
        attributes: record.attributes || '',
        talent1: record.talent_slot1_options || '',
        talent2: record.talent_slot2_options || '',
        talent3: record.talent_slot3_options || ''
      }));

      // Sort alphabetically
      emblems.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

      res.status(200).json(emblems);
    } catch (error) {
      console.error('Error fetching emblems from CSV:', error);
      res.status(500).json([]);
    }
  } else {
    // Return mock for POST requests since we can't save to CSV easily from API by default right now
    if (req.method === 'POST') {
      return res.status(201).json({ ...req.body, id: Date.now() });
    }
    res.status(405).json({ message: 'Method not allowed' });
  }
}
