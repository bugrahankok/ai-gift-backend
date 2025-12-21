package com.giftai.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Only add custom handler for generated PDFs
        // Static resources from classpath:/static/ are handled by Spring Boot defaults
        // (configured in application.properties)
        // Root path "/" is handled by IndexController
        registry.addResourceHandler("/generated-pdfs/**")
                .addResourceLocations("file:generated-pdfs/");
    }
}

