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
        
        if (apiKey == null || apiKey.equals("default-key") || apiKey.isEmpty()) {
            log.warn("OpenAI API key not configured, returning dummy response");
            return getDummyResponse(request);
        }
        
        try {
            OpenAiService service = new OpenAiService(apiKey, Duration.ofSeconds(60));
            
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
                "Create a personalized children's book as a gift. Write a complete, engaging, LONG story with the following details:\n\n" +
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
                "- Write a full-length story (6000-8000 words)\n" +
                "- Create 8-10 chapters\n" +
                "- Each chapter should be 600-900 words\n" +
                "- Use long paragraphs (minimum 3-5 sentences per paragraph)\n" +
                "- Include rich descriptions, extensive dialogue, and character development\n" +
                "- Naturally incorporate the recipient's name throughout the narrative\n" +
                "- Make it age-appropriate and engaging\n" +
                "- Fill every page with meaningful content, no short paragraphs or empty spaces\n" +
                "- Format with clear chapter headings (Chapter 1, Chapter 2, etc.)",
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
                "You are a talented children's book author specializing in full-length, chapter-based stories. " +
                "Create personalized, engaging, and age-appropriate EXTENSIVE stories (6000-8000 words) that captivate young readers. " +
                "Your stories should be warm, imaginative, include 8-10 chapters, rich descriptions, extensive dialogue, and character development. " +
                "Always include the recipient's name naturally throughout the narrative. " +
                "Write extensively with long paragraphs (3-5 sentences minimum), detailed scenes, and meaningful content on every page. " +
                "This is a full book - fill every page with engaging content. No short paragraphs or empty spaces.");
            ChatMessage userMessage = new ChatMessage(ChatMessageRole.USER.value(), prompt);
            messages.add(systemMessage);
            messages.add(userMessage);
            
            int maxTokensValue = 4000;
            if (model.contains("gpt-4") || model.contains("gpt-4o")) {
                maxTokensValue = 8000;
            } else if (model.contains("gpt-3.5-turbo-16k")) {
                maxTokensValue = 8000;
            }
            
            ChatCompletionRequest chatRequest = ChatCompletionRequest.builder()
                .model(model)
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

