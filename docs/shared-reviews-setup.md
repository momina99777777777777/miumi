# Set up shared Miumi reviews

The Reviews tab uses Supabase's REST API. The browser only needs the Supabase project URL and anon/public key. Never put a Supabase service-role key in frontend code or a VITE_ variable.

## 1. Create a Supabase project

Create a project in Supabase using an account that meets Supabase's age and account requirements. If you need an adult to help with account ownership, keep that arrangement transparent.

## 2. Create the reviews table

In the Supabase dashboard, open SQL Editor, paste the contents of supabase/migrations/202611140001_miumi_reviews.sql, and run it. This creates the public reviews table and row-level security policies. Visitors can read reviews and submit new ones; reviews are public and currently unmoderated. Add moderation and rate limiting before promoting the feature widely.

## 3. Add the public project settings to Cloudflare Pages

In Cloudflare Dashboard → Workers & Pages → your Miumi Pages project → Settings → Environment variables, add these for the Production environment (and Preview too if you want preview deployments to use reviews):

- VITE_SUPABASE_URL = your Supabase Project URL
- VITE_SUPABASE_ANON_KEY = your Supabase anon/public key

These are public browser settings. Do not use service_role or any secret key here. Trigger a new deployment after saving them.

## 4. Verify

Open Miumi → Miumi Picks → Reviews. Submit a test review, then open the page in another browser/device to confirm the review appears there too.

If the table is empty, the page should show no reviews. If the environment variables are missing, the form stays disabled until setup is complete.