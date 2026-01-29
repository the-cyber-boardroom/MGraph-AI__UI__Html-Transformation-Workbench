/**
 * Markdown Parser Service
 *
 * Purpose: Shared markdown parsing service with event-driven communication
 * Version: v0.1.6
 *
 * Provides markdown to HTML conversion for use by multiple components.
 * Emits events when parsing is complete.
 */

(function() {
    'use strict';

    class MarkdownParser {
        constructor() {
            this._cache = new Map();
        }

        /**
         * Parse markdown string to HTML
         * @param {string} markdown - Raw markdown text
         * @param {object} options - Parsing options
         * @returns {string} HTML string
         */
        parse(markdown, options = {}) {
            if (!markdown) return '';

            // Check cache
            const cacheKey = markdown + JSON.stringify(options);
            if (this._cache.has(cacheKey)) {
                return this._cache.get(cacheKey);
            }

            let html = markdown;

            // Process code blocks first (to protect them from other transformations)
            const codeBlocks = [];
            html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
                const index = codeBlocks.length;
                codeBlocks.push({ lang, code: this._escapeHtml(code.trim()) });
                return `%%CODEBLOCK_${index}%%`;
            });

            // Inline code (protect from other transformations)
            const inlineCodes = [];
            html = html.replace(/`([^`]+)`/g, (match, code) => {
                const index = inlineCodes.length;
                inlineCodes.push(this._escapeHtml(code));
                return `%%INLINECODE_${index}%%`;
            });

            // Headers (h1-h6)
            html = html.replace(/^######\s+(.+)$/gm, '<h6>$1</h6>');
            html = html.replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>');
            html = html.replace(/^####\s+(.+)$/gm, '<h4>$1</h4>');
            html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
            html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
            html = html.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');

            // Horizontal rules
            html = html.replace(/^---+$/gm, '<hr>');
            html = html.replace(/^\*\*\*+$/gm, '<hr>');

            // Bold and italic
            html = html.replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>');
            html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
            html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
            html = html.replace(/___([^_]+)___/g, '<strong><em>$1</em></strong>');
            html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');
            html = html.replace(/_([^_]+)_/g, '<em>$1</em>');

            // Links
            html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

            // Images
            html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%;">');

            // Unordered lists
            html = this._parseLists(html);

            // Blockquotes
            html = html.replace(/^>\s+(.+)$/gm, '<blockquote>$1</blockquote>');
            // Merge adjacent blockquotes
            html = html.replace(/<\/blockquote>\n<blockquote>/g, '\n');

            // Tables (basic support)
            html = this._parseTables(html);

            // Paragraphs - wrap remaining text blocks
            html = this._wrapParagraphs(html);

            // Restore code blocks
            codeBlocks.forEach((block, index) => {
                const langClass = block.lang ? ` class="language-${block.lang}"` : '';
                html = html.replace(
                    `%%CODEBLOCK_${index}%%`,
                    `<pre><code${langClass}>${block.code}</code></pre>`
                );
            });

            // Restore inline code
            inlineCodes.forEach((code, index) => {
                html = html.replace(`%%INLINECODE_${index}%%`, `<code>${code}</code>`);
            });

            // Cache result
            this._cache.set(cacheKey, html);

            // Emit event
            this._emitParsed(markdown, html);

            return html;
        }

        /**
         * Parse markdown and return as DOM element
         * @param {string} markdown - Raw markdown text
         * @returns {HTMLElement} DOM element containing parsed HTML
         */
        parseToElement(markdown) {
            const html = this.parse(markdown);
            const container = document.createElement('div');
            container.className = 'markdown-content';
            container.innerHTML = html;
            return container;
        }

        /**
         * Clear the parsing cache
         */
        clearCache() {
            this._cache.clear();
        }

        _parseLists(html) {
            const lines = html.split('\n');
            const result = [];
            let inList = false;
            let listType = null;
            let currentIndent = 0;

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                const ulMatch = line.match(/^(\s*)[-*]\s+(.+)$/);
                const olMatch = line.match(/^(\s*)\d+\.\s+(.+)$/);

                if (ulMatch) {
                    if (!inList || listType !== 'ul') {
                        if (inList) result.push(listType === 'ul' ? '</ul>' : '</ol>');
                        result.push('<ul>');
                        inList = true;
                        listType = 'ul';
                    }
                    result.push(`<li>${ulMatch[2]}</li>`);
                } else if (olMatch) {
                    if (!inList || listType !== 'ol') {
                        if (inList) result.push(listType === 'ul' ? '</ul>' : '</ol>');
                        result.push('<ol>');
                        inList = true;
                        listType = 'ol';
                    }
                    result.push(`<li>${olMatch[2]}</li>`);
                } else {
                    if (inList) {
                        result.push(listType === 'ul' ? '</ul>' : '</ol>');
                        inList = false;
                        listType = null;
                    }
                    result.push(line);
                }
            }

            if (inList) {
                result.push(listType === 'ul' ? '</ul>' : '</ol>');
            }

            return result.join('\n');
        }

        _parseTables(html) {
            const lines = html.split('\n');
            const result = [];
            let inTable = false;
            let headerDone = false;

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();

                // Check if this is a table row
                if (line.startsWith('|') && line.endsWith('|')) {
                    const cells = line.slice(1, -1).split('|').map(c => c.trim());

                    // Check if this is the separator row
                    if (cells.every(c => /^[-:]+$/.test(c))) {
                        headerDone = true;
                        continue;
                    }

                    if (!inTable) {
                        result.push('<table>');
                        inTable = true;
                    }

                    const tag = !headerDone ? 'th' : 'td';
                    const row = cells.map(c => `<${tag}>${c}</${tag}>`).join('');
                    result.push(`<tr>${row}</tr>`);
                } else {
                    if (inTable) {
                        result.push('</table>');
                        inTable = false;
                        headerDone = false;
                    }
                    result.push(lines[i]);
                }
            }

            if (inTable) {
                result.push('</table>');
            }

            return result.join('\n');
        }

        _wrapParagraphs(html) {
            const lines = html.split('\n');
            const result = [];
            let paragraph = [];

            const isBlockElement = (line) => {
                const trimmed = line.trim();
                return trimmed.startsWith('<h') ||
                       trimmed.startsWith('<ul') ||
                       trimmed.startsWith('<ol') ||
                       trimmed.startsWith('<li') ||
                       trimmed.startsWith('</ul') ||
                       trimmed.startsWith('</ol') ||
                       trimmed.startsWith('</li') ||
                       trimmed.startsWith('<pre') ||
                       trimmed.startsWith('<blockquote') ||
                       trimmed.startsWith('<hr') ||
                       trimmed.startsWith('<table') ||
                       trimmed.startsWith('<tr') ||
                       trimmed.startsWith('</table') ||
                       trimmed.startsWith('%%CODEBLOCK');
            };

            for (const line of lines) {
                if (line.trim() === '') {
                    if (paragraph.length > 0) {
                        result.push(`<p>${paragraph.join(' ')}</p>`);
                        paragraph = [];
                    }
                } else if (isBlockElement(line)) {
                    if (paragraph.length > 0) {
                        result.push(`<p>${paragraph.join(' ')}</p>`);
                        paragraph = [];
                    }
                    result.push(line);
                } else {
                    paragraph.push(line);
                }
            }

            if (paragraph.length > 0) {
                result.push(`<p>${paragraph.join(' ')}</p>`);
            }

            return result.join('\n');
        }

        _escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        _emitParsed(markdown, html) {
            if (window.workbench && window.workbench.events) {
                window.workbench.events.emit('markdown-parsed', {
                    inputLength: markdown.length,
                    outputLength: html.length,
                    timestamp: new Date().toISOString()
                });
            }
        }
    }

    // Initialize workbench if needed
    window.workbench = window.workbench || {};

    // Create and expose the parser instance
    window.workbench.markdown = new MarkdownParser();

    console.log('[v0.1.6] Markdown parser service initialized');

})();
