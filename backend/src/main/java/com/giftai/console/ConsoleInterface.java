package com.giftai.console;

import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
public class ConsoleInterface {
    
    @EventListener(ApplicationReadyEvent.class)
    public void startConsole() {
        System.out.println("\n╔════════════════════════════════════════════════════════════════════════╗");
        System.out.println("║                  BookifyAI - Personalized E-Book Creator               ║");
        System.out.println("╚════════════════════════════════════════════════════════════════════════╝");
        System.out.println("\n✅ Application started successfully!");
        System.out.println("📝 Please use the web interface at http://localhost:8080");
        System.out.println("🔧 Console interface is currently disabled.\n");
    }
    
}
