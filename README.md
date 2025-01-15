# Postman API Testing Platform

A modern, Next.js-based API testing platform with built-in caching and rate limiting capabilities.

## Features

- 🚀 Built with Next.js 14 and React 19
- 💻 Modern TypeScript codebase
- 🎨 Sleek UI with Tailwind CSS and shadcn/ui components
- 🔄 Built-in request caching with Redis
- 🛡️ Rate limiting protection
- ⚡ Real-time response statistics
- 🌐 Proxy support for API requests

## Tech Stack

- **Framework:** Next.js 14
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **Caching:** Upstash Redis
- **State Management:** React Hooks
- **Animations:** Framer Motion

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Redis instance (for caching)

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/postman.git
cd postman
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Configure the following variables in `.env.local`:
```
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token
```

4. Run the development server:
```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## API Routes

### POST /api/proxy

Proxies API requests with optional caching and rate limiting.

```typescript
{
  url: string;
  method: string;
  headers?: Record<string, string>;
  body?: string;
  cache?: {
    enabled: boolean;
    ttl?: number;
  };
}
```

## Rate Limiting

- 20 requests per minute per IP
- Configurable through environment variables

## Caching

- Redis-based caching system
- Configurable TTL (default: 30 seconds)
- Cache invalidation on POST/PUT/DELETE requests

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Next.js](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Upstash Redis](https://upstash.com/)
