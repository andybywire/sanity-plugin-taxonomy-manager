import {LayerProvider, ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {ToastProvider} from '@sanity/ui/toast'
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
  return render(ui, {wrapper: UiProviders})
}

/** The same stack as a standalone wrapper, for `renderHook`. */
export function UiProviders({children}: {children: ReactNode}): ReactElement {
  return (
    <ThemeProvider theme={theme}>
      <LayerProvider>
        <ToastProvider>{children}</ToastProvider>
      </LayerProvider>
    </ThemeProvider>
  )
}
