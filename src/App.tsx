import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { BasicInfoPage } from './pages/BasicInfoPage'
import { ProjectDetailsPage } from './pages/ProjectDetailsPage'
import { ResourceDetailsPage } from './pages/ResourceDetailsPage'
import { ResourceOverviewPage } from './pages/ResourceOverviewPage'
import { ResourcesPage } from './pages/ResourcesPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/resources" replace />} />
        <Route path="/resources" element={<ResourcesPage />} />
        <Route path="/resources/:resourceId/details" element={<ResourceDetailsPage />} />
        <Route path="/resources/:resourceId/basic-info" element={<BasicInfoPage />} />
        <Route path="/resources/:resourceId/project-details" element={<ProjectDetailsPage />} />
        <Route path="/resources/:resourceId" element={<ResourceOverviewPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
