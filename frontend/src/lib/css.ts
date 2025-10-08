export const getCssVariable = (variable: string): string => {
    return getComputedStyle(document.documentElement).getPropertyValue(variable).trim()
}

export const getCssVariableAsNumber = (variable: string): number => {
    return parseInt(getCssVariable(variable))
}
