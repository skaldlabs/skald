type Operator = 'eq' | 'neq' | 'contains' | 'startswith' | 'endswith' | 'in' | 'not_in'
type FilterType = 'native_field' | 'custom_metadata'
type NativeField = 'title' | 'source' | 'client_reference_id' | 'tags'

const SUPPORTED_OPERATORS: Operator[] = ['eq', 'neq', 'contains', 'startswith', 'endswith', 'in', 'not_in']

export interface MemoFilter {
    field: string
    operator: Operator
    value: any
    filter_type: FilterType
}

interface ParseFilterResult {
    filter: MemoFilter | null
    error: string | null
}

export function parseFilter(filterDict: Record<string, any>): ParseFilterResult {
    /**
     * Parse and validate a filter dictionary, returning an object with:
     * - filter: MemoFilter object if parsing was successful or null if it was not
     * - error: The first error encountered if parsing was not successful or null if it was successful
     */

    // Validate required fields
    const { field, operator, value, filter_type } = filterDict

    if (!field || !operator || value === undefined || !filter_type) {
        return {
            filter: null,
            error: 'Filter must have field, operator, value, and filter_type',
        }
    }

    const memoFilter: MemoFilter = {
        field,
        operator: operator as Operator,
        value,
        filter_type: filter_type as FilterType,
    }

    if (memoFilter.operator === 'in' || memoFilter.operator === 'not_in') {
        if (!Array.isArray(memoFilter.value)) {
            return {
                filter: null,
                error: 'Value must be a list for in or not_in operators',
            }
        }
    }

    if (!SUPPORTED_OPERATORS.includes(memoFilter.operator)) {
        return {
            filter: null,
            error: `Invalid operator. Must be one of: ${SUPPORTED_OPERATORS.join(', ')}`,
        }
    }

    if (memoFilter.filter_type !== 'native_field' && memoFilter.filter_type !== 'custom_metadata') {
        return {
            filter: null,
            error: 'Invalid filter type. Must be one of: native_field, custom_metadata',
        }
    }

    if (memoFilter.filter_type === 'native_field') {
        const validFields: NativeField[] = ['title', 'source', 'client_reference_id', 'tags']
        if (!validFields.includes(memoFilter.field as NativeField)) {
            return {
                filter: null,
                error: 'Invalid field for native_field filter. Must be one of: title, source, client_reference_id, tags',
            }
        }
        if (memoFilter.field === 'tags') {
            if (!Array.isArray(memoFilter.value)) {
                return { filter: null, error: 'Value must be a list for tags filter' }
            }
            if (!memoFilter.value.every((tag: any) => typeof tag === 'string')) {
                return { filter: null, error: 'Value must be a list of strings for tags filter' }
            }
            if (memoFilter.operator !== 'in' && memoFilter.operator !== 'not_in') {
                return { filter: null, error: 'Operator must be in or not_in for tags filter' }
            }
        }
    }

    return { filter: memoFilter, error: null }
}
