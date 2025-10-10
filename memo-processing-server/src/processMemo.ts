import { KnowledgeBaseUpdateAction, createKnowledgeBaseUpdateAgent } from "./agents/knowledgeBaseUpdateAgent/knowledgeBaseUpdateAgent"
import { createMemoChunks, extractTagsFromMemo, generateMemoSummary } from "./agents/knowledgeBaseUpdateAgent/memoOperations"
import { deleteMemo, fetchMemo, FetchMemoResult, updateMemo } from "./db/memo"


export const processMemo = async (memoUuid: string) => {
    const memo = await fetchMemo(memoUuid)
    await updateMemo(memo.uuid, [{
        column: 'pending',
        value: false
    }])
    const promises = [
        createMemoChunks(memo.uuid, memo.content),
        extractTagsFromMemo(memo),
        generateMemoSummary(memo)
    ]

    await Promise.all(promises)
}


const _knowledgeBaseUpdate = async (memo: FetchMemoResult): Promise<KnowledgeBaseUpdateAction[]> => {
    const knowledgeBaseUpdateAgent = createKnowledgeBaseUpdateAgent(memo)
    const actions = await knowledgeBaseUpdateAgent.determineActions(memo.uuid, memo.content, memo.title)
    const incomingMemo = await fetchMemo(memo.uuid)
    // if the knowledge based update agent never inserted the memo (by setting pending to false), delete the memo
    if (incomingMemo.pending) {
        await deleteMemo(memo.uuid)
    }
    return actions.actions
}

