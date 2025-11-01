// this MUST come first to set the environment variables from .env
import '@/settings'

import { startExpressServer } from '@/expressServer'
import { startMemoProcessingServer } from '@/memoProcessingServer'
import { logger } from '@/lib/logger'

const getModeFromArgs = (): string | null => {
    const args = process.argv.slice(2)

    // check for --mode=value format
    const modeArg = args.find((arg) => arg.startsWith('--mode='))
    if (modeArg) {
        return modeArg.split('=')[1]
    }

    // check for --mode value format
    const modeIndex = args.indexOf('--mode')
    if (modeIndex !== -1 && modeIndex + 1 < args.length) {
        return args[modeIndex + 1]
    }

    return 'express-server'
}

const mode = getModeFromArgs()

if (mode === 'express-server') {
    startExpressServer()
} else if (mode === 'memo-processing-server') {
    startMemoProcessingServer()
} else {
    logger.error({ mode }, 'Invalid mode')
    process.exit(1)
}
