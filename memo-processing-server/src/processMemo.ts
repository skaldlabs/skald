import { KnowledgeBaseUpdateAction, createKnowledgeBaseUpdateAgent } from "./agents/knowledgeBaseUpdateAgent/knowledgeBaseUpdateAgent"
import { deleteMemo, fetchMemo, FetchMemoResult } from "./db/memo"


export const processMemo = async (memoUuid: string) => {
    const startTime = Date.now()
    const memo = await fetchMemo(memoUuid)

    console.log(`Time taken to process memo: ${Date.now() - startTime}ms`)

    const knowledgeBaseUpdateStartTime = Date.now()

    const actions = await _knowledgeBaseUpdate(memo)
    console.log(actions)
    for (const action of actions) {
        // if (action.action === 'INSERT' && action.content === 'provided_content_unchanged') {
        //     await updateMemo(memo.uuid, [{
        //         column: 'pending',
        //         value: false
        //     }])
        //     const promises = [
        //         _createMemoChunks(memo.uuid, memo.content),
        //         _extractTagsFromMemo(memo),
        //         _generateMemoSummary(memo)
        //     ]

        //     await Promise.all(promises)
        // }
    }
    const knowledgeBaseUpdateEndTime = Date.now()
    console.log(`Time taken to update knowledge base: ${knowledgeBaseUpdateEndTime - knowledgeBaseUpdateStartTime}ms`)
    const endTime = Date.now()
    console.log(`Total time taken to process memo: ${endTime - startTime}ms`)

    // if there's an INSERT action, create the memo chunks and set pending to False
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

