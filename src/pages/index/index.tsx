import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import { ingredientOptions } from '@/data/ingredients';
import { recipes } from '@/data/recipes';
import { filterRecipesByIngredients } from '@/utils/recipeFilters';
import type { IngredientOption } from '@/types/recipe';
import RecipeCard from '@/components/RecipeCard';
import SectionHeader from '@/components/SectionHeader';
import styles from './index.module.scss';

const GROUP_ORDER: Array<IngredientOption['type']> = ['vegetable', 'meat', 'other'];
const GROUP_LABEL: Record<IngredientOption['type'], string> = {
  vegetable: '蔬菜',
  meat: '肉类',
  other: '其他',
};

const Index: React.FC = () => {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (name: string) => {
    setSelected((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const grouped = useMemo(() => {
    return GROUP_ORDER.map((type) => ({
      type,
      label: GROUP_LABEL[type],
      items: ingredientOptions.filter((i) => i.type === type),
    }));
  }, []);

  const result = useMemo(
    () => filterRecipesByIngredients(recipes, selected),
    [selected]
  );

  return (
    <View className={styles.page}>
      <View className={styles.hero}>
        <Text className={styles.heroTitle}>今天吃点什么?</Text>
        <Text className={styles.heroSub}>选你手上的食材,看看能做什么菜</Text>
      </View>

      <View className={styles.ingredientSection}>
        {grouped.map((group) => (
          <View key={group.type} className={styles.group}>
            <Text className={styles.groupLabel}>{group.label}</Text>
            <ScrollView scrollX className={styles.tagScroll}>
              {group.items.map((item) => {
                const active = selected.includes(item.name);
                return (
                  <View
                    key={item.id}
                    className={`${styles.tag} ${active ? styles.tagActive : ''}`}
                    onClick={() => toggle(item.name)}
                  >
                    <Text className={styles.tagText}>{item.name}</Text>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        ))}
      </View>

      <View className={styles.resultSection}>
        <SectionHeader
          title={selected.length === 0 ? '全部菜谱' : `为你找到 ${result.length} 道菜`}
          subtitle={selected.length === 0 ? '选个食材缩小范围' : undefined}
        />
        {result.length === 0 ? (
          <View className={styles.empty}>
            <Text className={styles.emptyText}>没有匹配的菜,试试少选一种或换个搭配</Text>
          </View>
        ) : (
          <View className={styles.list}>
            {result.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

export default Index;
