-- =====================================================
-- aigiftdb Veritabanı Tablo ve Kolon Kurulumu
-- =====================================================
-- Bu script sadece tabloları ve kolonları oluşturur/günceller
-- Veri eklemez, mevcut verileri korur
-- Kullanım: psql -U postgres -d aigiftdb -f setup_tables_aigiftdb.sql
-- =====================================================

\c aigiftdb

-- =====================================================
-- 1. USERS TABLOSU
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100),
    is_admin BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Eksik kolonları ekle
DO $$ 
BEGIN
    -- name kolonu
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'name'
    ) THEN
        ALTER TABLE users ADD COLUMN name VARCHAR(100);
        RAISE NOTICE 'users.name kolonu eklendi';
    END IF;
    
    -- is_admin kolonu
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'is_admin'
    ) THEN
        ALTER TABLE users ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT false;
        RAISE NOTICE 'users.is_admin kolonu eklendi';
    END IF;
    
    -- created_at kolonu
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE users ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE 'users.created_at kolonu eklendi';
    END IF;
END $$;

-- =====================================================
-- 2. BOOKS TABLOSU
-- =====================================================
CREATE TABLE IF NOT EXISTS books (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    age INTEGER NOT NULL,
    gender VARCHAR(50),
    language VARCHAR(100),
    theme VARCHAR(200) NOT NULL,
    main_topic VARCHAR(500),
    tone VARCHAR(200) NOT NULL,
    giver VARCHAR(200) NOT NULL,
    appearance VARCHAR(500),
    characters TEXT,
    content TEXT NOT NULL,
    pdf_path VARCHAR(500),
    pdf_ready BOOLEAN NOT NULL DEFAULT false,
    is_public BOOLEAN NOT NULL DEFAULT false,
    view_count BIGINT NOT NULL DEFAULT 0,
    download_count BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_id BIGINT NOT NULL
);

-- Eksik kolonları ekle
DO $$ 
BEGIN
    -- gender kolonu
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'books' AND column_name = 'gender'
    ) THEN
        ALTER TABLE books ADD COLUMN gender VARCHAR(50);
        RAISE NOTICE 'books.gender kolonu eklendi';
    END IF;
    
    -- language kolonu
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'books' AND column_name = 'language'
    ) THEN
        ALTER TABLE books ADD COLUMN language VARCHAR(100);
        RAISE NOTICE 'books.language kolonu eklendi';
    END IF;
    
    -- main_topic kolonu
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'books' AND column_name = 'main_topic'
    ) THEN
        ALTER TABLE books ADD COLUMN main_topic VARCHAR(500);
        RAISE NOTICE 'books.main_topic kolonu eklendi';
    END IF;
    
    -- appearance kolonu
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'books' AND column_name = 'appearance'
    ) THEN
        ALTER TABLE books ADD COLUMN appearance VARCHAR(500);
        RAISE NOTICE 'books.appearance kolonu eklendi';
    END IF;
    
    -- characters kolonu
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'books' AND column_name = 'characters'
    ) THEN
        ALTER TABLE books ADD COLUMN characters TEXT;
        RAISE NOTICE 'books.characters kolonu eklendi';
    END IF;
    
    -- pdf_path kolonu
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'books' AND column_name = 'pdf_path'
    ) THEN
        ALTER TABLE books ADD COLUMN pdf_path VARCHAR(500);
        RAISE NOTICE 'books.pdf_path kolonu eklendi';
    END IF;
    
    -- pdf_ready kolonu
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'books' AND column_name = 'pdf_ready'
    ) THEN
        ALTER TABLE books ADD COLUMN pdf_ready BOOLEAN NOT NULL DEFAULT false;
        RAISE NOTICE 'books.pdf_ready kolonu eklendi';
    END IF;
    
    -- is_public kolonu
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'books' AND column_name = 'is_public'
    ) THEN
        ALTER TABLE books ADD COLUMN is_public BOOLEAN NOT NULL DEFAULT false;
        RAISE NOTICE 'books.is_public kolonu eklendi';
    END IF;
    
    -- view_count kolonu
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'books' AND column_name = 'view_count'
    ) THEN
        ALTER TABLE books ADD COLUMN view_count BIGINT NOT NULL DEFAULT 0;
        RAISE NOTICE 'books.view_count kolonu eklendi';
    END IF;
    
    -- download_count kolonu
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'books' AND column_name = 'download_count'
    ) THEN
        ALTER TABLE books ADD COLUMN download_count BIGINT NOT NULL DEFAULT 0;
        RAISE NOTICE 'books.download_count kolonu eklendi';
    END IF;
    
    -- created_at kolonu
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'books' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE books ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE 'books.created_at kolonu eklendi';
    END IF;
    
    -- user_id kolonu
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'books' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE books ADD COLUMN user_id BIGINT;
        RAISE NOTICE 'books.user_id kolonu eklendi';
    END IF;
END $$;

-- Foreign key constraint ekle
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_books_user' AND table_name = 'books'
    ) THEN
        ALTER TABLE books 
        ADD CONSTRAINT fk_books_user 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
        RAISE NOTICE 'fk_books_user foreign key eklendi';
    END IF;
END $$;

-- =====================================================
-- 3. ANNOUNCEMENTS TABLOSU
-- =====================================================
CREATE TABLE IF NOT EXISTS announcements (
    id BIGSERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    icon VARCHAR(10),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 4. İNDEKSLER
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_books_user_id ON books(user_id);
CREATE INDEX IF NOT EXISTS idx_books_is_public ON books(is_public);
CREATE INDEX IF NOT EXISTS idx_books_created_at ON books(created_at);
CREATE INDEX IF NOT EXISTS idx_announcements_is_active ON announcements(is_active);

-- =====================================================
-- TAMAMLANDI
-- =====================================================
SELECT 'Tablo ve kolon kurulumu tamamlandı!' AS mesaj;

