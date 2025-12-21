package com.giftai.service;

import com.giftai.entity.BookEntity;
import com.giftai.repository.BookRepository;
import com.itextpdf.html2pdf.HtmlConverter;
import com.itextpdf.html2pdf.ConverterProperties;
import com.itextpdf.html2pdf.resolver.font.DefaultFontProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Slf4j
@Service
@RequiredArgsConstructor
public class PdfGenerationService {
    
    private final BookRepository bookRepository;
    private static final String PDF_DIR = "generated-pdfs";
    
    {
        try {
            Path pdfPath = Paths.get(PDF_DIR);
            if (!Files.exists(pdfPath)) {
                Files.createDirectories(pdfPath);
            }
        } catch (IOException e) {
            log.error("Failed to create PDF directory", e);
        }
    }
    
    @Async
    public void generatePdfAsync(Long bookId, String content, String bookName, String language) {
        try {
            log.info("Starting PDF generation for book ID: {}", bookId);
            BookEntity book = bookRepository.findById(bookId).orElse(null);
            if (book == null) {
                log.error("Book not found for ID: {}", bookId);
                return;
            }
            
            String lang = language != null ? language : (book.getLanguage() != null ? book.getLanguage() : "English");
            String pdfPath = generatePdf(content, bookId, bookName, lang);
            
            book.setPdfPath(pdfPath);
            book.setPdfReady(true);
            bookRepository.save(book);
            log.info("PDF generated successfully for book ID: {} at path: {}", bookId, pdfPath);
        } catch (Exception e) {
            log.error("Error generating PDF for book ID: {}", bookId, e);
        }
    }
    
    private String generatePdf(String content, Long bookId, String bookName, String language) throws IOException {
        String fileName = "book_" + bookId + "_" + System.currentTimeMillis() + ".pdf";
        String filePath = PDF_DIR + File.separator + fileName;
        
        // Use improved HTML conversion with proper UTF-8 encoding
        String htmlContent = convertToHtml(content, bookName, language);
        
        FileOutputStream outputStream = new FileOutputStream(filePath);
        
        // Configure converter with proper font support for all languages
        ConverterProperties properties = new ConverterProperties();
        DefaultFontProvider fontProvider = new DefaultFontProvider(true, true, true);
        properties.setFontProvider(fontProvider);
        
        HtmlConverter.convertToPdf(htmlContent, outputStream, properties);
        outputStream.close();
        
        return filePath;
    }
    
    private String convertToHtml(String content, String bookName, String language) {
        // Escape HTML special characters
        content = content
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;");
        
        // Split content into paragraphs and format
        String[] paragraphs = content.split("\n\n+");
        StringBuilder htmlBuilder = new StringBuilder();
        
        for (String para : paragraphs) {
            para = para.trim();
            if (para.isEmpty()) continue;
            
            // Check if it's a chapter heading
            if (para.matches("(?i)^(Chapter|Bölüm|Kapitel|Chapitre|Capítulo|Capitolo|Глава|章|章|الفصل)\\s+\\d+.*")) {
                htmlBuilder.append("<h2 class=\"chapter-title\">").append(para).append("</h2>\n");
            } else if (para.matches("^[A-Z][^.!?]*[.!?]$") && para.length() < 100) {
                // Might be a title or heading
                htmlBuilder.append("<h3 class=\"section-title\">").append(para).append("</h3>\n");
            } else {
                // Regular paragraph
                para = para.replace("\n", " ");
                htmlBuilder.append("<p class=\"story-text\">").append(para).append("</p>\n");
            }
        }
        
        String htmlContent = htmlBuilder.toString();
        
        // Determine text direction based on language
        String textDirection = "ltr";
        String textAlign = "justify";
        if (language != null && (language.equalsIgnoreCase("Arabic") || language.equalsIgnoreCase("Hebrew"))) {
            textDirection = "rtl";
            textAlign = "right";
        }
        
        return "<!DOCTYPE html>" +
            "<html lang=\"" + (language != null ? language.toLowerCase() : "en") + "\" dir=\"" + textDirection + "\">" +
            "<head>" +
            "<meta charset='UTF-8'>" +
            "<meta name='viewport' content='width=device-width, initial-scale=1.0'>" +
            "<style>" +
            "@page { " +
            "  size: A5; " +
            "  margin: 2cm 2.5cm; " +
            "  @top-center { content: element(header); } " +
            "  @bottom-center { content: element(footer); } " +
            "}" +
            "body { " +
            "  font-family: 'Times New Roman', 'DejaVu Serif', 'Liberation Serif', serif; " +
            "  padding: 0; " +
            "  line-height: 1.8; " +
            "  font-size: 11pt; " +
            "  color: #2c3e50; " +
            "  text-align: " + textAlign + "; " +
            "  direction: " + textDirection + "; " +
            "  orphans: 3; " +
            "  widows: 3; " +
            "}" +
            ".chapter-title { " +
            "  text-align: center; " +
            "  color: #8b5cf6; " +
            "  margin: 30px 0 20px 0; " +
            "  font-size: 18pt; " +
            "  font-weight: bold; " +
            "  page-break-after: avoid; " +
            "  page-break-before: auto; " +
            "}" +
            ".section-title { " +
            "  text-align: center; " +
            "  color: #a78bfa; " +
            "  margin: 20px 0 15px 0; " +
            "  font-size: 14pt; " +
            "  font-weight: bold; " +
            "  font-style: italic; " +
            "  page-break-after: avoid; " +
            "}" +
            ".story-text { " +
            "  margin-bottom: 12px; " +
            "  text-indent: 1.5em; " +
            "  text-align: justify; " +
            "  orphans: 3; " +
            "  widows: 3; " +
            "  page-break-inside: avoid; " +
            "}" +
            ".story-text:first-of-type { text-indent: 0; }" +
            ".story-text:first-letter { " +
            "  font-size: 1.5em; " +
            "  font-weight: bold; " +
            "  color: #8b5cf6; " +
            "  float: left; " +
            "  line-height: 1; " +
            "  margin-right: 3px; " +
            "}" +
            "</style>" +
            "</head>" +
            "<body>" +
            htmlContent +
            "</body>" +
            "</html>";
    }
}

