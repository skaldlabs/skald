import express from 'express'
import { googleAuthRouter } from './googleAuth'

export const authRouter = express.Router({ mergeParams: true })

authRouter.use('/google', googleAuthRouter)
