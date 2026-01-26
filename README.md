# EMP Checker

A robust image verification and uniqueness checking tool built with the T3 Stack. This application allows users to upload images and verify their "realness" or uniqueness against a database of previously scanned images using both perceptual hashing (pHash) and vector embeddings.

## 🚀 Features

-   **Image Uniqueness Check:** Uses Perceptual Hashing (pHash) to detect exact or near-exact duplicates.
-   **Semantic Search:** Uses Vector Embeddings (via Pinecone) to detect semantically similar images even if they are resized or slightly modified.
-   **Provenance Tracking:** Tracks who "scanned" (uploaded) an image first.
-   **"Realness" Verification:** specific logic to determine if an image is "Real" or "Fake" based on trusted uploaders (e.g., specific Discord users).
-   **Discord Authentication:** Secure login using Discord via Better Auth.
-   **Modern UI:** Clean, responsive interface built with Tailwind CSS and Next.js.

## 🛠️ Tech Stack

-   **Framework:** [Next.js](https://nextjs.org/) (App Router)
-   **Language:** [TypeScript](https://www.typescriptlang.org/)
-   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
-   **API:** [tRPC](https://trpc.io/)
-   **Database (Relational):** SQLite / LibSQL (via [Drizzle ORM](https://orm.drizzle.team/))
-   **Database (Vector):** [Pinecone](https://www.pinecone.io/)
-   **Authentication:** [Better Auth](https://www.better-auth.com/)
-   **Image Processing:** `sharp`, `blockhash-core`

## ⚙️ How It Works

1.  **Upload:** A user uploads an image via the web interface.
2.  **Processing:**
    *   The backend decodes the image.
    *   **pHash:** A perceptual hash is calculated to find near-duplicates (Hamming distance < 4).
    *   **Embedding:** A vector embedding is generated (likely using a model via Replicate) and queried against the Pinecone index (Cosine similarity > 0.96).
3.  **Verification:**
    *   The system checks if the image exists in the database.
    *   It cross-references the uploader against a list of known trusted users ("Cat Owner").
    *   It returns a status: "New", "Already scanned by [User]", or "Fake".

## 📦 Getting Started

### Prerequisites

-   Node.js (v20+ recommended)
-   pnpm
-   A Pinecone account
-   A Discord Application (for OAuth)
-   A Replicate account (for embeddings)

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/StarNumber12046/empchecker.git
    cd empchecker
    ```

2.  Install dependencies:
    ```bash
    pnpm install
    ```

3.  Set up environment variables:
    Copy the example environment file (if available) or create a `.env` file with the following keys:
    ```env
    DATABASE_URL="file:local.db" # or your LibSQL URL
    PINECONE_API_KEY="..."
    PINECONE_INDEX="..."
    DISCORD_CLIENT_ID="..."
    DISCORD_CLIENT_SECRET="..."
    BETTER_AUTH_SECRET="..."
    BETTER_AUTH_URL="http://localhost:3000"
    REPLICATE_API_TOKEN="..."
    CAT_OWNER_ID="..." # Discord ID of the trusted user
    ```

4.  Push the database schema:
    ```bash
    pnpm db:push
    ```

5.  Run the development server:
    ```bash
    pnpm dev
    ```

    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

[MIT](LICENSE)
