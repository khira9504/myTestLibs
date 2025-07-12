import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface ProductCardProps {
  product: {
    id: number;
    name: string;
    price: string;
    image: string;
  };
}

export const ProductCard = ({ product }: ProductCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
      whileHover={{ y: -5 }}
      className="overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm"
    >
      <img src={product.image} alt={product.name} className="h-64 w-full object-cover" />
      <div className="p-4">
        <h3 className="text-lg font-semibold">{product.name}</h3>
        <p className="mt-1 text-muted-foreground">{product.price}</p>
        <Button className="mt-4 w-full">Add to Cart</Button>
      </div>
    </motion.div>
  );
};
