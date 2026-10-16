import { describe, expect, it, vi } from 'vitest'
import provider, { init, toSendParams } from './index'

function fakeFetch() {
  return vi.fn(async () =>
    new Response(JSON.stringify({ id: 'em_123', status: 'queued' }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }),
  )
}

describe('strapi-provider-email-groundmail', () => {
  it('exposes the Strapi provider shape', () => {
    expect(typeof provider.init).toBe('function')
    expect(typeof init({ apiKey: 'gm_test' }).send).toBe('function')
  })

  it('sends through the Groundmail API with default settings', async () => {
    const fetch = fakeFetch()
    const mailer = init(
      { apiKey: 'gm_test_key', baseUrl: 'https://api.test', fetch },
      { defaultFrom: 'Acme <noreply@acme.test>', defaultReplyTo: 'support@acme.test' },
    )

    const result = await mailer.send({ to: 'user@example.com', subject: 'Welcome', html: '<p>Hi</p>', text: 'Hi' })
    expect(result).toEqual({ id: 'em_123', status: 'queued' })

    const [url, request] = fetch.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('https://api.test/emails')
    expect(new Headers(request.headers).get('authorization')).toBe('Bearer gm_test_key')
    expect(JSON.parse(String(request.body))).toMatchObject({
      from: 'Acme <noreply@acme.test>',
      to: 'user@example.com',
      reply_to: 'support@acme.test',
      subject: 'Welcome',
      html: '<p>Hi</p>',
      text: 'Hi',
    })
  })

  it('maps addresses, attachments and Groundmail extras', () => {
    const params = toSendParams({
      from: { name: 'Acme', address: 'billing@acme.test' },
      to: ['a@example.com', { name: 'B', email: 'b@example.com' }],
      cc: 'c@example.com',
      bcc: ['d@example.com'],
      replyTo: 'help@acme.test',
      subject: 'Invoice',
      text: 'Attached',
      attachments: [
        { filename: 'a.txt', content: 'hello', contentType: 'text/plain' },
        { filename: 'b.pdf', content: Buffer.from('pdf') },
        { filename: 'c.bin', content: 'aGk=', encoding: 'base64', cid: 'logo' },
      ],
      headers: { 'X-Entity-Ref-ID': '42' },
      tags: { category: 'invoice' },
      idempotencyKey: 'invoice-42',
    })

    expect(params).toEqual({
      from: 'Acme <billing@acme.test>',
      to: ['a@example.com', 'B <b@example.com>'],
      cc: ['c@example.com'],
      bcc: ['d@example.com'],
      replyTo: 'help@acme.test',
      subject: 'Invoice',
      text: 'Attached',
      attachments: [
        { filename: 'a.txt', contentType: 'text/plain', content: Buffer.from('hello').toString('base64') },
        { filename: 'b.pdf', contentType: 'application/octet-stream', content: Buffer.from('pdf').toString('base64') },
        { filename: 'c.bin', contentType: 'application/octet-stream', content: 'aGk=', contentId: 'logo' },
      ],
      headers: { 'X-Entity-Ref-ID': '42' },
      tags: { category: 'invoice' },
      idempotencyKey: 'invoice-42',
    })
  })

  it('requires a From address and a recipient', () => {
    expect(() => toSendParams({ to: 'a@example.com', text: 'x' })).toThrow(/defaultFrom/)
    expect(() => toSendParams({ from: 'a@acme.test', text: 'x' })).toThrow(/To recipient/)
  })

  it('reports a missing API key on send, then recovers once one is set', async () => {
    const saved = process.env.GROUNDMAIL_API_KEY
    delete process.env.GROUNDMAIL_API_KEY
    try {
      const mailer = init({ fetch: fakeFetch() }, { defaultFrom: 'a@acme.test' })
      await expect(mailer.send({ to: 'b@example.com', text: 'x' })).rejects.toThrow(/GROUNDMAIL_API_KEY/)
      process.env.GROUNDMAIL_API_KEY = 'gm_env_key'
      await expect(mailer.send({ to: 'b@example.com', text: 'x' })).resolves.toMatchObject({ id: 'em_123' })
    } finally {
      if (saved === undefined) delete process.env.GROUNDMAIL_API_KEY
      else process.env.GROUNDMAIL_API_KEY = saved
    }
  })
})

describe('verify', () => {
  const respond = (status: number) =>
    vi.fn(async () => new Response(JSON.stringify(status === 200 ? { domains: [] } : { error: 'nope' }), { status }))

  it('is true for a working key, including a send-only key', async () => {
    await expect(init({ apiKey: 'gm_ok', fetch: respond(200) }).verify()).resolves.toBe(true)
    await expect(init({ apiKey: 'gm_send_only', fetch: respond(403) }).verify()).resolves.toBe(true)
  })

  it('is false for a rejected key', async () => {
    await expect(init({ apiKey: 'gm_bad', fetch: respond(401) }).verify()).resolves.toBe(false)
  })
})
