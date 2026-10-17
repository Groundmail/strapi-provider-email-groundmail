<p align="center">
  <a href="https://groundmail.dev">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://app.groundmail.dev/images/github/readme-logo-dark.png">
      <img alt="Groundmail" src="https://app.groundmail.dev/images/github/readme-logo-light.png" height="44">
    </picture>
  </a>
</p>

<h1 align="center">Groundmail for Strapi</h1>

<p align="center">
  A <a href="https://strapi.io">Strapi</a> email provider for the Groundmail transactional email API.<br>
  Password resets, account confirmations and <code>strapi.plugin('email')</code> sends go out through Groundmail.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/strapi-provider-email-groundmail"><img alt="npm" src="https://img.shields.io/npm/v/strapi-provider-email-groundmail?color=a3461f&label=npm"></a>
  <a href="./LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-b48f62"></a>
</p>

<p align="center">
  <a href="https://docs.groundmail.dev/frameworks/strapi">Docs</a> ·
  <a href="https://app.groundmail.dev/signup">Get a free account</a> ·
  <a href="https://groundmail.dev">groundmail.dev</a>
</p>

---

Works with Strapi 5 and Strapi 4.

## Install

```bash
npm install strapi-provider-email-groundmail
```

```bash
GROUNDMAIL_API_KEY=gm_your_key_here
```

## Configure

```ts
// config/plugins.ts
export default ({ env }) => ({
  email: {
    config: {
      provider: 'strapi-provider-email-groundmail',
      providerOptions: {
        apiKey: env('GROUNDMAIL_API_KEY'),
      },
      settings: {
        defaultFrom: 'Acme <noreply@yourdomain.com>',
        defaultReplyTo: 'support@yourdomain.com',
      },
    },
  },
})
```

The From address must be on a domain you have verified in Groundmail.

## Send

```ts
await strapi.plugin('email').service('email').send({
  to: 'user@example.com',
  subject: 'Welcome to Acme',
  html: '<p>Thanks for signing up.</p>',
  text: 'Thanks for signing up.',
})
```

Besides Strapi's `from`, `to`, `cc`, `bcc`, `replyTo`, `subject`, `text` and `html`, a send can pass:

| Field | Purpose |
|-------|---------|
| `attachments` | `[{ filename, content, contentType }]`, content as a string or Buffer (set `encoding: 'base64'` for base64 strings) |
| `template` | `{ id, variables }` to send a Groundmail template instead of `html`/`text` |
| `tags` | `{ name: value }` tags for filtering and webhooks |
| `headers` | Extra email headers |
| `idempotencyKey` | Send once, even when your code retries |
| `scheduledAt` | ISO 8601 time to send later |

## Options

| `providerOptions` | Purpose |
|-------------------|---------|
| `apiKey` | Groundmail API key. Falls back to `GROUNDMAIL_API_KEY` |
| `baseUrl` | Override the API base URL |

## Contributing

Found a bug or want something added? [Open an issue](https://github.com/Groundmail/strapi-provider-email-groundmail/issues). This code is published here on each release, so we port fixes rather than merging pull requests directly. The HTTP client itself is the [`groundmail`](https://www.npmjs.com/package/groundmail) package.

## Why Groundmail

- **Our own mail servers and IP space.** Your password resets and receipts don't share a pool with bulk marketing senders.
- **Transactional email only.** No newsletters or cold outreach on the platform, which keeps the sending reputation clean.
- **Start free.** 3,000 emails a month on the Free plan; Pro is 50,000 emails for $20/month. Dedicated IPs on Scale.
- **Built for code and for agents.** REST API, SMTP, SDKs for Node, Python, Go, PHP and Ruby, a CLI, and an MCP server for Claude, ChatGPT and Cursor.

## All Groundmail libraries

| Use | Package |
|-----|---------|
| Node.js / TypeScript | [`groundmail`](https://www.npmjs.com/package/groundmail) on npm |
| Python (Django), Go, Ruby (Rails Action Mailer) | [Groundmail/groundmail-sdks](https://github.com/Groundmail/groundmail-sdks) |
| PHP | [Groundmail/groundmail-php](https://github.com/Groundmail/groundmail-php) |
| Laravel | [Groundmail/groundmail-laravel](https://github.com/Groundmail/groundmail-laravel) |
| Symfony Mailer | [Groundmail/groundmail-symfony-mailer](https://github.com/Groundmail/groundmail-symfony-mailer) |
| Nodemailer | [Groundmail/groundmail-nodemailer](https://github.com/Groundmail/groundmail-nodemailer) |
| NestJS | [Groundmail/nestjs-groundmail](https://github.com/Groundmail/nestjs-groundmail) |
| Strapi | [Groundmail/strapi-provider-email-groundmail](https://github.com/Groundmail/strapi-provider-email-groundmail) |
| Medusa | [Groundmail/medusa-notification-groundmail](https://github.com/Groundmail/medusa-notification-groundmail) |
| AdonisJS | [Groundmail/adonisjs-groundmail](https://github.com/Groundmail/adonisjs-groundmail) |
| Phoenix (Swoosh) | [Groundmail/swoosh_groundmail](https://github.com/Groundmail/swoosh_groundmail) |
| CLI | [`groundmail-cli`](https://www.npmjs.com/package/groundmail-cli) on npm |
| MCP server (Claude, ChatGPT, Cursor) | [Groundmail/groundmail-mcp](https://github.com/Groundmail/groundmail-mcp) |
| Agent skills and Claude Code plugin | [Groundmail/groundmail-skills](https://github.com/Groundmail/groundmail-skills) |
| Email templates (React Email, MJML, HTML) | [Groundmail/email-templates](https://github.com/Groundmail/email-templates) |

[Website](https://groundmail.dev) · [Docs](https://docs.groundmail.dev) · [Pricing](https://groundmail.dev/pricing) · [Sign up free](https://app.groundmail.dev/signup)
