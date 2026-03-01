/**
 * Lightweight markdown-to-HTML renderer for travel guide content.
 * Handles: headings, bold, italic, links, lists, paragraphs, blockquotes, horizontal rules.
 * Does NOT handle tables, images, or code blocks (not needed for guide content).
 */

// Sanitize HTML entities to prevent XSS
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// Process inline formatting (bold, italic, links, inline code)
function processInline(text: string): string {
  let result = escapeHtml(text)

  // Links: [text](url)
  result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary-600 hover:text-primary-700 underline">$1</a>')

  // Bold + italic: ***text***
  result = result.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')

  // Bold: **text**
  result = result.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')

  // Italic: *text*
  result = result.replace(/\*(.+?)\*/g, '<em>$1</em>')

  // Inline code: `text`
  result = result.replace(/`(.+?)`/g, '<code class="px-1.5 py-0.5 bg-gray-100 rounded text-sm">$1</code>')

  return result
}

export function renderMarkdown(markdown: string): string {
  const lines = markdown.split('\n')
  const html: string[] = []
  let inList = false
  let inBlockquote = false
  let paragraphBuffer: string[] = []

  function flushParagraph() {
    if (paragraphBuffer.length > 0) {
      html.push(`<p class="text-gray-700 leading-relaxed mb-4">${processInline(paragraphBuffer.join(' '))}</p>`)
      paragraphBuffer = []
    }
  }

  function closeList() {
    if (inList) {
      html.push('</ul>')
      inList = false
    }
  }

  function closeBlockquote() {
    if (inBlockquote) {
      html.push('</blockquote>')
      inBlockquote = false
    }
  }

  for (const line of lines) {
    const trimmed = line.trim()

    // Empty line — flush paragraph
    if (!trimmed) {
      flushParagraph()
      closeList()
      closeBlockquote()
      continue
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      flushParagraph()
      closeList()
      closeBlockquote()
      html.push('<hr class="my-8 border-gray-200" />')
      continue
    }

    // Headings
    const headingMatch = trimmed.match(/^(#{1,4})\s+(.+)$/)
    if (headingMatch) {
      flushParagraph()
      closeList()
      closeBlockquote()
      const level = headingMatch[1].length
      const text = processInline(headingMatch[2])
      const id = headingMatch[2].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      const classes: Record<number, string> = {
        1: 'text-3xl font-bold text-gray-900 mt-10 mb-4',
        2: 'text-2xl font-bold text-gray-900 mt-8 mb-3',
        3: 'text-xl font-semibold text-gray-800 mt-6 mb-2',
        4: 'text-lg font-semibold text-gray-800 mt-4 mb-2',
      }
      html.push(`<h${level} id="${id}" class="${classes[level]}">${text}</h${level}>`)
      continue
    }

    // Blockquote
    if (trimmed.startsWith('>')) {
      flushParagraph()
      closeList()
      if (!inBlockquote) {
        html.push('<blockquote class="border-l-4 border-primary-300 pl-4 py-2 my-4 bg-primary-50/50 rounded-r">')
        inBlockquote = true
      }
      const content = processInline(trimmed.replace(/^>\s?/, ''))
      html.push(`<p class="text-gray-700 italic">${content}</p>`)
      continue
    } else if (inBlockquote) {
      closeBlockquote()
    }

    // Unordered list
    if (/^[-*+]\s/.test(trimmed)) {
      flushParagraph()
      closeBlockquote()
      if (!inList) {
        html.push('<ul class="list-disc pl-6 mb-4 space-y-1.5">')
        inList = true
      }
      const content = processInline(trimmed.replace(/^[-*+]\s+/, ''))
      html.push(`<li class="text-gray-700">${content}</li>`)
      continue
    }

    // Ordered list
    const olMatch = trimmed.match(/^(\d+)\.\s+(.+)/)
    if (olMatch) {
      flushParagraph()
      closeBlockquote()
      if (!inList) {
        html.push('<ol class="list-decimal pl-6 mb-4 space-y-1.5">')
        inList = true
      }
      const content = processInline(olMatch[2])
      html.push(`<li class="text-gray-700">${content}</li>`)
      continue
    }

    // Close list if we hit non-list content
    if (inList) {
      closeList()
    }

    // Regular text — accumulate into paragraph
    paragraphBuffer.push(trimmed)
  }

  // Flush remaining content
  flushParagraph()
  closeList()
  closeBlockquote()

  return html.join('\n')
}

/**
 * Extract table of contents from markdown headings
 */
export function extractTOC(markdown: string): { level: number; text: string; id: string }[] {
  const toc: { level: number; text: string; id: string }[] = []
  const lines = markdown.split('\n')

  for (const line of lines) {
    const match = line.trim().match(/^(#{2,3})\s+(.+)$/)
    if (match) {
      const level = match[1].length
      const text = match[2].replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1')
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      toc.push({ level, text, id })
    }
  }

  return toc
}
