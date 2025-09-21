import { type ReactNode } from 'react';

import { Footer } from '../Footer';
import { Header } from '../Header';

import { LayoutContent, LayoutRoot } from './styles';

interface BaseLayoutProps {
  children: ReactNode;
}

export const BaseLayout = ({ children }: BaseLayoutProps) => {
  return (
    <LayoutRoot>
      <Header />
      <LayoutContent>{children}</LayoutContent>
      <Footer />
    </LayoutRoot>
  );
};
