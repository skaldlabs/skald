import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'

export const SelfHostedWelcomePage = () => {
    const navigate = useNavigate()

    return (
        <div className="flex justify-center items-center min-h-screen bg-background p-4">
            <Card className="w-full max-w-2xl">
                <CardContent className="pt-12 px-12 pb-12">
                    <div className="space-y-6 text-base leading-relaxed text-foreground">
                        <div className="text-left text-sm text-muted-foreground mb-8">
                            <p>Welcome to Skald self-hosted</p>
                        </div>

                        <div className="space-y-4">
                            <p className="text-lg">Hey there,</p>

                            <p>
                                Thanks for doing a deploy of Skald. As you know, Skald is fully{' '}
                                <strong className="font-semibold">MIT-licensed</strong>.
                            </p>

                            <p>
                                We're growing fast, but we're still a small team. That means prioritizing is{' '}
                                <em className="italic">hard</em>, and we want to make sure our self-hosted users have as
                                good of an experience as our Cloud users.
                            </p>

                            <p>
                                For that to work, we{' '}
                                <strong className="font-semibold">need to hear feedback from you</strong>. Even if your
                                feedback is to tell us our product sucks.
                            </p>

                            <p>
                                We don't know what goes on when someone does a self-hosted deploy, meaning anything you
                                can tell us helps us massively.
                            </p>

                            <p>
                                So please consider joining our Slack community or emailing us at{' '}
                                <span className="text-primary font-medium">dev@useskald.com</span> with your feedback
                                once you've gotten a chance to use Skald.
                            </p>

                            <p>Thanks again for trying Skald! We'd love to make it a great experience for you.</p>
                        </div>

                        <div className="mt-12 pt-8 border-t border-border">
                            <p className="text-muted-foreground mb-6">— The Skald Team</p>

                            <div className="flex flex-col sm:flex-row gap-3 mt-8">
                                <Button
                                    variant="outline"
                                    onClick={() =>
                                        window.open(
                                            'https://join.slack.com/t/skaldcommunity/shared_invite/zt-3he986lub-UWKTZneOAUeTFa4LDXpFEg',
                                            '_blank',
                                            'noopener,noreferrer'
                                        )
                                    }
                                    className="flex-1"
                                >
                                    Join Slack
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => window.open('https://cal.com/yakko/15min', '_blank', 'noopener')}
                                    className="flex-1"
                                >
                                    Schedule feedback call
                                </Button>
                                <Button
                                    variant="default"
                                    onClick={() => navigate('/projects/get-started')}
                                    className="flex-1"
                                >
                                    Go to app
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
