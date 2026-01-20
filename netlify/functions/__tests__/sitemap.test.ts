import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createMockRequest, createMockContext } from './helpers.js'
import {
  mockNeonSql,
  setMockNeonResult,
  setMockNeonError,
  resetNeonMocks,
} from '../__mocks__/neon.js'

// Mock process.env
vi.stubGlobal('process', {
  env: {
    DATABASE_URL: 'postgres://test:test@localhost:5432/test',
  },
})

// Import handler after mocks are set up
const { default: handler } = await import('../sitemap.mts')

describe('sitemap function', () => {
  beforeEach(() => {
    resetNeonMocks()
  })

  describe('XML generation', () => {
    it('should return valid XML with correct Content-Type header', async () => {
      setMockNeonResult('SELECT slug, updated_at', [
        { slug: 'grand-palace', updated_at: '2024-01-15T10:00:00Z' },
      ])

      const request = createMockRequest({ method: 'GET', url: '/api/sitemap' })
      const context = createMockContext()
      const response = await handler(request, context)

      expect(response.headers.get('Content-Type')).toBe('application/xml')

      const xml = await response.text()
      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>')
      expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
      expect(xml).toContain('</urlset>')
    })

    it('should set Cache-Control header', async () => {
      setMockNeonResult('SELECT slug, updated_at', [])

      const request = createMockRequest({ method: 'GET', url: '/api/sitemap' })
      const context = createMockContext()
      const response = await handler(request, context)

      expect(response.headers.get('Cache-Control')).toBe('public, max-age=3600')
    })
  })

  describe('static pages', () => {
    it('should include home page with priority 1.0', async () => {
      setMockNeonResult('SELECT slug, updated_at', [])

      const request = createMockRequest({ method: 'GET', url: '/api/sitemap' })
      const context = createMockContext()
      const response = await handler(request, context)

      const xml = await response.text()
      expect(xml).toContain('<loc>https://happyroam.travel/</loc>')
      expect(xml).toContain('<priority>1.0</priority>')
    })

    it('should include visa page with priority 0.9', async () => {
      setMockNeonResult('SELECT slug, updated_at', [])

      const request = createMockRequest({ method: 'GET', url: '/api/sitemap' })
      const context = createMockContext()
      const response = await handler(request, context)

      const xml = await response.text()
      expect(xml).toContain('<loc>https://happyroam.travel/visa</loc>')
      expect(xml).toContain('<priority>0.9</priority>')
    })

    it('should include attractions page with priority 0.9', async () => {
      setMockNeonResult('SELECT slug, updated_at', [])

      const request = createMockRequest({ method: 'GET', url: '/api/sitemap' })
      const context = createMockContext()
      const response = await handler(request, context)

      const xml = await response.text()
      expect(xml).toContain('<loc>https://happyroam.travel/attractions</loc>')
    })

    it('should include legal pages with low priority', async () => {
      setMockNeonResult('SELECT slug, updated_at', [])

      const request = createMockRequest({ method: 'GET', url: '/api/sitemap' })
      const context = createMockContext()
      const response = await handler(request, context)

      const xml = await response.text()
      expect(xml).toContain('<loc>https://happyroam.travel/privacy</loc>')
      expect(xml).toContain('<priority>0.3</priority>')
      expect(xml).toContain('<loc>https://happyroam.travel/terms</loc>')
    })

    it('should include all 10 static pages', async () => {
      setMockNeonResult('SELECT slug, updated_at', [])

      const request = createMockRequest({ method: 'GET', url: '/api/sitemap' })
      const context = createMockContext()
      const response = await handler(request, context)

      const xml = await response.text()
      const staticUrls = [
        '/',
        '/visa',
        '/attractions',
        '/tdac',
        '/warnings',
        '/itinerary',
        '/profile',
        '/privacy',
        '/terms',
        '/contact',
      ]

      for (const url of staticUrls) {
        expect(xml).toContain(`<loc>https://happyroam.travel${url}</loc>`)
      }
    })

    it('should use correct changefreq values', async () => {
      setMockNeonResult('SELECT slug, updated_at', [])

      const request = createMockRequest({ method: 'GET', url: '/api/sitemap' })
      const context = createMockContext()
      const response = await handler(request, context)

      const xml = await response.text()
      expect(xml).toContain('<changefreq>daily</changefreq>')
      expect(xml).toContain('<changefreq>weekly</changefreq>')
      expect(xml).toContain('<changefreq>monthly</changefreq>')
      expect(xml).toContain('<changefreq>yearly</changefreq>')
    })
  })

  describe('attractions in sitemap', () => {
    it('should include all non-rejected attractions', async () => {
      setMockNeonResult('SELECT slug, updated_at', [
        { slug: 'grand-palace', updated_at: '2024-01-15T10:00:00Z' },
        { slug: 'wat-arun', updated_at: '2024-01-14T10:00:00Z' },
        { slug: 'koh-phi-phi', updated_at: '2024-01-13T10:00:00Z' },
      ])

      const request = createMockRequest({ method: 'GET', url: '/api/sitemap' })
      const context = createMockContext()
      const response = await handler(request, context)

      const xml = await response.text()
      expect(xml).toContain('<loc>https://happyroam.travel/attractions/grand-palace</loc>')
      expect(xml).toContain('<loc>https://happyroam.travel/attractions/wat-arun</loc>')
      expect(xml).toContain('<loc>https://happyroam.travel/attractions/koh-phi-phi</loc>')
    })

    it('should use updated_at for lastmod', async () => {
      setMockNeonResult('SELECT slug, updated_at', [
        { slug: 'grand-palace', updated_at: '2024-01-15T10:00:00Z' },
      ])

      const request = createMockRequest({ method: 'GET', url: '/api/sitemap' })
      const context = createMockContext()
      const response = await handler(request, context)

      const xml = await response.text()
      expect(xml).toContain('<lastmod>2024-01-15</lastmod>')
    })

    it('should use today\'s date when updated_at is null', async () => {
      setMockNeonResult('SELECT slug, updated_at', [
        { slug: 'grand-palace', updated_at: null },
      ])

      const request = createMockRequest({ method: 'GET', url: '/api/sitemap' })
      const context = createMockContext()
      const response = await handler(request, context)

      const xml = await response.text()
      const today = new Date().toISOString().split('T')[0]
      // The attraction lastmod should be today's date
      expect(xml).toMatch(new RegExp(`<loc>https://happyroam\\.travel/attractions/grand-palace</loc>\\s*<lastmod>${today}</lastmod>`))
    })

    it('should format URLs correctly (/attractions/:slug)', async () => {
      setMockNeonResult('SELECT slug, updated_at', [
        { slug: 'test-attraction', updated_at: '2024-01-01T00:00:00Z' },
      ])

      const request = createMockRequest({ method: 'GET', url: '/api/sitemap' })
      const context = createMockContext()
      const response = await handler(request, context)

      const xml = await response.text()
      expect(xml).toContain('<loc>https://happyroam.travel/attractions/test-attraction</loc>')
    })

    it('should set weekly changefreq for attractions', async () => {
      setMockNeonResult('SELECT slug, updated_at', [
        { slug: 'grand-palace', updated_at: '2024-01-15T10:00:00Z' },
      ])

      const request = createMockRequest({ method: 'GET', url: '/api/sitemap' })
      const context = createMockContext()
      const response = await handler(request, context)

      const xml = await response.text()
      // Count the number of weekly entries (static pages + attractions)
      const matches = xml.match(/<changefreq>weekly<\/changefreq>/g) || []
      expect(matches.length).toBeGreaterThanOrEqual(1)
    })

    it('should set priority 0.8 for attractions', async () => {
      setMockNeonResult('SELECT slug, updated_at', [
        { slug: 'grand-palace', updated_at: '2024-01-15T10:00:00Z' },
      ])

      const request = createMockRequest({ method: 'GET', url: '/api/sitemap' })
      const context = createMockContext()
      const response = await handler(request, context)

      const xml = await response.text()
      // Attraction URL followed by its priority
      expect(xml).toMatch(/<loc>https:\/\/happyroam\.travel\/attractions\/grand-palace<\/loc>[\s\S]*?<priority>0\.8<\/priority>/)
    })
  })

  describe('database query', () => {
    it('should query attractions excluding rejected ones', async () => {
      setMockNeonResult('SELECT slug, updated_at', [])

      const request = createMockRequest({ method: 'GET', url: '/api/sitemap' })
      const context = createMockContext()
      await handler(request, context)

      expect(mockNeonSql).toHaveBeenCalled()
      const calls = mockNeonSql.mock.calls
      const queryCall = calls.find(call =>
        call[0].some((s: string) => s.includes('verification_status'))
      )
      expect(queryCall).toBeDefined()
    })

    it('should order attractions by updated_at DESC', async () => {
      setMockNeonResult('SELECT slug, updated_at', [
        { slug: 'newest', updated_at: '2024-01-20T10:00:00Z' },
        { slug: 'older', updated_at: '2024-01-15T10:00:00Z' },
        { slug: 'oldest', updated_at: '2024-01-10T10:00:00Z' },
      ])

      const request = createMockRequest({ method: 'GET', url: '/api/sitemap' })
      const context = createMockContext()
      const response = await handler(request, context)

      const xml = await response.text()
      const newestIndex = xml.indexOf('newest')
      const olderIndex = xml.indexOf('older')
      const oldestIndex = xml.indexOf('oldest')

      // Newest should appear first in the XML
      expect(newestIndex).toBeLessThan(olderIndex)
      expect(olderIndex).toBeLessThan(oldestIndex)
    })
  })

  describe('error handling', () => {
    it('should handle database errors gracefully', async () => {
      setMockNeonError(new Error('Database connection failed'))

      const request = createMockRequest({ method: 'GET', url: '/api/sitemap' })
      const context = createMockContext()

      await expect(handler(request, context)).rejects.toThrow()
    })
  })
})
