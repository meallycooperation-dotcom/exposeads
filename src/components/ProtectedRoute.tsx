import { Navigate } from "react-router-dom"
import { useEffect, useState, type ReactNode } from "react"
import { supabase } from "../lib/supabase"

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
  }, [])

  if (loading) return <div>Loading...</div>

  return session ? children : <Navigate to="/login" />
}

export default ProtectedRoute
