import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ResourcesPage } from './pages/ResourcesPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/resources" replace />} />
        <Route path="/resources" element={<ResourcesPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
