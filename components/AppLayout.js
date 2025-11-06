import Sidebar from './Sidebar'
import { colors, shadows, borderRadius } from '../lib/design-system'

export default function AppLayout({ children }) {
  return (
    <Sidebar>
      {children}
    </Sidebar>
  )
}
