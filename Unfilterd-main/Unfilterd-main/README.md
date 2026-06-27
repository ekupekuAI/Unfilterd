# Unfilterd

[![Open in Bolt](https://bolt.new/static/open-in-bolt.svg)](https://bolt.new/~/sb1-bxaw6ye6)

## Production Notes

### Environment

Set these variables in `.env.local`:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Supabase Setup

- Run the additive SQL migration from `supabase/migrations`.
- Create the storage buckets `post-media` and `community-assets`.
- Enable public read access on those buckets if you want post previews to render without signed URLs.

### Routes

- `/` feed
- `/explore`
- `/search`
- `/communities`
- `/analytics`
- `/admin`

### Deployment

- `npm run typecheck`
- `npm run lint`
- `npm run build`
