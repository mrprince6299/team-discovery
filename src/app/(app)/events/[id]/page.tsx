import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getEventShowcaseDetails } from '@/app/actions/events'
import { EventDetailsClient } from '@/components/events/event-details-client'

interface EventDetailsPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({
  params,
}: EventDetailsPageProps): Promise<Metadata> {
  const { id } = await params
  const { event } = await getEventShowcaseDetails(id)

  if (!event) {
    return { title: 'Event Not Found | Team Discovery' }
  }

  return {
    title: `${event.name} | Team Discovery`,
    description: event.description,
  }
}

export default async function EventDetailsPage({ params }: EventDetailsPageProps) {
  const { id } = await params
  const { event } = await getEventShowcaseDetails(id)

  if (!event) {
    notFound()
  }

  return <EventDetailsClient event={event} />
}
