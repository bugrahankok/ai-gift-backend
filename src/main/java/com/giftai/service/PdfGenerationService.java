package com.giftai.service;

import com.giftai.repository.BookRepository;
import com.itextpdf.html2pdf.HtmlConverter;
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
    public void generatePdfAsync(Long bookId, String content, String bookName) {
        try {
            log.info("Starting PDF generation for book ID: {}", bookId);
            String pdfPath = generatePdf(content, bookId, bookName);
            
            bookRepository.findById(bookId).ifPresent(book -> {
                book.setPdfPath(pdfPath);
                book.setPdfReady(true);
                bookRepository.save(book);
                log.info("PDF generated successfully for book ID: {} at path: {}", bookId, pdfPath);
            });
        } catch (Exception e) {
            log.error("Error generating PDF for book ID: {}", bookId, e);
        }
    }
    
    private String generatePdf(String content, Long bookId, String bookName) throws IOException {
        String htmlContent = convertToHtml(content);
        String fileName = "book_" + bookId + "_" + System.currentTimeMillis() + ".pdf";
        String filePath = PDF_DIR + File.separator + fileName;
        
        FileOutputStream outputStream = new FileOutputStream(filePath);
        HtmlConverter.convertToPdf(htmlContent, outputStream);
        outputStream.close();
        
        return filePath;
    }
    
    private String convertToHtml(String content) {
        String htmlContent = content
            .replace("\n\n", "</p><p>")
            .replace("\n", "<br>");
        
        htmlContent = "<p>" + htmlContent + "</p>";
        
        return "<!DOCTYPE html>" +
            "<html>" +
            "<head>" +
            "<meta charset='UTF-8'>" +
            "<style>" +
            "@page { size: A5; margin: 1.5cm 2cm; }" +
            "body { font-family: 'Times New Roman', serif; padding: 0; line-height: 1.6; font-size: 10.5pt; orphans: 3; widows: 3; }" +
            "h1 { text-align: center; color: #333; margin-bottom: 20px; font-size: 20pt; page-break-after: avoid; }" +
            "h2 { color: #444; margin-top: 15px; margin-bottom: 10px; font-size: 16pt; page-break-before: avoid; page-break-after: avoid; }" +
            "p { margin-bottom: 8px; text-align: justify; text-indent: 1.2em; orphans: 3; widows: 3; page-break-inside: avoid; }" +
            "p:first-of-type { text-indent: 0; }" +
            "</style>" +
            "</head>" +
            "<body>" +
            htmlContent +
            "</body>" +
            "</html>";
    }
}

