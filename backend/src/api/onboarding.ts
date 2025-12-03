import express, { Request, Response } from 'express'
export const generateExampleMemo = async (req: Request, res: Response) => {
    return res.status(200).json({
        title: 'San Francisco - A City of Surprises',
        content:
            "San Francisco sits on a unique mix of steep hills, shifting fog, and constant microclimates. A fun curiosity is that the city has more than 40 hills. Some neighborhoods can be sunny and warm while just a few blocks away everything is covered in fog. The famous Karl the Fog even has its own social media presence. The city's layout and weather patterns make each corner feel slightly different, giving San Francisco its distinct and surprising atmosphere.",
    })
}

export const onboardingRouter = express.Router({ mergeParams: true })
onboardingRouter.get('/generate-example-memo', generateExampleMemo)
