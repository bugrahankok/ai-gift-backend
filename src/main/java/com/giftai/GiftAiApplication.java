package com.giftai;

import io.github.cdimascio.dotenv.Dotenv;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
@Slf4j
public class GiftAiApplication {

    public static void main(String[] args) {
        // Load .env file from project root
        String projectRoot = System.getProperty("user.dir");
        log.info("Loading .env file from: {}", projectRoot);
        
        Dotenv dotenv = Dotenv.configure()
                .directory(projectRoot)
                .ignoreIfMissing()
                .load();
        
        log.info("Loaded {} environment variables from .env", dotenv.entries().size());
        
        dotenv.entries().forEach(entry -> {
            System.setProperty(entry.getKey(), entry.getValue());
            // Log API key status (masked for security)
            if (entry.getKey().equals("OPENAI_API_KEY")) {
                String maskedKey = entry.getValue() != null && entry.getValue().length() > 10 
                    ? entry.getValue().substring(0, 10) + "..." 
                    : "NOT SET";
                log.info("OpenAI API Key loaded: {}", maskedKey);
            }
        });
        
        SpringApplication.run(GiftAiApplication.class, args);
    }
}

