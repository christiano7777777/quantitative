import type { Career, Topic } from '../lib/types'
import topicsJson from './topics.json'
import careersJson from './careers.json'
import domainsJson from './domains.json'

export const topics = topicsJson as Topic[]
export const careers = careersJson as Career[]
export const domainLabels = domainsJson as Record<string, string>
export const domainOrder = Object.keys(domainsJson)
