import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useSubscriptionStore, type OverageData } from '@/stores/subscriptionStore'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

interface BillingLimitCardProps {
    billingLimit: string | null
    overage: OverageData | undefined
}

export const BillingLimitCard = ({ billingLimit, overage }: BillingLimitCardProps) => {
    const setBillingLimit = useSubscriptionStore((state) => state.setBillingLimit)
    const [inputValue, setInputValue] = useState(billingLimit ? parseFloat(billingLimit).toFixed(2) : '')
    const [saving, setSaving] = useState(false)

    const handleSave = async () => {
        setSaving(true)
        const limit = inputValue.trim() === '' ? null : parseFloat(inputValue)
        if (limit !== null && (isNaN(limit) || limit < 0)) {
            setSaving(false)
            return
        }
        await setBillingLimit(limit)
        setSaving(false)
    }

    const handleRemove = async () => {
        setSaving(true)
        await setBillingLimit(null)
        setInputValue('')
        setSaving(false)
    }

    const currentLimit = billingLimit ? parseFloat(billingLimit) : null
    const overageCost = overage?.estimated_overage_cost ?? 0
    const exceeded = overage?.billing_limit_exceeded ?? false

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Billing Limit</CardTitle>
                        <CardDescription>Set a maximum amount for overage charges per billing period</CardDescription>
                    </div>
                    {exceeded && <Badge variant="destructive">Limit Reached</Badge>}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {overage && overageCost > 0 && (
                    <>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Current Overage Cost</p>
                                <p className="font-semibold">${overageCost.toFixed(2)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Billing Limit</p>
                                <p className="font-semibold">
                                    {currentLimit !== null ? `$${currentLimit.toFixed(2)}` : 'No limit set'}
                                </p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                            <p>Memo overage: {overage.memo_operations_overage_count.toLocaleString()} operations</p>
                            <p>Chat overage: {overage.chat_queries_overage_count.toLocaleString()} queries</p>
                        </div>
                        <Separator />
                    </>
                )}

                {overage && overageCost === 0 && currentLimit !== null && (
                    <>
                        <div>
                            <p className="text-sm text-muted-foreground">Current Billing Limit</p>
                            <p className="font-semibold">${currentLimit.toFixed(2)}</p>
                            <p className="text-sm text-muted-foreground mt-1">No overages this period</p>
                        </div>
                        <Separator />
                    </>
                )}

                <div className="flex items-end gap-3">
                    <div className="flex-1">
                        <label className="text-sm font-medium mb-1 block">Set Billing Limit (USD)</label>
                        <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="e.g. 10.00"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                        />
                    </div>
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? 'Saving...' : 'Save'}
                    </Button>
                    {currentLimit !== null && (
                        <Button variant="outline" onClick={handleRemove} disabled={saving}>
                            Remove
                        </Button>
                    )}
                </div>
                <p className="text-xs text-muted-foreground">
                    When your overage charges reach this limit, API access will be paused until you increase the limit.
                    Set to empty to allow unlimited overages.
                </p>
            </CardContent>
        </Card>
    )
}
