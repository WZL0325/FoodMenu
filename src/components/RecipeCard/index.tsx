import React from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import type { Recipe } from '@/types/recipe';
import styles from './index.module.scss';

interface RecipeCardProps {
  recipe: Recipe;
  compact?: boolean;
}

/**
 * 菜谱卡片组件，承载菜品图片、健康标签、烹饪时间与营养信息。
 */
const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, compact = false }) => {
  const handleCardClick = () => {
    Taro.navigateTo({ url: `/pages/detail/index?id=${recipe.id}` });
  };

  const handleImageError = () => {
    console.error('[RecipeCard] 菜谱图片加载失败', { recipeId: recipe.id, image: recipe.image });
  };

  return (
    <View className={compact ? styles.compactCard : styles.card} onClick={handleCardClick}>
      <Image className={styles.image} src={recipe.image} mode="aspectFill" onError={handleImageError} />
      <View className={styles.content}>
        <View className={styles.headerRow}>
          <Text className={styles.title}>{recipe.title}</Text>
          <Text className={styles.time}>{recipe.cookingTime}分钟</Text>
        </View>
        <Text className={styles.desc}>{recipe.description}</Text>
        <View className={styles.tags}>
          {recipe.healthTags.slice(0, 3).map((tag) => (
            <Text key={tag} className={styles.tag}>
              {tag}
            </Text>
          ))}
        </View>
        <View className={styles.footer}>
          <Text className={styles.nutrition}>{recipe.nutrition.calories} kcal</Text>
          <Text className={styles.difficulty}>{recipe.difficulty}</Text>
        </View>
      </View>
    </View>
  );
};

export default RecipeCard;
