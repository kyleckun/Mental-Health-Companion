import React from 'react'
import ReactDOM from 'react-dom/client'
import MoodJournalPage from './pages/MoodJournalPage'  // 删除 .tsx

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MoodJournalPage />
  </React.StrictMode>,
)