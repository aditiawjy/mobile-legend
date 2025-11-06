import { db } from '../../../lib/db'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    console.log('Fetching all heroes from database...')
    const connection = await db()

    // Get all heroes from database
    const [heroes] = await connection.execute('SELECT * FROM heroes ORDER BY hero_name')
    console.log(`Found ${heroes.length} heroes`)

    // Do NOT end the pool per request; Next.js dev server reuses it.
    // Leaving the pool open avoids connection churn and errors.

    res.status(200).json(heroes)
  } catch (error) {
    console.error('Error fetching all heroes:', error)

    // Return empty array when database is not available
    res.status(200).json([])
  }
}
