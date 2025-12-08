interface AuthPromoProps {
    variant?: 'login' | 'signup'
}

export const AuthPromo = ({ variant = 'signup' }: AuthPromoProps) => {
    const text = variant === 'login' ? "You've been saving" : "You're about to save"

    return (
        <div className="flex flex-col justify-center items-center bg-[#fafafc] dark:bg-[#1b1b1b] text-black dark:text-white p-12 h-screen border-l border-gray-200 dark:border-[#252525] relative">
            <div className="max-w-md space-y-6 text-center">
                <h2 className="text-2xl lg:text-2xl font-bold leading-tight text-black/60 dark:text-white/60">
                    {text} <span className="text-black dark:text-white">thousands</span> of engineering hours
                </h2>
            </div>
            <p
                className="absolute bottom-8 text-base font-bold tracking-wider text-black/40 dark:text-white/30 text-center"
                style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
            >
                skald
            </p>
        </div>
    )
}
