import type { TestBank } from './types'

// Every folder src/content/tests/<topicId>/index.ts with a default-exported TestBank is a finished test.
// Topics without a folder show "test coming soon". See CONTRIBUTING.md.
const modules = import.meta.glob<{ default: TestBank }>('../content/tests/*/index.ts', { eager: true })

export const banks: Record<string, TestBank> = {}
for (const [path, mod] of Object.entries(modules)) {
  const id = /tests\/([^/]+)\/index\.ts$/.exec(path)?.[1]
  if (id) banks[id] = mod.default
}

export const hasTest = (topicId: string) => topicId in banks
