import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface TalkToFounderModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

type Founder = 'founder1' | 'founder2' | null

export const TalkToFounderModal = ({ open, onOpenChange }: TalkToFounderModalProps) => {
    const [selectedFounder, setSelectedFounder] = useState<Founder>(null)

    const founders = [
        {
            id: 'founder1' as const,
            name: 'Pedrique',
            image: '/pedrique.webp',
            description: (
                <>
                    <h3 className="mb-2">Pedrique</h3>
                    <p>pedrique@useskald.com</p>
                    <p>
                        <a href="https://pedrique.useskald.com" target="_blank" className="text-blue-500">
                            Book a meeting
                        </a>
                    </p>
                </>
            ),
        },
        {
            id: 'founder2' as const,
            name: 'Yakko',
            image: '/yakko.webp',
            description: (
                <>
                    <h3 className="mb-2">Yakko</h3>
                    <p>yakko@useskald.com</p>
                    <p>
                        <a href="https://yakko.useskald.com" target="_blank" className="text-blue-500">
                            Book a meeting
                        </a>
                    </p>
                </>
            ),
        },
    ]

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle className="text-center text-xl">Pick your character</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-6 py-6">
                    {founders.map((founder) => (
                        <div key={founder.id} className="flex flex-col items-center">
                            <button
                                onClick={() => setSelectedFounder(founder.id)}
                                className={`
                                    relative rounded-lg overflow-hidden transition-all duration-200 cursor-pointer
                                    ${selectedFounder === founder.id ? 'ring-2 ring-green-500' : ''}
                                `}
                            >
                                <img
                                    src={founder.image}
                                    alt={founder.name}
                                    className={`
                                        w-full h-auto transition-opacity duration-200
                                        ${selectedFounder === founder.id ? 'opacity-100' : 'opacity-60 hover:opacity-80'}
                                    `}
                                />
                            </button>
                            {selectedFounder === founder.id && (
                                <div className="mt-4 text-sm text-center text-muted-foreground animate-in fade-in slide-in-from-top-2 duration-300">
                                    {founder.description}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    )
}
