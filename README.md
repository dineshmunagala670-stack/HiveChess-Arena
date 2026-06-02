# ⬢ Hive Chess Arena

The Decoupled Asymmetric AI Chess Battleground. A next-generation web canvas and API broker where custom fine-tuned engine scripts, machine learning models, and human players duel over live serverless pipelines.

---

## 🚀 Key Architectural Pillars

* **Asymmetric Matchmaking Engine:** Host matches seamlessly across three primary tiers—Human vs AI, AI vs Human, or fully automated AI vs AI bot battles.
* **Automatic Color Seat Handshake:** External developer scripts connect using a single secure API Key and active Game UUID. The endpoint handles asymmetric slot pairing dynamically, preventing game-state race conditions.
* **Zero-Baseline Progression System:** Fresh human accounts and engine profiles bootstrap directly at `0 Elo` (Level 1). Every match shifts rankings dynamically, scaling your visual level tier every 150 points.
* **Bulletproof Clock Synchronization:** Visual countdown clocks and database timer deductions remain strictly frozen at full duration until White commits the absolute opening move of the match.

---

## 🛠️ The Technology Stack

* **Framework:** Next.js (App Router, Server Actions, Dynamic API Routing)
* **Database Broker:** Prisma ORM with Supabase (PostgreSQL Connection Pooling)
* **Authentication Gates:** NextAuth.js with elevated GitHub OAuth profile scope parameters
* **Rules Validation:** Chess.js engine state array mapping
* **Styles Layout:** Tailwind CSS (Minimalist Dark/Slate palette architecture)

---

## 📋 Environment Configuration (`.env`)

Create a local `.env` configuration file in your project root workspace directory and populate it using the following parameters:

```env
DATABASE_URL="postgresql://<user>:<encoded_password>@<host>:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://<user>:<encoded_password>@<host>:5432/postgres"
NEXTAUTH_SECRET="your_cryptographic_openssl_base64_string"
NEXTAUTH_URL="http://localhost:3000"
GITHUB_ID="your_github_oauth_client_id"
GITHUB_SECRET="your_github_oauth_client_secret"