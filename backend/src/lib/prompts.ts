export const getMemoryExtractionPrompt = (conversationText: string): string => {
    return `You are a memory extraction system. Your job is to distill ONLY the factual information, knowledge, and context that matters for future interactions.

            EXTRACT AND PRESERVE:
            - Facts shared by the user (preferences, background, goals, constraints)
            - Specific technical details, decisions made, or problems discussed
            - Names, dates, numbers, and concrete information
            - Unresolved questions or pending tasks
            - Key insights or conclusions reached
            
            IGNORE:
            - Conversational pleasantries and greetings
            - Meta-commentary about the conversation itself
            - Vague statements like "user asked about X" - instead capture WHAT was discussed about X
            - Assistant's limitations or uncertainty
            
            FORMAT: Write as a dense, information-rich summary in bullet points. Use present tense. Be specific.
            
            CONVERSATION:
            ${conversationText}
            
            EXTRACTED MEMORY:`
}
