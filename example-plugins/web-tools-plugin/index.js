const https = require('https')
const http = require('http')
const { URL } = require('url')

class WebToolsPlugin {
  constructor(api) {
    this.api = api
    this.name = 'Web Tools Plugin'
  }

  async activate() {
    console.log(`${this.name} activated`)
  }

  async deactivate() {
    console.log(`${this.name} deactivated`)
  }

  getTools() {
    return [
      {
        name: 'fetch_url',
        description: 'Fetch content from a URL',
        inputSchema: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'The URL to fetch'
            },
            options: {
              type: 'object',
              properties: {
                headers: {
                  type: 'object',
                  description: 'Optional HTTP headers'
                },
                timeout: {
                  type: 'number',
                  description: 'Timeout in milliseconds (default: 10000)'
                }
              }
            }
          },
          required: ['url']
        }
      },
      {
        name: 'extract_links',
        description: 'Extract all links from HTML content',
        inputSchema: {
          type: 'object',
          properties: {
            html: {
              type: 'string',
              description: 'HTML content to extract links from'
            },
            baseUrl: {
              type: 'string',
              description: 'Base URL for resolving relative links'
            }
          },
          required: ['html']
        }
      },
      {
        name: 'parse_url',
        description: 'Parse a URL into its components',
        inputSchema: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'URL to parse'
            }
          },
          required: ['url']
        }
      }
    ]
  }

  async executeTool(toolName, args) {
    switch (toolName) {
      case 'fetch_url':
        return this.fetchUrl(args.url, args.options)

      case 'extract_links':
        return this.extractLinks(args.html, args.baseUrl)

      case 'parse_url':
        return this.parseUrl(args.url)

      default:
        throw new Error(`Unknown tool: ${toolName}`)
    }
  }

  async fetchUrl(urlString, options = {}) {
    try {
      const url = new URL(urlString)
      const timeout = options.timeout || 10000

      return new Promise((resolve, reject) => {
        const protocol = url.protocol === 'https:' ? https : http

        const requestOptions = {
          hostname: url.hostname,
          port: url.port,
          path: url.pathname + url.search,
          method: 'GET',
          headers: {
            'User-Agent': 'MiaoDa-Chat/1.0',
            ...options.headers
          },
          timeout
        }

        const req = protocol.request(requestOptions, res => {
          let data = ''

          res.on('data', chunk => {
            data += chunk
          })

          res.on('end', () => {
            resolve({
              url: urlString,
              status: res.statusCode,
              headers: res.headers,
              contentType: res.headers['content-type'],
              contentLength: data.length,
              content: data.substring(0, 5000), // Limit content to 5000 chars
              truncated: data.length > 5000
            })
          })
        })

        req.on('error', error => {
          resolve({
            url: urlString,
            error: error.message
          })
        })

        req.on('timeout', () => {
          req.destroy()
          resolve({
            url: urlString,
            error: 'Request timeout'
          })
        })

        req.end()
      })
    } catch (error) {
      return {
        url: urlString,
        error: `Invalid URL: ${error.message}`
      }
    }
  }

  extractLinks(html, baseUrl) {
    try {
      // Simple regex-based link extraction
      const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>/gi
      const links = []
      let match

      while ((match = linkRegex.exec(html)) !== null) {
        let href = match[1]

        // Resolve relative URLs if baseUrl provided
        if (baseUrl) {
          try {
            const resolved = new URL(href, baseUrl)
            href = resolved.href
          } catch (e) {
            // Keep original if resolution fails
          }
        }

        links.push(href)
      }

      // Also extract src attributes from img, script, link tags
      const srcRegex = /<(?:img|script|link)[^>]+(?:src|href)=["']([^"']+)["'][^>]*>/gi
      while ((match = srcRegex.exec(html)) !== null) {
        let src = match[1]

        if (baseUrl) {
          try {
            const resolved = new URL(src, baseUrl)
            src = resolved.href
          } catch (e) {
            // Keep original if resolution fails
          }
        }

        links.push(src)
      }

      // Remove duplicates
      const uniqueLinks = [...new Set(links)]

      return {
        totalLinks: uniqueLinks.length,
        links: uniqueLinks,
        baseUrl: baseUrl || 'not provided'
      }
    } catch (error) {
      return {
        error: `Failed to extract links: ${error.message}`
      }
    }
  }

  parseUrl(urlString) {
    try {
      const url = new URL(urlString)

      return {
        href: url.href,
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? '443' : '80'),
        pathname: url.pathname,
        search: url.search,
        hash: url.hash,
        host: url.host,
        origin: url.origin,
        searchParams: Object.fromEntries(url.searchParams)
      }
    } catch (error) {
      return {
        error: `Invalid URL: ${error.message}`,
        input: urlString
      }
    }
  }
}

module.exports = WebToolsPlugin
