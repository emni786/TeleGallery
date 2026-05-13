/**
 * SQL blueprint shown verbatim in the onboarding wizard. Keep in sync with
 * the docs in section 6 of the spec.
 */
export const SUPABASE_SQL = `-- ═══════════════════════════════════════════════════════
-- TeleGallery Database Blueprint v4.0
-- Run once in Supabase → SQL Editor → New Query → RUN
-- ═══════════════════════════════════════════════════════

-- 1. Photos / videos
CREATE TABLE IF NOT EXISTS photos (
    id            BIGSERIAL PRIMARY KEY,
    file_id       TEXT NOT NULL,
    file_type     TEXT NOT NULL CHECK (file_type IN ('photo','video')),
    file_name     TEXT DEFAULT '',
    file_size     BIGINT DEFAULT 0,
    mime_type     TEXT DEFAULT '',
    title         TEXT DEFAULT '',
    album         TEXT DEFAULT 'All Photos',
    uploaded_at   TIMESTAMPTZ DEFAULT NOW(),
    is_favorite   BOOLEAN DEFAULT FALSE,
    is_deleted    BOOLEAN DEFAULT FALSE,
    thumbnail_id  TEXT DEFAULT '',
    width         INTEGER DEFAULT 0,
    height        INTEGER DEFAULT 0,
    duration      INTEGER DEFAULT 0
);

-- 2. Albums
CREATE TABLE IF NOT EXISTS albums (
    id             BIGSERIAL PRIMARY KEY,
    name           TEXT NOT NULL UNIQUE,
    created_at     TIMESTAMPTZ DEFAULT NOW(),
    cover_file_id  TEXT DEFAULT ''
);

-- 3. Credentials (AES-256 encrypted backup of every secret)
CREATE TABLE IF NOT EXISTS credentials (
    id    BIGSERIAL PRIMARY KEY,
    key   TEXT NOT NULL UNIQUE,
    value TEXT NOT NULL
);

-- 4. Default album
INSERT INTO albums (name) VALUES ('All Photos')
ON CONFLICT (name) DO NOTHING;

-- 5. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_photos_album
    ON photos (album);
CREATE INDEX IF NOT EXISTS idx_photos_favorite
    ON photos (is_favorite) WHERE is_favorite = TRUE;
CREATE INDEX IF NOT EXISTS idx_photos_deleted
    ON photos (is_deleted);
CREATE INDEX IF NOT EXISTS idx_photos_date
    ON photos (uploaded_at DESC);

-- 6. Full-text search
CREATE INDEX IF NOT EXISTS idx_photos_search
    ON photos USING GIN (
        to_tsvector('english',
            COALESCE(title,'') || ' ' ||
            COALESCE(album,'') || ' ' ||
            COALESCE(file_name,''))
    );
`;
