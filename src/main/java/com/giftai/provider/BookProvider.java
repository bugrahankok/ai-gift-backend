package com.giftai.provider;

import com.giftai.model.BookRequest;
import com.giftai.model.CharacterInfo;
import com.theokanning.openai.completion.chat.ChatCompletionRequest;
import com.theokanning.openai.completion.chat.ChatMessage;
import com.theokanning.openai.completion.chat.ChatMessageRole;
import com.theokanning.openai.service.OpenAiService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Component
public class BookProvider {
    
    @Value("${openai.api.key:default-key}")
    private String apiKey;
    
    @Value("${openai.model:gpt-3.5-turbo}")
    private String model;
    
    public String generateBook(BookRequest request) {
        log.info("Generating personalized book for: {}", request.getName());
        
        // Debug: Log API key status (masked)
        String maskedKey = apiKey != null && apiKey.length() > 10 
            ? apiKey.substring(0, 10) + "..." 
            : "NULL or EMPTY";
        log.info("OpenAI API Key status: {}", maskedKey);
        log.info("API Key from property: {}", System.getProperty("OPENAI_API_KEY") != null ? "SET" : "NOT SET");
        
        if (apiKey == null || apiKey.equals("default-key") || apiKey.isEmpty()) {
            log.warn("OpenAI API key not configured, returning dummy response. API Key value: {}", maskedKey);
            return getDummyResponse(request);
        }
        
        try {
            // Use extended timeout for long story generation (30 minutes = 1800 seconds)
            // This should be enough for generating 5-7 page stories (5000-7000 words)
            OpenAiService service = new OpenAiService(apiKey, Duration.ofSeconds(1800));
            log.info("OpenAiService created with 30 minute timeout for long story generation");
            
            String appearanceDescription = "";
            if (request.getAppearance() != null && !request.getAppearance().trim().isEmpty()) {
                appearanceDescription = String.format(
                    "\nRecipient's Appearance: %s\n" +
                    "- Create a vivid visual description of the character based on this appearance\n" +
                    "- Include detailed physical descriptions throughout the story\n" +
                    "- Make the character's appearance an integral part of the narrative\n",
                    request.getAppearance()
                );
            }
            
            String genderInfo = "";
            if (request.getGender() != null && !request.getGender().trim().isEmpty()) {
                genderInfo = String.format(
                    "\nRecipient's Gender: %s\n" +
                    "- Use appropriate pronouns (he/him for Boy, she/her for Girl, they/them for Other)\n" +
                    "- Make the story gender-appropriate and inclusive\n",
                    request.getGender()
                );
            }
            
            String charactersInfo = "";
            if (request.getCharacters() != null && !request.getCharacters().isEmpty()) {
                StringBuilder charsBuilder = new StringBuilder("\nCharacters in the Story:\n");
                for (CharacterInfo character : request.getCharacters()) {
                    charsBuilder.append(String.format(
                        "- %s (%s):\n" +
                        "  Appearance: %s\n" +
                        "  Description: %s\n" +
                        "  - Include this character naturally throughout the story\n" +
                        "  - Make them an integral part of the narrative\n" +
                        "  - Use their appearance and description to create vivid scenes\n",
                        character.getName(),
                        character.getType(),
                        character.getAppearance() != null && !character.getAppearance().trim().isEmpty() 
                            ? character.getAppearance() : "Not specified",
                        character.getDescription() != null && !character.getDescription().trim().isEmpty() 
                            ? character.getDescription() : "Not specified"
                    ));
                }
                charactersInfo = charsBuilder.toString();
            }
            
            String languageInfo = "";
            if (request.getLanguage() != null && !request.getLanguage().trim().isEmpty()) {
                languageInfo = String.format(
                    "\nLanguage: Write the ENTIRE story in %s language\n" +
                    "- All text, dialogue, narration, and content must be in %s\n" +
                    "- Use proper grammar and vocabulary for %s\n" +
                    "- Maintain cultural authenticity if applicable\n",
                    request.getLanguage(),
                    request.getLanguage(),
                    request.getLanguage()
                );
            }
            
            String mainTopicInfo = "";
            if (request.getMainTopic() != null && !request.getMainTopic().trim().isEmpty()) {
                mainTopicInfo = String.format(
                    "\nMain Topic/Subject: %s\n" +
                    "- The story should revolve around this main topic\n" +
                    "- Incorporate this theme throughout the narrative\n" +
                    "- Make it the central focus of the story\n",
                    request.getMainTopic()
                );
            }
            
            String prompt = String.format(
                "Create a personalized children's book as a gift. Write a complete, engaging story.\n\n" +
                "Recipient's Name: %s\n" +
                "Recipient's Age: %d years old\n" +
                "%s" +
                "%s" +
                "Theme: %s\n" +
                "%s" +
                "Tone: %s\n" +
                "Gift Giver: %s\n" +
                "%s" +
                "%s" +
                "\nRequirements:\n" +
                "- Write a complete story (approximately 2000-2500 words, max 3000 tokens)\n" +
                "- Create 3-4 chapters with clear chapter headings\n" +
                "- Use descriptive paragraphs with good detail\n" +
                "- Include dialogue between characters\n" +
                "- Describe settings, emotions, and actions\n" +
                "- Naturally incorporate the recipient's name throughout the narrative (at least 8-10 times)\n" +
                "- Make it age-appropriate and engaging\n" +
                "- Format with clear chapter headings (Chapter 1: [Title], Chapter 2: [Title], etc.)",
                request.getName(),
                request.getAge(),
                genderInfo,
                languageInfo,
                request.getTheme(),
                mainTopicInfo,
                request.getTone(),
                request.getGiver(),
                appearanceDescription,
                charactersInfo
            );
            
            List<ChatMessage> messages = new ArrayList<>();
            ChatMessage systemMessage = new ChatMessage(ChatMessageRole.SYSTEM.value(), 
                "You are a talented children's book author. " +
                "You write engaging, complete stories (approximately 2000-2500 words, max 3000 tokens). " +
                "Your stories have 3-4 chapters with clear structure. " +
                "Your writing style includes: descriptive paragraphs, detailed dialogue, rich narrative, " +
                "vivid scene descriptions, and character development. " +
                "Always include the recipient's name naturally throughout the narrative (8-10 times minimum). " +
                "Write a complete, engaging story that is age-appropriate.");
            ChatMessage userMessage = new ChatMessage(ChatMessageRole.USER.value(), prompt);
            messages.add(systemMessage);
            messages.add(userMessage);
            
            // Set maxTokens to 3000 (user requested limit)
            // This is safe for all models (gpt-3.5-turbo max 4096, gpt-4o max 16384, etc.)
            int maxTokensValue = 3000; // User requested max 3000 tokens
            String actualModel = model;
            
            // No auto-upgrade needed with 3000 token limit - gpt-3.5-turbo can handle it
            if (model.equals("gpt-3.5-turbo")) {
                // Keep gpt-3.5-turbo, no need to upgrade for 3000 tokens
                log.info("Using gpt-3.5-turbo with 3000 token limit");
            }
            
            log.info("Using model: {} with maxTokens: {} (requested model: {})", actualModel, maxTokensValue, model);
            
            ChatCompletionRequest chatRequest = ChatCompletionRequest.builder()
                .model(actualModel) // Use the actual model (may be upgraded to 16k)
                .messages(messages)
                .maxTokens(maxTokensValue)
                .temperature(0.8)
                .build();
            
            String response = service.createChatCompletion(chatRequest)
                .getChoices()
                .get(0)
                .getMessage()
                .getContent();
            
            log.info("OpenAI API response received successfully");
            System.out.println("\n=== OpenAI API Response ===");
            System.out.println(response);
            System.out.println("===========================\n");
            
            return formatBookContent(request, response);
            
        } catch (Exception e) {
            log.error("Error calling OpenAI API: {}", e.getMessage(), e);
            System.out.println("\n=== OpenAI API Error ===");
            System.out.println("Error: " + e.getMessage());
            System.out.println("========================\n");
            return getDummyResponse(request);
        }
    }
    
    private String formatBookContent(BookRequest request, String aiContent) {
        return String.format(
            "A Special Gift for %s\n\n" +
            "From: %s\n\n" +
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
            "%s",
            request.getName(),
            request.getGiver(),
            aiContent
        );
    }
    
    private String getDummyResponse(BookRequest request) {
        return String.format(
            "A Special Gift for %s\n\n" +
            "From: %s\n\n" +
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
            "Chapter 1: The Beginning\n\n" +
            "Once upon a time, there was a wonderful person named %s. " +
            "This is a personalized story created just for you! " +
            "The theme of this story is %s, and it will be told in a %s tone. " +
            "This is a dummy response. Please configure your OpenAI API key in the .env file to generate a real personalized book.",
            request.getName(),
            request.getGiver(),
            request.getName(),
            request.getTheme(),
            request.getTone()
        );
    }
}

