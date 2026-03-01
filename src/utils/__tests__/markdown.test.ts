import { describe, it, expect } from 'vitest'
import { renderMarkdown, extractTOC } from '../markdown'

describe('markdown utils', () => {
  describe('renderMarkdown', () => {
    describe('headings', () => {
      it('should render h1-h4 with IDs and classes', () => {
        const md = '# Main Title\n\n## Section\n\n### Subsection\n\n#### Detail'
        const html = renderMarkdown(md)

        expect(html).toContain('<h1 id="main-title"')
        expect(html).toContain('>Main Title</h1>')
        expect(html).toContain('<h2 id="section"')
        expect(html).toContain('<h3 id="subsection"')
        expect(html).toContain('<h4 id="detail"')
      })

      it('should generate slug IDs from heading text', () => {
        const md = '## Getting Started with Thai Food'
        const html = renderMarkdown(md)

        expect(html).toContain('id="getting-started-with-thai-food"')
      })

      it('should strip special chars from heading IDs', () => {
        const md = "## What's the Best Time?"
        const html = renderMarkdown(md)

        expect(html).toContain('id="what-s-the-best-time"')
      })
    })

    describe('inline formatting', () => {
      it('should render bold text', () => {
        const md = 'This is **bold** text'
        const html = renderMarkdown(md)

        expect(html).toContain('<strong>bold</strong>')
      })

      it('should render italic text', () => {
        const md = 'This is *italic* text'
        const html = renderMarkdown(md)

        expect(html).toContain('<em>italic</em>')
      })

      it('should render bold+italic text', () => {
        const md = 'This is ***important*** text'
        const html = renderMarkdown(md)

        expect(html).toContain('<strong><em>important</em></strong>')
      })

      it('should render inline code', () => {
        const md = 'Use `npm install` to setup'
        const html = renderMarkdown(md)

        expect(html).toContain('<code')
        expect(html).toContain('npm install')
      })

      it('should render links with classes', () => {
        const md = 'Visit [Google](https://google.com) for more'
        const html = renderMarkdown(md)

        expect(html).toContain('<a href="https://google.com"')
        expect(html).toContain('>Google</a>')
      })
    })

    describe('XSS sanitization', () => {
      it('should escape HTML entities', () => {
        const md = 'This <script>alert("xss")</script> is safe'
        const html = renderMarkdown(md)

        expect(html).not.toContain('<script>')
        expect(html).toContain('&lt;script&gt;')
      })

      it('should escape angle brackets in text', () => {
        const md = 'Use value > 10 and value < 20'
        const html = renderMarkdown(md)

        expect(html).toContain('&gt;')
        expect(html).toContain('&lt;')
      })

      it('should escape double quotes', () => {
        const md = 'He said "hello"'
        const html = renderMarkdown(md)

        expect(html).toContain('&quot;hello&quot;')
      })
    })

    describe('lists', () => {
      it('should render unordered lists', () => {
        const md = '- Item one\n- Item two\n- Item three'
        const html = renderMarkdown(md)

        expect(html).toContain('<ul')
        expect(html).toContain('<li class="text-gray-700">Item one</li>')
        expect(html).toContain('<li class="text-gray-700">Item two</li>')
        expect(html).toContain('</ul>')
      })

      it('should handle different bullet markers', () => {
        const md = '* Star item\n+ Plus item\n- Dash item'
        const html = renderMarkdown(md)

        expect(html).toContain('Star item')
        expect(html).toContain('Plus item')
        expect(html).toContain('Dash item')
      })

      it('should render ordered lists', () => {
        const md = '1. First\n2. Second\n3. Third'
        const html = renderMarkdown(md)

        expect(html).toContain('<ol')
        expect(html).toContain('<li class="text-gray-700">First</li>')
        expect(html).toContain('<li class="text-gray-700">Second</li>')
        expect(html).toContain('<li class="text-gray-700">Third</li>')
      })
    })

    describe('blockquotes', () => {
      it('should render blockquotes', () => {
        const md = '> This is a quote'
        const html = renderMarkdown(md)

        expect(html).toContain('<blockquote')
        expect(html).toContain('This is a quote')
        expect(html).toContain('</blockquote>')
      })

      it('should handle multi-line blockquotes', () => {
        const md = '> Line one\n> Line two'
        const html = renderMarkdown(md)

        expect(html).toContain('Line one')
        expect(html).toContain('Line two')
        // Should be a single blockquote
        const blockquoteCount = (html.match(/<blockquote/g) || []).length
        expect(blockquoteCount).toBe(1)
      })
    })

    describe('horizontal rules', () => {
      it('should render hr from dashes', () => {
        const md = 'Above\n\n---\n\nBelow'
        const html = renderMarkdown(md)

        expect(html).toContain('<hr')
      })

      it('should render hr from asterisks', () => {
        const md = '***'
        const html = renderMarkdown(md)

        expect(html).toContain('<hr')
      })
    })

    describe('paragraphs', () => {
      it('should wrap text in paragraph tags', () => {
        const md = 'Simple paragraph text'
        const html = renderMarkdown(md)

        expect(html).toContain('<p')
        expect(html).toContain('Simple paragraph text')
        expect(html).toContain('</p>')
      })

      it('should separate paragraphs on blank lines', () => {
        const md = 'First paragraph.\n\nSecond paragraph.'
        const html = renderMarkdown(md)

        const pCount = (html.match(/<p /g) || []).length
        expect(pCount).toBe(2)
      })

      it('should join consecutive lines into one paragraph', () => {
        const md = 'Line one\nLine two\nLine three'
        const html = renderMarkdown(md)

        expect(html).toContain('Line one Line two Line three')
        const pCount = (html.match(/<p /g) || []).length
        expect(pCount).toBe(1)
      })
    })

    describe('edge cases', () => {
      it('should handle empty input', () => {
        expect(renderMarkdown('')).toBe('')
      })

      it('should handle whitespace-only input', () => {
        expect(renderMarkdown('   \n   \n   ')).toBe('')
      })

      it('should handle mixed content', () => {
        const md = [
          '# Title',
          '',
          'A paragraph with **bold** and *italic*.',
          '',
          '- List item 1',
          '- List item 2',
          '',
          '> A quote',
          '',
          '---',
          '',
          'Final paragraph.',
        ].join('\n')

        const html = renderMarkdown(md)

        expect(html).toContain('<h1')
        expect(html).toContain('<strong>bold</strong>')
        expect(html).toContain('<em>italic</em>')
        expect(html).toContain('<ul')
        expect(html).toContain('<blockquote')
        expect(html).toContain('<hr')
      })
    })
  })

  describe('extractTOC', () => {
    it('should extract h2 and h3 headings', () => {
      const md = '# Title\n## Section One\n### Sub-section\n## Section Two\n#### Ignored'
      const toc = extractTOC(md)

      expect(toc).toHaveLength(3)
      expect(toc[0]).toEqual({ level: 2, text: 'Section One', id: 'section-one' })
      expect(toc[1]).toEqual({ level: 3, text: 'Sub-section', id: 'sub-section' })
      expect(toc[2]).toEqual({ level: 2, text: 'Section Two', id: 'section-two' })
    })

    it('should strip bold/italic markers from heading text', () => {
      const md = '## **Bold Heading**\n### *Italic Heading*'
      const toc = extractTOC(md)

      expect(toc[0].text).toBe('Bold Heading')
      expect(toc[1].text).toBe('Italic Heading')
    })

    it('should return empty array for no headings', () => {
      const md = 'Just plain text\nwith no headings'
      const toc = extractTOC(md)

      expect(toc).toEqual([])
    })

    it('should skip h1 headings (title)', () => {
      const md = '# Main Title'
      const toc = extractTOC(md)

      expect(toc).toEqual([])
    })

    it('should generate URL-safe IDs', () => {
      const md = "## What's New in 2026?"
      const toc = extractTOC(md)

      expect(toc[0].id).toBe('what-s-new-in-2026')
    })
  })
})
