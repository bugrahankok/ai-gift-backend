# BookifyAI - Personalized E-Book Creator

AI-powered personalized e-book generation system. Creates custom e-books using OpenAI ChatGPT API with PDF generation, viewing, and download capabilities. Users can share their books publicly or keep them private, and discover books created by others.

## 🚀 Features

### Core Features
- **Personalized E-Book Generation**: Create custom books based on recipient information (name, age, theme, tone, giver, appearance)
- **OpenAI Integration**: Real AI content generation using ChatGPT API
- **PDF Generation**: Automatic PDF creation with professional formatting (30+ pages)
- **PDF Viewer**: Page-by-page PDF viewing directly in the browser
- **PDF Download**: Download generated PDFs
- **RESTful API**: Full CRUD operations for books
- **Web Interface**: Modern, responsive UI with beautiful pastel color scheme
- **Interactive Selection**: Visual option cards for theme, book type, and tone selection

### User Features
- **User Authentication**: Secure user registration and login system with JWT tokens
- **User Profiles**: View your profile and all your created books
- **Public/Private Books**: Choose whether your books are public (discoverable by everyone) or private (only visible to you)
- **Discover Page**: Browse and read public books created by other users
- **Visibility Toggle**: Easily switch between public and private for any of your books using a toggle switch
- **Book History**: View all your previously generated books (both public and private)

### Additional Features
- **PostgreSQL Database**: Persistent storage for all generated books and users
- **Swagger Documentation**: Interactive API documentation
- **Environment Configuration**: Secure .env file support for sensitive data
- **Privacy & Terms**: Consent modal and policy pages
- **Automatic Database Migration**: Schema updates handled automatically on startup

## 🛠️ Technology Stack

- **Java 17+**
- **Spring Boot 3.2.0**
- **Maven**
- **Spring Web**
- **Spring Data JPA**
- **Spring Security** (JWT authentication)
- **PostgreSQL** (database)
- **Swagger/OpenAPI** (Springdoc)
- **Dotenv** (.env file support)
- **Lombok**
- **OpenAI Java Client** (ChatGPT API integration)
- **iText7** (PDF generation)
- **PDF.js** (PDF viewing in browser)
- **BCrypt** (password encryption)

## 📁 Project Structure

```
src/main/java/com/giftai/
├── controller/          # REST API controllers
│   ├── BookController.java
│   ├── AuthController.java
│   ├── UserController.java
│   └── GlobalExceptionHandler.java
├── service/             # Business logic
│   ├── BookService.java
│   ├── PdfGenerationService.java
│   ├── AuthenticationService.java
│   └── UserService.java
├── provider/            # AI provider implementations
│   └── BookProvider.java
├── model/               # DTOs
│   ├── BookRequest.java
│   ├── BookResponse.java
│   ├── RegisterRequest.java
│   ├── LoginRequest.java
│   └── AuthResponse.java
├── entity/              # JPA entities
│   ├── BookEntity.java
│   └── UserEntity.java
├── repository/          # Data access layer
│   ├── BookRepository.java
│   └── UserRepository.java
├── config/              # Configuration classes
│   ├── WebConfig.java
│   ├── OpenApiConfig.java
│   ├── SecurityConfig.java
│   ├── JwtTokenProvider.java
│   ├── JwtAuthenticationFilter.java
│   └── DatabaseMigration.java
└── console/             # Console interface
    └── ConsoleInterface.java
```

## 📦 Installation

### Requirements

- Java 17 or higher
- Maven 3.6+
- PostgreSQL (database)
- OpenAI API Key (required for book generation)

### Steps

1. **Clone the project:**
```bash
git clone <repository-url>
cd ai-gift-backend
```

2. **Install dependencies:**
```bash
mvn clean install
```

3. **Create .env file:**
Copy `.env.example` to `.env` and fill in your values:
```bash
cp .env.example .env
```

4. **Edit `.env` file:**
```env
# Database Configuration
DATABASE_URL=jdbc:postgresql://localhost:5432/bookifyai
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=your_database_password_here

# OpenAI API Configuration (Required for book generation)
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-3.5-turbo

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here_minimum_256_bits
JWT_EXPIRATION=86400000
```

5. **Create PostgreSQL database:**
```sql
CREATE DATABASE bookifyai;
```

6. **Run the application:**
```bash
mvn spring-boot:run
```

The application will start at `http://localhost:8080`

## 🎮 Usage

### Getting Started

1. Open `http://localhost:8080` in your browser
2. Accept the Privacy Policy and Terms of Service when prompted
3. Register a new account or login if you already have one

### Creating a Book

1. **Fill in the book creation form:**
   - **Recipient's Name**: The person the book is for
   - **Age**: Recipient's age
   - **Theme**: Book theme (select from visual cards: Adventure, Fantasy, Space, Pirates, Dinosaurs, etc.)
   - **Book Type**: Story type (select from visual cards: Adventure Story, Fairy Tale, Mystery Story, etc.)
   - **Tone**: Writing tone (select from visual cards: Warm, Exciting, Magical, Mysterious, etc.)
   - **Gift Giver**: Who is giving this book
   - **Appearance** (Optional): Physical description to include in the story
   - **Visibility**: Choose **Public** (everyone can discover) or **Private** (only you can see)

2. Click "Create Book"
3. The book content will be displayed immediately
4. PDF generation starts in the background
5. Once PDF is ready, you can:
   - View it page-by-page using the PDF viewer
   - Download it as a PDF file

### Managing Your Books

- **My Books Tab**: View all your created books (both public and private)
  - Each book shows its visibility status (🌍 Public or 🔒 Private)
  - Use the toggle switch to change visibility anytime
  - Click on any book to view full details

