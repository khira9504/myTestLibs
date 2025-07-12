import { ProductCard } from '@/components/ProductCard';

const products = [
  {
    id: 1,
    name: 'Stylish T-Shirt',
    price: '$29.99',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=2080&auto=format&fit=crop',
  },
  {
    id: 2,
    name: 'Modern Backpack',
    price: '$79.99',
    image: 'https://images.unsplash.com/photo-1553062407-98eeb68c6a62?q=80&w=1974&auto=format&fit=crop',
  },
  {
    id: 3,
    name: 'Classic Sneakers',
    price: '$99.99',
    image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=1974&auto=format&fit=crop',
  },
  {
    id: 4,
    name: 'Elegant Watch',
    price: '$199.99',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1999&auto=format&fit=crop',
  },
];

export const ProductSection = () => {
  return (
    <section className="py-12 sm:py-16">
      <div className="container">
        <h2 className="text-center text-3xl font-bold tracking-tight">Featured Products</h2>
        <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
};
