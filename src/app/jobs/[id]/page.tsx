import { supabase } from '@/lib/supabase'
import JobDetailClient from './JobDetailClient'

// This function is required for static export
export async function generateStaticParams() {
  // For static export, we'll return an empty array
  // In a real app, you might want to fetch all job IDs from your database
  return []
}

export default async function JobDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <JobDetailClient id={id} />
}


