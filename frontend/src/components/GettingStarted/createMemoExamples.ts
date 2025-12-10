import {
    curlCreateMemoSnippet,
    nodejsCreateMemoSnippet,
    pythonCreateMemoSnippet,
    phpCreateMemoSnippet,
    rubyCreateMemoSnippet,
    goCreateMemoSnippet,
    dotnetCreateMemoSnippet,
} from './createMemoCodeSnippets'

interface CreateMemoParams {
    apiKey: string
    title: string
    content: string
}

interface CreateMemoExample {
    code: string
    language: string
}

export const getCreateMemoExample = (language: string, params: CreateMemoParams): CreateMemoExample => {
    const { apiKey, title, content } = params
    const apiKeyDisplay = apiKey || 'your_api_key'

    const generators: Record<string, () => CreateMemoExample> = {
        curl: () => ({
            code: curlCreateMemoSnippet
                .replace('{apiKey}', apiKeyDisplay)
                .replace('{title}', title)
                .replace('{content}', content),
            language: 'bash',
        }),

        nodejs: () => ({
            code: nodejsCreateMemoSnippet
                .replace('{apiKey}', apiKeyDisplay)
                .replace('{title}', title)
                .replace('{content}', content),
            language: 'javascript',
        }),

        python: () => ({
            code: pythonCreateMemoSnippet
                .replace('{apiKey}', apiKeyDisplay)
                .replace('{title}', title)
                .replace('{content}', content),
            language: 'python',
        }),

        php: () => ({
            code: phpCreateMemoSnippet
                .replace('{apiKey}', apiKeyDisplay)
                .replace('{title}', title)
                .replace('{content}', content),
            language: 'php',
        }),

        ruby: () => ({
            code: rubyCreateMemoSnippet
                .replace('{apiKey}', apiKeyDisplay)
                .replace('{title}', title)
                .replace('{content}', content),
            language: 'ruby',
        }),

        go: () => ({
            code: goCreateMemoSnippet
                .replace('{apiKey}', apiKeyDisplay)
                .replace('{title}', title)
                .replace('{content}', content),
            language: 'go',
        }),

        dotnet: () => ({
            code: dotnetCreateMemoSnippet
                .replace('{apiKey}', apiKeyDisplay)
                .replace('{title}', title)
                .replace('{content}', content),
            language: 'csharp',
        }),
    }

    const generator = generators[language]
    if (!generator) {
        return generators.curl()
    }

    return generator()
}
