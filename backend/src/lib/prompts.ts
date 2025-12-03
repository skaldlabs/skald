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

export const EXAMPLE_MEMO_SYSTEM_PROMPT = `You are a helpful assistant that generates example knowledge base content for a RAG (Retrieval-Augmented Generation) system demo.
Generate realistic, professional content that would be useful in a company knowledge base.
The content should be detailed enough to answer follow-up questions about it.
Return your response in JSON format with "title" and "content" fields.
The title should be concise (max 100 chars). The content should be 200-400 words, well-structured with paragraphs.`

export const getExampleMemoUserPrompt = (organizationName?: string): string => {
    const contextHint = organizationName ? `for an organization called "${organizationName}"` : ''
    return `Generate an example knowledge base article ${contextHint}. 
Pick one of these topics randomly: company overview, product features, onboarding guide, FAQ, team structure, or company policies.
Make it realistic and professional. Return only valid JSON.`
}

export const getExampleMemoFallback = (organizationName?: string): { title: string; content: string } => {
    const orgName = organizationName || 'Acme Corp'
    return {
        title: `About ${orgName}`,
        content: `${orgName} is an innovative company dedicated to delivering exceptional solutions to our customers.\n\nOur mission is to transform the way businesses operate by providing cutting-edge technology and outstanding service. We believe in putting our customers first and continuously improving our offerings.\n\nKey highlights:\n- Founded with a vision to make technology accessible\n- Serving customers across multiple industries\n- Committed to innovation and excellence\n- Building long-term partnerships with our clients\n\nOur team of dedicated professionals works tirelessly to ensure that every interaction with ${orgName} exceeds expectations. We value integrity, collaboration, and continuous learning.\n\nContact us to learn more about how we can help your business grow.`,
    }
}
