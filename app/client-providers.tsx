'use client';

import { Providers } from './providers';
import { ReactNode } from 'react';

export function ClientProviders({ children }: { children: ReactNode }) {
  return <Providers>{children}</Providers>;
}
