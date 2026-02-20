import { getDefaultLanes } from '../../../lib/laneConstants';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json(getDefaultLanes())
  }

  res.setHeader('Allow', 'GET')
  return res.status(405).json({ error: 'Method not allowed' })
}
