import {LayerProvider, ThemeProvider, ToastProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {render, type RenderResult} from '@testing-library/react'
import type {ReactElement, ReactNode} from 'react'

const theme = buildTheme()

/**
 * Render a component inside the @sanity/ui provider stack (theme, layers,
 * toasts) so Studio UI primitives — popovers, portals, toasts — behave as they
 * do in the Studio, without booting a full Studio. Used by component
 * interaction tests.
 */
export function renderWithUi(ui: ReactElement): RenderResult {
  return render(ui, {
    wrapper: ({children}: {children: ReactNode}) => (
      <ThemeProvider theme={theme}>
        <LayerProvider>
          <ToastProvider>{children}</ToastProvider>
        </LayerProvider>
      </ThemeProvider>
    ),
  })
}
