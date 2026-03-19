import { BrowserRouter, Routes, Route } from "react-router-dom"
import Login from "./pages/Login"
import Dashboard from "./pages/Dashboard"
import DataSet from "./pages/DataSet"
import SocialMediaMarketing from "./pages/SocialMediaMarketing"
import SEOOptimization from "./pages/SEOOptimization"
import PaidAdvertising from "./pages/PaidAdvertising"
import ContentMarketing from "./pages/ContentMarketing"
import EmailMarketing from "./pages/EmailMarketing"
import InfluencerMarketing from "./pages/InfluencerMarketing"
import BrandIdentity from "./pages/BrandIdentity"
import WebsiteDevelopment from "./pages/WebsiteDevelopment"
import LeadGeneration from "./pages/LeadGeneration"
import VideoMarketing from "./pages/VideoMarketing"
import MarketingAnalytics from "./pages/MarketingAnalytics"
import ConversionOptimization from "./pages/ConversionOptimization"
import ProtectedRoute from "./components/ProtectedRoute"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/data-set"
          element={
            <ProtectedRoute>
              <DataSet />
            </ProtectedRoute>
          }
        />
        <Route
          path="/social-media"
          element={
            <ProtectedRoute>
              <SocialMediaMarketing />
            </ProtectedRoute>
          }
        />
        <Route
          path="/seo-optimization"
          element={
            <ProtectedRoute>
              <SEOOptimization />
            </ProtectedRoute>
          }
        />
        <Route
          path="/paid-advertising"
          element={
            <ProtectedRoute>
              <PaidAdvertising />
            </ProtectedRoute>
          }
        />
        <Route
          path="/content-marketing"
          element={
            <ProtectedRoute>
              <ContentMarketing />
            </ProtectedRoute>
          }
        />
        <Route
          path="/email-marketing"
          element={
            <ProtectedRoute>
              <EmailMarketing />
            </ProtectedRoute>
          }
        />
        <Route
          path="/influencer-marketing"
          element={
            <ProtectedRoute>
              <InfluencerMarketing />
            </ProtectedRoute>
          }
        />
        <Route
          path="/brand-identity"
          element={
            <ProtectedRoute>
              <BrandIdentity />
            </ProtectedRoute>
          }
        />
        <Route
          path="/website-development"
          element={
            <ProtectedRoute>
              <WebsiteDevelopment />
            </ProtectedRoute>
          }
        />
        <Route
          path="/lead-generation"
          element={
            <ProtectedRoute>
              <LeadGeneration />
            </ProtectedRoute>
          }
        />
        <Route
          path="/video-marketing"
          element={
            <ProtectedRoute>
              <VideoMarketing />
            </ProtectedRoute>
          }
        />
        <Route
          path="/marketing-analytics"
          element={
            <ProtectedRoute>
              <MarketingAnalytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/conversion-optimization"
          element={
            <ProtectedRoute>
              <ConversionOptimization />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
