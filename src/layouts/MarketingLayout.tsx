import { Outlet } from 'react-router-dom';
import { Nav } from '../components/layout/Nav';
import { Footer } from '../components/layout/Footer';
import { SignupLoginModal } from '../components/modals/SignupLoginModal';
import { NewsletterModal } from '../components/modals/NewsletterModal';

export function MarketingLayout() {
  return (
    <>
      <Nav />
      <Outlet />
      <Footer />
      <SignupLoginModal />
      <NewsletterModal />
    </>
  );
}
