'use client';

import { makeStyles } from '@fluentui/react-components';
import type { CategoryResult } from '@/checks/types';
import { CategoryCard } from './CategoryCard';

const useStyles = makeStyles({
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '16px',
    '@media (max-width: 1024px)': {
      gridTemplateColumns: 'repeat(2, 1fr)',
    },
    '@media (max-width: 640px)': {
      gridTemplateColumns: '1fr',
    },
  },
});

interface CategoryGridProps {
  categories: CategoryResult[];
  onCategoryClick?: (categoryId: string) => void;
}

export function CategoryGrid({ categories, onCategoryClick }: CategoryGridProps) {
  const styles = useStyles();

  return (
    <div className={styles.grid}>
      {categories.map((category) => (
        <CategoryCard
          key={category.categoryId}
          category={category}
          onClick={onCategoryClick}
        />
      ))}
    </div>
  );
}
