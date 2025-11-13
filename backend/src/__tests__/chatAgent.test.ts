import { escapeCurlyBraces } from '@/agents/chatAgent/chatAgent'

describe('Chat Agent Utilities', () => {
    describe('escapeCurlyBraces', () => {
        it('should escape single closing brace', () => {
            const input = 'This is a test }'
            const expected = 'This is a test }}'
            expect(escapeCurlyBraces(input)).toBe(expected)
        })

        it('should escape single opening brace', () => {
            const input = 'This is a test {'
            const expected = 'This is a test {{'
            expect(escapeCurlyBraces(input)).toBe(expected)
        })

        it('should escape both braces', () => {
            const input = 'Code example: function() { return "value" }'
            const expected = 'Code example: function() {{ return "value" }}'
            expect(escapeCurlyBraces(input)).toBe(expected)
        })

        it('should escape multiple braces', () => {
            const input = 'JSON example: {"key": "value", "nested": {"inner": "data"}}'
            const expected = 'JSON example: {{"key": "value", "nested": {{"inner": "data"}}}}'
            expect(escapeCurlyBraces(input)).toBe(expected)
        })

        it('should handle text with no braces', () => {
            const input = 'This is plain text'
            expect(escapeCurlyBraces(input)).toBe(input)
        })

        it('should handle empty string', () => {
            expect(escapeCurlyBraces('')).toBe('')
        })

        it('should handle only braces', () => {
            const input = '{}'
            const expected = '{{}}'
            expect(escapeCurlyBraces(input)).toBe(expected)
        })

        it('should escape TypeScript interfaces', () => {
            const input = 'interface User { name: string; age: number; }'
            const expected = 'interface User {{ name: string; age: number; }}'
            expect(escapeCurlyBraces(input)).toBe(expected)
        })
    })
})
