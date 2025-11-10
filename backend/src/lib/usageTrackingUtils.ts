const CHARS_PER_WRITE_OPERATION = 3000

export const calculateMemoWritesUsage = (content: string): number => {
    return Math.ceil(content.length / CHARS_PER_WRITE_OPERATION)
}
