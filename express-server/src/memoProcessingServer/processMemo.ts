import { MemoContent } from '../entities/MemoContent'
import { createMemoChunks, extractTagsFromMemo, generateMemoSummary } from './memoOperations'
import { EntityManager } from '@mikro-orm/core'

export const processMemo = async (em: EntityManager, memoUuid: string) => {
    const memoContent = await em.findOne(MemoContent, { uuid: memoUuid }, { populate: ['project', 'memo'] })
    if (!memoContent) {
        throw new Error(`Memo not found: ${memoUuid}`)
    }
    const promises = [
        createMemoChunks(em, memoContent.memo.uuid, memoContent.project.uuid, memoContent.content),
        extractTagsFromMemo(em, memoContent.memo.uuid, memoContent.content, memoContent.project.uuid),
        generateMemoSummary(em, memoContent.memo.uuid, memoContent.content, memoContent.project.uuid),
    ]

    await Promise.all(promises)
}
