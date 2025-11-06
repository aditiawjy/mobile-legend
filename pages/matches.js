import { useState, useEffect } from 'react'
import AppLayout from '../components/AppLayout'

export default function Matches() {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMatches()
  }, [])

  const fetchMatches = async () => {
    try {
      // For now, we'll use mock data
      // In the future, this will fetch from /api/matches
      const mockMatches = [
        {
          id: 1,
          date: '2024-01-15',
          duration: '15:30',
          result: 'Victory',
          mode: 'Ranked',
          playerTeam: [
            { name: 'Player 1', hero: 'Alucard', kills: 8, deaths: 2, assists: 5 },
            { name: 'Player 2', hero: 'Miya', kills: 12, deaths: 1, assists: 7 },
            { name: 'Player 3', hero: 'Tigreal', kills: 3, deaths: 4, assists: 15 },
            { name: 'Player 4', hero: 'Kagura', kills: 10, deaths: 3, assists: 8 },
            { name: 'Player 5', hero: 'Lancelot', kills: 15, deaths: 2, assists: 6 }
          ],
          enemyTeam: [
            { name: 'Enemy 1', hero: 'Zilong', kills: 5, deaths: 8, assists: 3 },
            { name: 'Enemy 2', hero: 'Layla', kills: 7, deaths: 10, assists: 4 },
            { name: 'Enemy 3', hero: 'Franco', kills: 2, deaths: 12, assists: 8 },
            { name: 'Enemy 4', hero: 'Cyclops', kills: 9, deaths: 7, assists: 5 },
            { name: 'Enemy 5', hero: 'Hayabusa', kills: 11, deaths: 6, assists: 2 }
          ]
        },
        {
          id: 2,
          date: '2024-01-14',
          duration: '22:45',
          result: 'Defeat',
          mode: 'Classic',
          playerTeam: [
            { name: 'Player 1', hero: 'Gusion', kills: 12, deaths: 5, assists: 8 },
            { name: 'Player 2', hero: 'Lesley', kills: 8, deaths: 7, assists: 6 },
            { name: 'Player 3', hero: 'Hylos', kills: 2, deaths: 8, assists: 18 },
            { name: 'Player 4', hero: 'Harith', kills: 15, deaths: 6, assists: 9 },
            { name: 'Player 5', hero: 'Roger', kills: 9, deaths: 9, assists: 7 }
          ],
          enemyTeam: [
            { name: 'Enemy 1', hero: 'Fanny', kills: 18, deaths: 4, assists: 7 },
            { name: 'Enemy 2', hero: 'Claude', kills: 14, deaths: 6, assists: 11 },
            { name: 'Enemy 3', hero: 'Grock', kills: 4, deaths: 3, assists: 21 },
            { name: 'Enemy 4', hero: 'Lunox', kills: 16, deaths: 5, assists: 12 },
            { name: 'Enemy 5', hero: 'Helcurt', kills: 13, deaths: 7, assists: 8 }
          ]
        }
      ]
      
      setMatches(mockMatches)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching matches:', error)
      setLoading(false)
    }
  }

  const getResultColor = (result) => {
    return result === 'Victory' ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Matches</h1>
          <button
            onClick={() => {/* TODO: Add new match functionality */}}
            className="bg-sky-600 text-white px-4 py-2 rounded-lg hover:bg-sky-700 transition-colors"
          >
            Add New Match
          </button>
        </div>

        <div className="space-y-6">
          {matches.map((match) => (
            <div key={match.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getResultColor(match.result)}`}>
                    {match.result}
                  </span>
                  <span className="text-gray-600">{match.date}</span>
                  <span className="text-gray-600">{match.duration}</span>
                  <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm">{match.mode}</span>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {/* TODO: Edit match */}}
                    className="text-sky-600 hover:text-sky-800 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {/* TODO: Delete match */}}
                    className="text-red-600 hover:text-red-800 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Player Team */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Your Team</h3>
                  <div className="space-y-2">
                    {match.playerTeam.map((player, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                        <div>
                          <div className="font-medium text-gray-900">{player.hero}</div>
                          <div className="text-sm text-gray-600">{player.name}</div>
                        </div>
                        <div className="text-sm text-gray-600">
                          <span className="text-green-600">{player.kills}</span>/
                          <span className="text-red-600">{player.deaths}</span>/
                          <span className="text-blue-600">{player.assists}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Enemy Team */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Enemy Team</h3>
                  <div className="space-y-2">
                    {match.enemyTeam.map((player, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                        <div>
                          <div className="font-medium text-gray-900">{player.hero}</div>
                          <div className="text-sm text-gray-600">{player.name}</div>
                        </div>
                        <div className="text-sm text-gray-600">
                          <span className="text-green-600">{player.kills}</span>/
                          <span className="text-red-600">{player.deaths}</span>/
                          <span className="text-blue-600">{player.assists}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {matches.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-4">No matches found</div>
            <p className="text-gray-400">Start by adding your first match!</p>
          </div>
        )}
      </div>
    </AppLayout>
  )
}