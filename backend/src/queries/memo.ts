import { DI } from '@/di'

export const getTitleAndSummaryAndContentForMemoList = async (
    projectUuid: string,
    memoUuids: string[]
): Promise<Map<string, { title: string; summary: string; content: string }>> => {
    const placeholders = memoUuids.length > 0 ? memoUuids.map(() => '?').join(', ') : ''
    const extraWhereCondition = memoUuids.length > 0 ? `AND skald_memo.uuid IN (${placeholders})` : ''
    const params = memoUuids.length > 0 ? [projectUuid, ...memoUuids] : [projectUuid]
    const memoProperties = await DI.em
        .getConnection()
        .execute<{ uuid: string; title: string; summary: string | null; content: string | null }[]>(
            `
        SELECT skald_memo.uuid, skald_memo.title, skald_memosummary.summary, skald_memocontent.content
        FROM skald_memo
        LEFT JOIN skald_memosummary ON skald_memo.uuid = skald_memosummary.memo_id
        LEFT JOIN skald_memocontent ON skald_memo.uuid = skald_memocontent.memo_id
        WHERE skald_memo.project_id = ? ${extraWhereCondition}
    `,
            params
        )

    const memoPropertiesMap = new Map<string, { title: string; summary: string; content: string }>()
    for (const memoProperty of memoProperties) {
        memoPropertiesMap.set(memoProperty.uuid, {
            title: memoProperty.title,
            summary: memoProperty.summary || '',
            content: memoProperty.content || '',
        })
    }

    return memoPropertiesMap
}
