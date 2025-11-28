# GiftAI Backend

AI-powered personalized e-book generation system. Creates custom e-books using OpenAI ChatGPT API with PDF generation, viewing, and download capabilities.

## 🚀 Features

- **Personalized E-Book Generation**: Create custom books based on recipient information (name, age, theme, tone, giver, appearance)
- **OpenAI Integration**: Real AI content generation using ChatGPT API
- **PDF Generation**: Automatic PDF creation with professional formatting
- **PDF Viewer**: Page-by-page PDF viewing directly in the browser
- **PDF Download**: Download generated PDFs
- **RESTful API**: Full CRUD operations for books
- **Web Interface**: Modern, responsive UI for creating and viewing books
- **PostgreSQL Database**: Persistent storage for all generated books
- **Swagger Documentation**: Interactive API documentation
- **Environment Configuration**: Secure .env file support for sensitive data

## 🛠️ Technology Stack

- **Java 17+**
- **Spring Boot 3.2.0**
- **Maven**
- **Spring Web**
- **Spring Data JPA**
- **PostgreSQL** (database)
- **Swagger/OpenAPI** (Springdoc)
- **Dotenv** (.env file support)
- **Lombok**
- **OpenAI Java Client** (ChatGPT API integration)
- **iText7** (PDF generation)
- **PDF.js** (PDF viewing in browser)

## 📁 Project Structure

```
src/main/java/com/giftai/
├── controller/          # REST API controllers
│   ├── BookController.java
│   └── GlobalExceptionHandler.java
├── service/             # Business logic
│   ├── BookService.java
│   └── PdfGenerationService.java
├── provider/            # AI provider implementations
│   └── BookProvider.java
├── model/               # DTOs
│   ├── BookRequest.java
│   └── BookResponse.java
├── entity/              # JPA entities
│   └── BookEntity.java
├── repository/          # Data access layer
│   └── BookRepository.java
├── config/              # Configuration classes
│   ├── WebConfig.java
│   ├── OpenApiConfig.java
│   └── CorsConfig.java
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
DATABASE_URL=jdbc:postgresql://localhost:5432/giftai
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=your_database_password_here

# OpenAI API Configuration (Required for book generation)
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-3.5-turbo
```

5. **Create PostgreSQL database:**
```sql
CREATE DATABASE giftai;
```

6. **Run the application:**
```bash
mvn spring-boot:run
```

The application will start at `http://localhost:8080`

## 🎮 Usage

### Web Interface

1. Open `http://localhost:8080` in your browser
2. Fill in the book creation form:
   - **Recipient's Name**: The person the book is for
   - **Age**: Recipient's age
   - **Theme**: Book theme (e.g., Adventure, Fantasy, Friendship)
   - **Tone**: Writing tone (e.g., Warm, Exciting, Magical)
   - **Gift Giver**: Who is giving this book
   - **Appearance** (Optional): Physical description to include in the story
3. Click "Create Book"
4. The book content will be displayed immediately
5. PDF generation starts in the background
6. Once PDF is ready, you can:
   - View it page-by-page using the PDF viewer
   - Download it as a PDF file

### REST API Endpoints

#### Create Book
```http
POST /api/book/generate
Content-Type: application/json

{
  "name": "Alice",
  "age": 8,
  "theme": "Adventure",
  "tone": "Warm",
  "giver": "Mom",
  "appearance": "Brown hair, blue eyes, tall"
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
  "createdAt": "2024-01-01T12:00:00"
}
```

#### Get Book History
```http
GET /api/book/history
```

#### Get Book by ID
```http
GET /api/book/{id}
```

#### Download PDF
```http
GET /api/book/{id}/pdf
```

#### Check PDF Status
```http
GET /api/book/{id}/status
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
  - 8-10 chapters per book
  - Rich descriptions and character development
  - Appearance integration when provided
  - Professional book formatting

## 💾 Database

The application uses PostgreSQL for persistent storage. All generated books are saved with:
- Book content
- PDF path (when ready)
- PDF ready status
- Creation timestamp
- All book metadata (name, age, theme, tone, giver, appearance)

## 🔒 Security

**⚠️ IMPORTANT SECURITY NOTE:** All sensitive information (API keys, passwords) must be stored in the `.env` file. 
The `.env` file is in `.gitignore` and will NOT be uploaded to GitHub.

Create a `.env` file in the project root directory and add the following variables:

```env
# Database Configuration
DATABASE_URL=jdbc:postgresql://localhost:5432/giftai
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=your_database_password_here

# OpenAI API Configuration (Required for book generation)
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-3.5-turbo

# JWT Configuration (for future use)
JWT_SECRET=your_jwt_secret_key_here_minimum_256_bits
JWT_EXPIRATION=86400000
```

**Note:** A `.env.example` file is included in the project. You can copy it to `.env` and fill in your values.

## 📝 Project Details

- **Controllers**: Handle HTTP requests and responses
- **Services**: Business logic and PDF generation
- **Providers**: AI model implementations
- **Models**: Request and response DTOs
- **Entities**: JPA database entities
- **Repositories**: Data access interfaces
- **Config**: Web, OpenAPI, and CORS configurations

## 🎯 Features and Use Cases

### Use Case 1: Create Personalized E-Book via Web Interface
1. Start the application
2. Open `http://localhost:8080` in your browser
3. Fill in the book creation form with recipient details
4. Click "Create Book"
5. View the generated book content immediately
6. Wait for PDF generation (happens in background)
7. View PDF page-by-page or download it

### Use Case 2: Create Book via REST API
1. Use Swagger UI or Postman
2. Send a POST request to `/api/book/generate`
3. Receive JSON response with book content
4. Check PDF status using `/api/book/{id}/status`
5. Download PDF when ready using `/api/book/{id}/pdf`

### Use Case 3: View Book History
1. Use the "History" tab in the web interface
2. Or call `GET /api/book/history` endpoint
3. View all previously created books
4. Click on any book to view details

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

**Note**: Don't forget to add your OpenAI API key to the `.env` file. Without an API key, the system will return dummy responses.
