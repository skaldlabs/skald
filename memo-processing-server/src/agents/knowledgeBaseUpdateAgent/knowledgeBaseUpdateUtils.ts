import { generateSha256Hash } from "../../utils/hashingUtils";
import { createMemo } from "../../db/memo";
import { createMemoContent } from "../../db/memo";
import { createMemoChunks } from "./memoOperations";
import { extractTagsFromMemo } from "./memoOperations";
import { generateMemoSummary } from "./memoOperations";


export const handleNewMemoCreation = async (title: string, content: string): Promise<string> => {
    // TODO: run this in a transaction
    const contentHash = await generateSha256Hash(content);
    const newMemo = await createMemo({
        title: title,
        content_length: content.length,
        content_hash: contentHash
    })

    await createMemoContent({
        memo_uuid: newMemo.uuid,
        content: content
    })
    const newMemoWithContent = {
        ...newMemo,
        content: content
    }
    const promises = [
        createMemoChunks(newMemo.uuid, content),
        extractTagsFromMemo(newMemoWithContent),
        generateMemoSummary(newMemoWithContent)
    ]

    await Promise.all(promises)
    return newMemo.uuid
}