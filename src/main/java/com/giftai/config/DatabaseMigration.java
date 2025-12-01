package com.giftai.config;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@Order(1)
public class DatabaseMigration {
    
    @Autowired(required = false)
    private JdbcTemplate jdbcTemplate;
    
    @PostConstruct
    public void migrateDatabase() {
        if (jdbcTemplate == null) {
            log.warn("JdbcTemplate not available, skipping database migration");
            return;
        }
        
        try {
            log.info("Checking and fixing database schema...");
            
            // Check if username column exists (old schema, should be removed or made nullable)
            String checkUsernameColumnSql = """
                SELECT COUNT(*) 
                FROM information_schema.columns 
                WHERE table_name = 'users' AND column_name = 'username'
                """;
            
            Integer usernameColumnExists = jdbcTemplate.queryForObject(checkUsernameColumnSql, Integer.class);
            
            if (usernameColumnExists != null && usernameColumnExists > 0) {
                log.info("Found old 'username' column, making it nullable or removing...");
                try {
                    // First, make it nullable if it's NOT NULL
                    jdbcTemplate.execute("ALTER TABLE users ALTER COLUMN username DROP NOT NULL");
                    log.info("✅ Made 'username' column nullable");
                } catch (Exception e) {
                    log.warn("Could not modify username column: {}", e.getMessage());
                }
            }
            
            // Check if name column exists
            String checkColumnSql = """
                SELECT COUNT(*) 
                FROM information_schema.columns 
                WHERE table_name = 'users' AND column_name = 'name'
                """;
            
            Integer columnExists = jdbcTemplate.queryForObject(checkColumnSql, Integer.class);
            
            if (columnExists == null || columnExists == 0) {
                log.info("Adding missing 'name' column to users table...");
                
                // Add name column (nullable first)
                jdbcTemplate.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(100)");
                
                // Update existing rows with default value
                jdbcTemplate.execute("""
                    UPDATE users 
                    SET name = COALESCE(SPLIT_PART(email, '@', 1), 'User') 
                    WHERE name IS NULL
                    """);
                
                // Make it NOT NULL
                jdbcTemplate.execute("ALTER TABLE users ALTER COLUMN name SET NOT NULL");
                
                log.info("✅ Successfully added 'name' column to users table");
            } else {
                log.info("✅ 'name' column already exists in users table");
            }
            
            // Check if user_id column exists in books table
            String checkBooksColumnSql = """
                SELECT COUNT(*) 
                FROM information_schema.columns 
                WHERE table_name = 'books' AND column_name = 'user_id'
                """;
            
            Integer booksColumnExists = jdbcTemplate.queryForObject(checkBooksColumnSql, Integer.class);
            
            if (booksColumnExists == null || booksColumnExists == 0) {
                log.info("Adding missing 'user_id' column to books table...");
                
                // Add user_id column (nullable first)
                jdbcTemplate.execute("ALTER TABLE books ADD COLUMN IF NOT EXISTS user_id BIGINT");
                
                // Add foreign key constraint if users table exists
                try {
                    jdbcTemplate.execute("""
                        ALTER TABLE books 
                        ADD CONSTRAINT IF NOT EXISTS fk_books_user 
                        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                        """);
                    log.info("✅ Successfully added 'user_id' column and foreign key to books table");
                } catch (Exception e) {
                    log.warn("Could not add foreign key constraint: {}", e.getMessage());
                }
            } else {
                log.info("✅ 'user_id' column already exists in books table");
            }
            
            // Check if is_public column exists in books table
            String checkIsPublicColumnSql = """
                SELECT COUNT(*) 
                FROM information_schema.columns 
                WHERE table_name = 'books' AND column_name = 'is_public'
                """;
            
            Integer isPublicColumnExists = jdbcTemplate.queryForObject(checkIsPublicColumnSql, Integer.class);
            
            if (isPublicColumnExists == null || isPublicColumnExists == 0) {
                log.info("Adding missing 'is_public' column to books table...");
                
                // Add is_public column (default to false for existing books)
                jdbcTemplate.execute("ALTER TABLE books ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false NOT NULL");
                
                log.info("✅ Successfully added 'is_public' column to books table");
            } else {
                log.info("✅ 'is_public' column already exists in books table");
            }
            
            // Check if view_count column exists in books table
            String checkViewCountColumnSql = """
                SELECT COUNT(*) 
                FROM information_schema.columns 
                WHERE table_name = 'books' AND column_name = 'view_count'
                """;
            
            Integer viewCountColumnExists = jdbcTemplate.queryForObject(checkViewCountColumnSql, Integer.class);
            
            if (viewCountColumnExists == null || viewCountColumnExists == 0) {
                log.info("Adding missing 'view_count' column to books table...");
                jdbcTemplate.execute("ALTER TABLE books ADD COLUMN IF NOT EXISTS view_count BIGINT DEFAULT 0 NOT NULL");
                log.info("✅ Successfully added 'view_count' column to books table");
            } else {
                log.info("✅ 'view_count' column already exists in books table");
            }
            
            // Check if download_count column exists in books table
            String checkDownloadCountColumnSql = """
                SELECT COUNT(*) 
                FROM information_schema.columns 
                WHERE table_name = 'books' AND column_name = 'download_count'
                """;
            
            Integer downloadCountColumnExists = jdbcTemplate.queryForObject(checkDownloadCountColumnSql, Integer.class);
            
            if (downloadCountColumnExists == null || downloadCountColumnExists == 0) {
                log.info("Adding missing 'download_count' column to books table...");
                jdbcTemplate.execute("ALTER TABLE books ADD COLUMN IF NOT EXISTS download_count BIGINT DEFAULT 0 NOT NULL");
                log.info("✅ Successfully added 'download_count' column to books table");
            } else {
                log.info("✅ 'download_count' column already exists in books table");
            }
            
            // Check if gender column exists in books table
            String checkGenderColumnSql = """
                SELECT COUNT(*) 
                FROM information_schema.columns 
                WHERE table_name = 'books' AND column_name = 'gender'
                """;
            
            Integer genderColumnExists = jdbcTemplate.queryForObject(checkGenderColumnSql, Integer.class);
            
            if (genderColumnExists == null || genderColumnExists == 0) {
                log.info("Adding missing 'gender' column to books table...");
                jdbcTemplate.execute("ALTER TABLE books ADD COLUMN IF NOT EXISTS gender VARCHAR(50)");
                log.info("✅ Successfully added 'gender' column to books table");
            } else {
                log.info("✅ 'gender' column already exists in books table");
            }
            
            // Check if characters column exists in books table
            String checkCharactersColumnSql = """
                SELECT COUNT(*) 
                FROM information_schema.columns 
                WHERE table_name = 'books' AND column_name = 'characters'
                """;
            
            Integer charactersColumnExists = jdbcTemplate.queryForObject(checkCharactersColumnSql, Integer.class);
            
            if (charactersColumnExists == null || charactersColumnExists == 0) {
                log.info("Adding missing 'characters' column to books table...");
                jdbcTemplate.execute("ALTER TABLE books ADD COLUMN IF NOT EXISTS characters TEXT");
                log.info("✅ Successfully added 'characters' column to books table");
            } else {
                log.info("✅ 'characters' column already exists in books table");
            }
            
            // Check if language column exists in books table
            String checkLanguageColumnSql = """
                SELECT COUNT(*) 
                FROM information_schema.columns 
                WHERE table_name = 'books' AND column_name = 'language'
                """;
            
            Integer languageColumnExists = jdbcTemplate.queryForObject(checkLanguageColumnSql, Integer.class);
            
            if (languageColumnExists == null || languageColumnExists == 0) {
                log.info("Adding missing 'language' column to books table...");
                jdbcTemplate.execute("ALTER TABLE books ADD COLUMN IF NOT EXISTS language VARCHAR(100)");
                log.info("✅ Successfully added 'language' column to books table");
            } else {
                log.info("✅ 'language' column already exists in books table");
            }
            
            // Check if main_topic column exists in books table
            String checkMainTopicColumnSql = """
                SELECT COUNT(*) 
                FROM information_schema.columns 
                WHERE table_name = 'books' AND column_name = 'main_topic'
                """;
            
            Integer mainTopicColumnExists = jdbcTemplate.queryForObject(checkMainTopicColumnSql, Integer.class);
            
            if (mainTopicColumnExists == null || mainTopicColumnExists == 0) {
                log.info("Adding missing 'main_topic' column to books table...");
                jdbcTemplate.execute("ALTER TABLE books ADD COLUMN IF NOT EXISTS main_topic VARCHAR(500)");
                log.info("✅ Successfully added 'main_topic' column to books table");
            } else {
                log.info("✅ 'main_topic' column already exists in books table");
            }
            
            // Check if is_admin column exists in users table
            String checkIsAdminColumnSql = """
                SELECT COUNT(*) 
                FROM information_schema.columns 
                WHERE table_name = 'users' AND column_name = 'is_admin'
                """;
            
            Integer isAdminColumnExists = jdbcTemplate.queryForObject(checkIsAdminColumnSql, Integer.class);
            
            if (isAdminColumnExists == null || isAdminColumnExists == 0) {
                log.info("Adding missing 'is_admin' column to users table...");
                jdbcTemplate.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false NOT NULL");
                log.info("✅ Successfully added 'is_admin' column to users table");
            } else {
                log.info("✅ 'is_admin' column already exists in users table");
            }
            
            log.info("Database migration completed successfully");
            
        } catch (Exception e) {
            log.error("❌ Error during database migration: {}", e.getMessage(), e);
            // Don't throw exception to allow application to start
            // User can fix manually if needed
        }
    }
}
