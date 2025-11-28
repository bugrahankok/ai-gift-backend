package com.giftai.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.Contact;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {
    
    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("BookifyAI API")
                        .version("1.0.0")
                        .description("AI-powered personalized e-book generation system API documentation")
                        .contact(new Contact()
                                .name("BookifyAI Team")
                                .email("support@bookifyai.com")));
    }
}

