import ReactDOM from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import { RouterProvider } from 'react-router-dom';
import { router } from './app/routes';
import { QueryClient,QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './app/queryClient';
import { theme } from './theme';
import { NotificationsProvider } from './state/notifications';
import { Notifications } from '@mantine/notifications';
import '@mantine/notifications/styles.css';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';

import React from 'react';

const qc = new QueryClient()  ;

async function enableMocks() {
  if (import.meta.env.DEV) {
    const { worker } = await import('./mocks/browser');
    await worker.start({ onUnhandledRequest: 'bypass' });
  }
}

enableMocks().finally(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <MantineProvider theme={theme}>
        <Notifications position="bottom-right" autoClose={10000} zIndex={10000} />
      <QueryClientProvider client={queryClient}>
        <NotificationsProvider>
          <RouterProvider router={router} />
        </NotificationsProvider>
      </QueryClientProvider>
    </MantineProvider>
  );
});
