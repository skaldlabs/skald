import { startExpressServer } from '@mit/expressServer'
import { chatUiConfigRouter } from '@ee/api/chatUiConfig'
import { chat, checkAvailability, getConfig } from '@ee/api/publicChat'

export const startEnterpriseExpressServer = async () => {
    await startExpressServer(
        [['/organizations/:organization_uuid/projects/:uuid/chat_ui_config', [], chatUiConfigRouter]],
        [
            ['/api/public_chat/:slug', 'POST', [], chat],
            ['/api/public_chat/:slug/available', 'GET', [], checkAvailability],
            ['/api/public_chat/:slug/config', 'GET', [], getConfig],
        ]
    )
}
