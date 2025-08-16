import InterestedClient from './InterestedClient'

export async function generateStaticParams() {
  return [] as any
}

export default async function InterestedPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <InterestedClient id={id} />
}