- **Discover Tab**: Browse public books created by other users
  - View all publicly shared books
  - Read books without logging in
  - See author names for public books

### Book Visibility

- **Public Books**: 
  - Visible to everyone in the Discover page
  - Can be read by anyone (even without login)
  - Show author name
  - Great for sharing your creations with the community
  
- **Private Books**:
  - Only visible to you in your "My Books" tab
  - Cannot be accessed by others
  - Perfect for personal gifts

## 🔌 REST API Endpoints

### Authentication Endpoints

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userId": 1,
  "email": "user@example.com",
  "name": "John Doe"
}
```

### Book Endpoints

#### Create Book (requires authentication)
```http
POST /api/book/generate
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Alice",
  "age": 8,
  "theme": "Adventure",
  "tone": "Warm",
  "giver": "Mom",
  "appearance": "Brown hair, blue eyes, tall",
  "isPublic": true
}
```

**Response:**
```json
{
  "bookId": 1,
  "name": "Alice",
  "age": 8,
  "theme": "Adventure",
  "tone": "Warm",
  "giver": "Mom",
  "appearance": "Brown hair, blue eyes, tall",
  "content": "A Special Gift for Alice\n\nFrom: Mom\n\n...",
  "pdfPath": null,
  "pdfReady": false,
  "isPublic": true,
  "authorName": "John Doe",
  "createdAt": "2024-01-01T12:00:00"
}
```

#### Get User's Books (requires authentication)
```http
GET /api/book/history
Authorization: Bearer {token}
```

#### Discover Public Books (public, no authentication required)
```http
GET /api/book/discover
```

#### Get Book by ID
```http
GET /api/book/{id}
```
- Public books: accessible to everyone
- Private books: only accessible to the owner (requires authentication)

#### Update Book Visibility (requires authentication, owner only)
```http
PATCH /api/book/{id}/visibility
Authorization: Bearer {token}
Content-Type: application/json

{
  "isPublic": true
}
```

#### Download PDF
```http
GET /api/book/{id}/pdf
```
- Public books: accessible to everyone
- Private books: only accessible to the owner (requires authentication)

#### Check PDF Status
```http
GET /api/book/{id}/status
```
- Public books: accessible to everyone
- Private books: only accessible to the owner (requires authentication)

### User Endpoints

#### Get User Profile (requires authentication)
```http
GET /api/user/profile
Authorization: Bearer {token}
```

## 📚 Swagger UI

Access interactive API documentation:
- **URL**: http://localhost:8080/swagger-ui.html

## 🤖 AI Provider

### BookProvider
- **Status**: ✅ Active (Real API integration)
- **Model**: GPT-3.5-turbo (default, can be changed via .env)
- **Usage**: Personalized e-book generation
- **Features**: 
  - OpenAI ChatGPT API integration
  - Generates 6000-8000 word stories
  - 8-10 chapters per book (~30 pages in PDF)
  - Rich descriptions and character development
  - Appearance integration when provided
  - Professional book formatting

## 💾 Database

The application uses PostgreSQL for persistent storage. All generated books and users are saved with:

### Users Table
- id, email, password (hashed), name, created_at

### Books Table
- id, name, age, theme, tone, giver, appearance, content, pdf_path, pdf_ready, **is_public**, created_at, user_id

### Automatic Database Migration

The application includes automatic database migration that runs on startup:
- Adds missing columns (`name` in users, `user_id` and `is_public` in books)
- Handles schema updates automatically
- No manual migration scripts required

## 🔒 Security

- **JWT-based Authentication**: Secure token-based authentication system
- **Password Encryption**: BCrypt password hashing
- **Protected Endpoints**: Most endpoints require authentication
- **Public Access**: Discover page and public books are accessible without login
- **Owner Verification**: Only book owners can modify their books' visibility
- **Session Management**: Stateless JWT tokens for scalability

**⚠️ IMPORTANT SECURITY NOTE:** All sensitive information (API keys, passwords, JWT secrets) must be stored in the `.env` file. 
The `.env` file is in `.gitignore` and will NOT be uploaded to GitHub.

## 🎯 Use Cases

### Use Case 1: Create and Share a Public Book
1. Register/Login to your account
2. Create a book and select "Public" visibility
3. Your book appears in the Discover page
4. Anyone can read your book, even without logging in
5. Your name appears as the author

### Use Case 2: Create a Private Personal Gift
1. Register/Login to your account
2. Create a book and select "Private" visibility
3. Only you can see this book in your "My Books" tab
4. Perfect for personal gifts

### Use Case 3: Change Book Visibility
1. Go to "My Books" tab
2. Find the book you want to change
3. Toggle the switch to make it public or private
4. Changes are reflected immediately in the Discover page

### Use Case 4: Discover and Read Public Books
1. Go to "Discover" tab (no login required)
2. Browse all public books
3. Click on any book to read it
4. View PDF or download if available

## 📝 Project Details

- **Controllers**: Handle HTTP requests and responses
- **Services**: Business logic, PDF generation, authentication
- **Providers**: AI model implementations
- **Models**: Request and response DTOs
- **Entities**: JPA database entities
- **Repositories**: Data access interfaces
- **Config**: Web, OpenAPI, Security, and CORS configurations
- **Migration**: Automatic database schema updates

## 📄 License

This project is created for demonstration purposes.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Contact

Feel free to open an issue for questions or suggestions.

---

**Note**: Don't forget to add your OpenAI API key to the `.env` file. Without an API key, the system will not be able to generate books.
