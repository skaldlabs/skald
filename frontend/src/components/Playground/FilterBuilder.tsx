import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import type { MemoFilter, FilterOperator, FilterType, NativeField } from '@/lib/types'

interface FilterBuilderProps {
    filters: MemoFilter[]
    onAddFilter: (filter: Omit<MemoFilter, 'id'>) => void
    onUpdateFilter: (id: string, filter: Partial<Omit<MemoFilter, 'id'>>) => void
    onRemoveFilter: (id: string) => void
}

const NATIVE_FIELDS: { value: NativeField; label: string }[] = [
    { value: 'title', label: 'Title' },
    { value: 'source', label: 'Source' },
    { value: 'client_reference_id', label: 'Client Reference ID' },
    { value: 'tags', label: 'Tags' },
]

const OPERATORS: { value: FilterOperator; label: string; arrayOnly?: boolean; tagsOnly?: boolean }[] = [
    { value: 'eq', label: 'Equals' },
    { value: 'neq', label: 'Not equals' },
    { value: 'contains', label: 'Contains' },
    { value: 'startswith', label: 'Starts with' },
    { value: 'endswith', label: 'Ends with' },
    { value: 'in', label: 'In list', arrayOnly: true },
    { value: 'not_in', label: 'Not in list', arrayOnly: true },
]

const getAvailableOperators = (field: string, filterType: FilterType) => {
    if (filterType === 'native_field' && field === 'tags') {
        return OPERATORS.filter((op) => op.value === 'in' || op.value === 'not_in')
    }
    return OPERATORS
}

const isArrayOperator = (operator: FilterOperator) => operator === 'in' || operator === 'not_in'

export const FilterBuilder = ({ filters, onAddFilter, onUpdateFilter, onRemoveFilter }: FilterBuilderProps) => {
    const handleAddFilter = () => {
        onAddFilter({
            field: 'title',
            operator: 'contains',
            value: '',
            filter_type: 'native_field',
        })
    }

    const handleFieldChange = (id: string, field: string, currentFilter: MemoFilter) => {
        const updates: Partial<Omit<MemoFilter, 'id'>> = { field }

        // If switching to tags, force array operator and array value
        if (currentFilter.filter_type === 'native_field' && field === 'tags') {
            if (!isArrayOperator(currentFilter.operator)) {
                updates.operator = 'in'
            }
            if (!Array.isArray(currentFilter.value)) {
                updates.value = currentFilter.value ? [currentFilter.value] : []
            }
        }
        // If switching from tags to non-tags, convert array to string
        else if (currentFilter.filter_type === 'native_field' && currentFilter.field === 'tags' && field !== 'tags') {
            if (Array.isArray(currentFilter.value)) {
                updates.value = currentFilter.value[0] || ''
            }
            if (isArrayOperator(currentFilter.operator)) {
                updates.operator = 'contains'
            }
        }

        onUpdateFilter(id, updates)
    }

    const handleOperatorChange = (id: string, operator: FilterOperator, currentFilter: MemoFilter) => {
        const updates: Partial<Omit<MemoFilter, 'id'>> = { operator }

        // Convert value type based on operator
        if (isArrayOperator(operator) && !Array.isArray(currentFilter.value)) {
            updates.value = currentFilter.value ? [currentFilter.value] : []
        } else if (!isArrayOperator(operator) && Array.isArray(currentFilter.value)) {
            updates.value = currentFilter.value[0] || ''
        }

        onUpdateFilter(id, updates)
    }

    const handleValueChange = (id: string, value: string, isArray: boolean) => {
        if (isArray) {
            // Split by comma and trim whitespace
            const arrayValue = value
                .split(',')
                .map((v) => v.trim())
                .filter((v) => v)
            onUpdateFilter(id, { value: arrayValue })
        } else {
            onUpdateFilter(id, { value })
        }
    }

    const handleFilterTypeChange = (id: string, filterType: FilterType, currentFilter: MemoFilter) => {
        const updates: Partial<Omit<MemoFilter, 'id'>> = { filter_type: filterType }

        if (filterType === 'native_field') {
            updates.field = 'title'
            // Reset operator if needed
            if (isArrayOperator(currentFilter.operator)) {
                updates.operator = 'contains'
                if (Array.isArray(currentFilter.value)) {
                    updates.value = currentFilter.value[0] || ''
                }
            }
        } else {
            // Custom metadata - keep field as custom key
            updates.field = currentFilter.field === 'title' ? '' : currentFilter.field
        }

        onUpdateFilter(id, updates)
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Label className="text-base">Filters</Label>
                <Button variant="outline" size="sm" onClick={handleAddFilter}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Filter
                </Button>
            </div>

            {filters.length === 0 && (
                <p className="text-sm text-muted-foreground">
                    No filters applied. Add filters to narrow down search results.
                </p>
            )}

            <div className="space-y-3">
                {filters.map((filter) => {
                    const availableOperators = getAvailableOperators(filter.field, filter.filter_type)
                    const showArrayInput =
                        isArrayOperator(filter.operator) ||
                        (filter.filter_type === 'native_field' && filter.field === 'tags')
                    const displayValue = Array.isArray(filter.value) ? filter.value.join(', ') : filter.value

                    return (
                        <div key={filter.id} className="p-3 border rounded-lg space-y-3 bg-muted/30">
                            <div className="flex items-center gap-2">
                                <Select
                                    value={filter.filter_type}
                                    onValueChange={(v) => handleFilterTypeChange(filter.id, v as FilterType, filter)}
                                >
                                    <SelectTrigger className="w-[140px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="native_field">Native Field</SelectItem>
                                        <SelectItem value="custom_metadata">Custom Metadata</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 ml-auto"
                                    onClick={() => onRemoveFilter(filter.id)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                {filter.filter_type === 'native_field' ? (
                                    <Select
                                        value={filter.field}
                                        onValueChange={(v) => handleFieldChange(filter.id, v, filter)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select field" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {NATIVE_FIELDS.map((f) => (
                                                <SelectItem key={f.value} value={f.value}>
                                                    {f.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <Input
                                        placeholder="Metadata key"
                                        value={filter.field}
                                        onChange={(e) => onUpdateFilter(filter.id, { field: e.target.value })}
                                    />
                                )}

                                <Select
                                    value={filter.operator}
                                    onValueChange={(v) => handleOperatorChange(filter.id, v as FilterOperator, filter)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Operator" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableOperators.map((op) => (
                                            <SelectItem key={op.value} value={op.value}>
                                                {op.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <Input
                                placeholder={showArrayInput ? 'Values (comma-separated)' : 'Value'}
                                value={displayValue}
                                onChange={(e) => handleValueChange(filter.id, e.target.value, showArrayInput)}
                            />
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
