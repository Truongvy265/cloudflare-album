# Saigon Tếu photo albums

Cloudflare Pages hosts the customer-facing album and its Pages Functions API.
Supabase stores private session metadata. ImgBB remains the image host.

## 1. Create the Supabase table

Open Supabase SQL Editor and run:

`supabase/migrations/001_photo_sessions.sql`

Then run the required survey migration:

`supabase/migrations/002_survey_responses.sql`

RLS is enabled and no browser policy is created. Only the service-role key used
inside Cloudflare Pages Functions can read or write session rows.

## 2. Create the Cloudflare Pages project

Create a Pages project with this directory as the project root:

- Build command: leave empty
- Build output directory: `public`
- Functions directory: `functions` (detected automatically)

Configure these variables under **Settings > Variables and Secrets**:

- `SUPABASE_URL`: `https://YOUR_PROJECT.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY`: mark as encrypted secret
- `PHOTOBOOTH_API_SECRET`: mark as encrypted secret; use at least 32 random bytes

Deploy once, then note the Pages domain, for example:
`https://saigon-teu-photo-album.pages.dev`.

## 3. Configure the desktop app

Add these values to the desktop project's `.env` file:

```env
PHOTO_ALBUM_API_URL="https://saigon-teu-photo-album.pages.dev"
PHOTO_ALBUM_PUBLIC_URL="https://saigon-teu-photo-album.pages.dev"
PHOTOBOOTH_API_SECRET="THE_SAME_SECRET_CONFIGURED_IN_CLOUDFLARE"
```

`PHOTO_ALBUM_PUBLIC_URL` may use a custom domain while the API URL continues to
use the Pages domain. Never put `SUPABASE_SERVICE_ROLE_KEY` in the desktop `.env`.

## 4. Local development

Copy `.dev.vars.example` to `.dev.vars`, fill in local credentials, then run
Wrangler from this directory:

```powershell
npx wrangler pages dev public
```

Do not commit `.dev.vars`.

## Session lifecycle

Albums expire logically after 30 days. The API stops returning expired rows.
Schedule this SQL in Supabase if physical row deletion is desired:

```sql
delete from public.photo_sessions where expires_at < now();
```

ImgBB files have their own retention policy and are not deleted by this query.

## Survey gate and exports

The public album endpoint returns only session metadata. Image URLs are returned
only after a valid survey is submitted to the session survey endpoint. Survey
answers are stored privately in `public.survey_responses`; the browser never
receives Supabase credentials.

To review or download responses, open **Supabase > Table Editor >
survey_responses**. Use the table filters as needed, then choose **Export data >
CSV**. Survey rows remain available if expired photo session rows are physically
deleted; `session_token` keeps the anonymous link to the original session. Set a
retention/deletion policy appropriate for names, email addresses and phone
numbers before production use.
