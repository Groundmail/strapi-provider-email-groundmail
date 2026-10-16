/**
 * Strapi email provider for Groundmail.
 *
 * The `groundmail` SDK ships ES modules only and Strapi loads providers with
 * `require()`, so the client is loaded with `import()` on first send.
 */
type Groundmail = import('groundmail', { with: { 'resolution-mode': 'import' } }).Groundmail
type SendEmailParams = import('groundmail', { with: { 'resolution-mode': 'import' } }).SendEmailParams
type SendEmailResult = import('groundmail', { with: { 'resolution-mode': 'import' } }).SendEmailResult

export type ProviderOptions = {
  /** Groundmail API key (`gm_…`). Falls back to `GROUNDMAIL_API_KEY`. */
  apiKey?: string
  /** Override the API base URL. */
  baseUrl?: string
  /** Custom fetch implementation (tests, proxies). */
  fetch?: typeof fetch
  /** Use this client instead of building one (tests). */
  client?: Groundmail
}

export type Settings = {
  /** From address used when a send has none. Must be on a verified domain. */
  defaultFrom?: string
  /** Reply-To used when a send has none. */
  defaultReplyTo?: string | string[]
}

type Address = string | { name?: string; address?: string; email?: string }
type AddressInput = Address | Address[] | undefined

export type StrapiAttachment = {
  filename?: string
  /** Base64 string, plain string or Buffer. */
  content?: string | Uint8Array
  contentType?: string
  /** Set `encoding: 'base64'` when `content` is already base64. */
  encoding?: string
  cid?: string
}

/** The options Strapi's email service passes to `send`, plus Groundmail extras. */
export type SendOptions = {
  from?: Address
  to?: AddressInput
  cc?: AddressInput
  bcc?: AddressInput
  replyTo?: AddressInput
  subject?: string
  text?: string
  html?: string
  attachments?: StrapiAttachment[]
  headers?: Record<string, string>
  tags?: Array<{ name: string; value: string }> | Record<string, string>
  template?: SendEmailParams['template']
  scheduledAt?: string | Date
  idempotencyKey?: string
  [key: string]: unknown
}

function formatAddress(value: Address): string {
  if (typeof value === 'string') return value.trim()
  const email = (value.address ?? value.email ?? '').trim()
  if (!email) return ''
  return value.name ? `${value.name} <${email}>` : email
}

function addressList(value: AddressInput): string[] {
  if (value == null) return []
  return (Array.isArray(value) ? value : [value]).map(formatAddress).filter(Boolean)
}

function single(list: string[]): string | string[] {
  return list.length === 1 ? list[0] : list
}

function toBase64(attachment: StrapiAttachment): string {
  const { content, encoding } = attachment
  if (content == null) throw new Error(`Attachment "${attachment.filename ?? 'attachment'}" has no content.`)
  if (typeof content === 'string') {
    return encoding === 'base64' ? content : Buffer.from(content, (encoding as BufferEncoding) || 'utf8').toString('base64')
  }
  return Buffer.from(content).toString('base64')
}

/** Map Strapi send options to a Groundmail send request. */
export function toSendParams(options: SendOptions, settings: Settings = {}): SendEmailParams {
  const {
    from,
    to,
    cc,
    bcc,
    replyTo,
    subject,
    text,
    html,
    attachments,
    headers,
    tags,
    template,
    scheduledAt,
    idempotencyKey,
  } = options

  const sender = from ? formatAddress(from) : settings.defaultFrom
  if (!sender) throw new Error('Email has no From address. Pass `from` or set `settings.defaultFrom`.')
  const recipients = addressList(to)
  if (!recipients.length) throw new Error('Email has no To recipient.')

  const params: SendEmailParams = { from: sender, to: single(recipients) }
  if (subject) params.subject = subject
  if (html) params.html = html
  if (text) params.text = text
  if (template) params.template = template

  const replies = replyTo ? addressList(replyTo) : addressList(settings.defaultReplyTo)
  if (replies.length) params.replyTo = single(replies)
  const ccList = addressList(cc)
  if (ccList.length) params.cc = ccList
  const bccList = addressList(bcc)
  if (bccList.length) params.bcc = bccList

  if (attachments?.length) {
    params.attachments = attachments.map((attachment) => ({
      filename: attachment.filename || 'attachment',
      contentType: attachment.contentType || 'application/octet-stream',
      content: toBase64(attachment),
      ...(attachment.cid ? { contentId: attachment.cid } : {}),
    }))
  }
  if (headers && Object.keys(headers).length) params.headers = headers
  if (tags) params.tags = tags
  if (scheduledAt) params.scheduledAt = scheduledAt
  if (idempotencyKey) params.idempotencyKey = idempotencyKey
  return params
}

async function createClient(options: ProviderOptions): Promise<Groundmail> {
  if (options.client) return options.client
  const apiKey = options.apiKey || process.env.GROUNDMAIL_API_KEY
  if (!apiKey) {
    throw new Error('Groundmail API key is missing. Set providerOptions.apiKey or GROUNDMAIL_API_KEY.')
  }
  const { Groundmail } = await import('groundmail')
  return new Groundmail(apiKey, { baseUrl: options.baseUrl, fetch: options.fetch })
}

export function init(providerOptions: ProviderOptions = {}, settings: Settings = {}) {
  let client: Promise<Groundmail> | undefined
  const getClient = () =>
    (client ??= createClient(providerOptions).catch((error: unknown) => {
      client = undefined
      throw error
    }))

  return {
    async send(options: SendOptions): Promise<SendEmailResult> {
      const params = toSendParams(options, settings)
      return (await getClient()).emails.send(params)
    },
    /** Used by Strapi's connection check: true when the API key is accepted. */
    async verify(): Promise<boolean> {
      try {
        await (await getClient()).domains.list({ limit: 1 })
        return true
      } catch (error) {
        // A send-only key is valid but may not list domains.
        return (error as { status?: number }).status === 403
      }
    },
  }
}

export default { init }
