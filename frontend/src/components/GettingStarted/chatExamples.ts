import {
    curlChatSnippet,
    nodejsChatSnippet,
    pythonChatSnippet,
    phpChatSnippet,
    rubyChatSnippet,
    goChatSnippet,
    dotnetChatSnippet,
    cliChatSnippet,
} from './chatCodeSnippets'

interface ChatExampleParams {
    apiKey: string
    query: string
}

interface CodeExample {
    code: string
    language: string
}

export const getChatExample = (language: string, params: ChatExampleParams): CodeExample => {
    const { apiKey, query } = params
    const apiKeyDisplay = apiKey || 'your_api_key'

    const generators: Record<string, () => CodeExample> = {
        curl: () => ({
            code: curlChatSnippet.replace('{apiKey}', apiKeyDisplay).replace('{query}', query),
            language: 'bash',
        }),

        nodejs: () => ({
            code: nodejsChatSnippet.replace('{apiKey}', apiKeyDisplay).replace('{query}', query),
            language: 'javascript',
        }),

        python: () => ({
            code: pythonChatSnippet.replace('{apiKey}', apiKeyDisplay).replace('{query}', query),
            language: 'python',
        }),

        php: () => ({
            code: phpChatSnippet.replace('{apiKey}', apiKeyDisplay).replace('{query}', query),
            language: 'php',
        }),

        ruby: () => ({
            code: rubyChatSnippet.replace('{apiKey}', apiKeyDisplay).replace('{query}', query),
            language: 'ruby',
        }),

        go: () => ({
            code: goChatSnippet.replace('{apiKey}', apiKeyDisplay).replace('{query}', query),
            language: 'go',
        }),

        dotnet: () => ({
            code: dotnetChatSnippet.replace('{apiKey}', apiKeyDisplay).replace('{query}', query),
            language: 'csharp',
        }),

        cli: () => ({
            code: cliChatSnippet.replace('{query}', query),
            language: 'bash',
        }),
    }

    const generator = generators[language]
    if (!generator) {
        return generators.curl()
    }

    return generator()
}
