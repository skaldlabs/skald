import React from 'react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from '@/App'
import { getCssVariableAsNumber } from '@/lib/css.ts'
import { getCssVariable } from '@/lib/css.ts'
import { ConfigProvider } from 'antd'
import { theme } from 'antd'
import '@/styles/global.css'
import '@/styles/antd-overrides.css'

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <ConfigProvider
            theme={{
                ...theme,
                token: {
                    // Colors
                    colorPrimary: getCssVariable('--bg-primary'),
                    colorBgBase: getCssVariable('--bg'),
                    colorInfo: getCssVariable('--bg-primary'),
                    colorLink: getCssVariable('--bg-primary'),
                    colorTextBase: getCssVariable('--fg'),
                    colorBgContainer: getCssVariable('--bg-card'),
                    colorText: getCssVariable('--fg-card'),
                    colorBgElevated: getCssVariable('--bg-popover'),
                    colorTextDescription: getCssVariable('--fg-muted'),
                    colorBgLayout: getCssVariable('--bg-muted'),
                    colorTextSecondary: getCssVariable('--fg-secondary'),
                    colorError: getCssVariable('--bg-destructive'),
                    colorSuccess: getCssVariable('--bg-success'),
                    colorBorder: getCssVariable('--border'),
                    colorWarning: getCssVariable('--bg-warning'),

                    // Border radius
                    borderRadius: getCssVariableAsNumber('--radius'),

                    // Padding
                    padding: getCssVariableAsNumber('--padding'),
                    paddingLG: getCssVariableAsNumber('--padding-lg'),
                    paddingMD: getCssVariableAsNumber('--padding-md'),
                    paddingSM: getCssVariableAsNumber('--padding-sm'),
                    paddingXS: getCssVariableAsNumber('--padding-xs'),
                },

                components: {
                    Card: {
                        headerHeight: 40,
                    },
                },
            }}
        >
            <App />
        </ConfigProvider>
    </StrictMode>
)
