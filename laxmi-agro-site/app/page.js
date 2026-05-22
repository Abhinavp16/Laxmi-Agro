import HeroSection from '@/components/home/HeroSection';
import BrandsSection from '@/components/home/BrandsSection';
import BannersSection from '@/components/home/BannersSection';
import AboutSection from '@/components/home/AboutSection';
import ProductsSection from '@/components/home/ProductsSection';
import CategoriesSection from '@/components/home/CategoriesSection';
import StatsSection from '@/components/home/StatsSection';
import BlogSection from '@/components/home/BlogSection';
import ContactSection from '@/components/home/ContactSection';
import { getWebsiteContent } from '@/lib/website-content';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const {
    heroImages,
    featuredProducts,
    productCategories,
    featuredSection,
    categoriesSection,
  } = await getWebsiteContent();

  return (
    <>
      <HeroSection heroImages={heroImages} />
      <BrandsSection />
      <BannersSection />
      <AboutSection />
      <ProductsSection products={featuredProducts} section={featuredSection} />
      <CategoriesSection categories={productCategories} section={categoriesSection} />
      <StatsSection />
      <BlogSection />
      <ContactSection />
    </>
  );
}
