## Local Setup

Create `.env.local` from `.env.example`, then run the development server:

```bash
npm run dev
```

Expected local API:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api/v1
```

Open `http://localhost:3000`.

The site reads website content from the backend API and falls back to local placeholder content if the backend is unavailable.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
