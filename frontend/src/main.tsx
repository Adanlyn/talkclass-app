import ReactDOM from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import { RouterProvider } from 'react-router-dom';
import { router } from './app/routes';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './app/queryClient';
import { theme } from './theme';
import { NotificationsProvider } from './state/notifications';

async function enableMocks() {
  if (import.meta.env.DEV) {
    const { worker } = await import('./mocks/browser');
    await worker.start({ onUnhandledRequest: 'bypass' });
  }
}

enableMocks().finally(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <MantineProvider theme={theme}>
      <QueryClientProvider client={queryClient}>
        <NotificationsProvider>
          <RouterProvider router={router} />
        </NotificationsProvider>
      </QueryClientProvider>
    </MantineProvider>
  );
});
