import { DI } from '@/di'

export const getTitleAndSummaryForMemoList = async (
    projectUuid: string,
    memoUuids: string[]
): Promise<Map<string, { title: string; summary: string }>> => {
    const extraWhereCondition = memoUuids.length > 0 ? `AND skald_memo.uuid IN (?)` : ''
    const memoProperties = await DI.em.getConnection().execute<{ uuid: string; title: string; summary: string }[]>(
        `
        SELECT skald_memo.uuid, skald_memo.title, skald_memosummary.summary
        FROM skald_memo
        JOIN skald_memosummary ON skald_memo.uuid = skald_memosummary.memo_id
        WHERE skald_memo.project_id = ? ${extraWhereCondition}
    `,
        [projectUuid, ...memoUuids]
    )

    const memoPropertiesMap = new Map<string, { title: string; summary: string }>()
    for (const memoProperty of memoProperties) {
        memoPropertiesMap.set(memoProperty.uuid, { title: memoProperty.title, summary: memoProperty.summary })
    }

    return memoPropertiesMap
}
