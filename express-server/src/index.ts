import { config } from 'dotenv'
import { resolve } from 'path'

if (process.env.NODE_ENV === 'development') {
    config({ path: resolve(__dirname, '../../.env') })
} else {
    config({ path: resolve(__dirname, '.env') })
}

import { startExpressServer } from './expressServer'
import { startMemoProcessingServer } from './memoProcessingServer'

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
    console.error('Invalid mode:', mode)
    process.exit(1)
}
