import { Metadata } from 'next'
import { getEventsCatalog } from '@/app/actions/events'
import { EventCatalogClient } from '@/components/events/event-catalog-client'

export const metadata: Metadata = {
  title: 'Events & Hackathons | Team Discovery',
  description:
    'Discover active hackathons, innovation challenges, and build competitions. Form a squad and compete for verified builder endorsements.',
}

export default async function EventsPage() {
  const { events } = await getEventsCatalog()

  return <EventCatalogClient initialEvents={events || []} />
}
