import { type ReactNode } from 'react';
import { LayoutRoot, LayoutContent } from './styles';
import { Header } from '../Header';
import { Footer } from '../Footer';

interface BaseLayoutProps {
  children: ReactNode;
}

export const BaseLayout = ({ children }: BaseLayoutProps) => {
  return (
    <LayoutRoot>
      <Header />
      <LayoutContent>
        {children}
      </LayoutContent>
      <Footer />
    </LayoutRoot>
  );
};
