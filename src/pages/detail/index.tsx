import React, { useState } from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro, { useLoad } from '@tarojs/taro';
import { recipes } from '@/data/recipes';
import { healthProfiles } from '@/data/healthProfiles';
import { findRecipeById } from '@/utils/recipeFilters';
import { isFavoriteRecipe, toggleFavoriteRecipe } from '@/utils/favorites';
import { setPendingRecommendGroup } from '@/utils/recommendHandoff';
import type { HealthGroup } from '@/types/recipe';
import SectionHeader from '@/components/SectionHeader';
import styles from './index.module.scss';

// 营养参考值(每餐),用于进度条占比
const NUTRITION_REF = { calories: 800, protein: 50, carbs: 80, fat: 30 } as const;

const Detail: React.FC = () => {
  const [recipeId, setRecipeId] = useState<string>();
  const [favorite, setFavorite] = useState(false);

  useLoad((options) => {
    const id = options?.id;
    setRecipeId(id);
    if (id) {
      setFavorite(isFavoriteRecipe(id));
    }
  });

  const recipe = recipeId ? findRecipeById(recipes, recipeId) : undefined;

  if (!recipe) {
    return (
      <View className={styles.page}>
        <View className={styles.empty}>
          <Text className={styles.emptyText}>菜谱不存在或已下架</Text>
        </View>
      </View>
    );
  }

  const handleFavorite = () => {
    const next = toggleFavoriteRecipe(recipe.id);
    setFavorite(next);
    Taro.showToast({ title: next ? '已收藏' : '已取消收藏', icon: 'none' });
  };

  const goGroup = (g: HealthGroup) => {
    setPendingRecommendGroup(g);
    Taro.switchTab({ url: '/pages/recommend/index' });
  };

  const groupTitle = (g: HealthGroup) =>
    healthProfiles.find((p) => p.id === g)?.title ?? g;

  const nutritionItems = [
    { label: '热量', value: recipe.nutrition.calories, unit: 'kcal', ref: NUTRITION_REF.calories },
    { label: '蛋白质', value: recipe.nutrition.protein, unit: 'g', ref: NUTRITION_REF.protein },
    { label: '碳水', value: recipe.nutrition.carbs, unit: 'g', ref: NUTRITION_REF.carbs },
    { label: '脂肪', value: recipe.nutrition.fat, unit: 'g', ref: NUTRITION_REF.fat },
  ];

  return (
    <View className={styles.page}>
      <Image className={styles.cover} src={recipe.image} mode="aspectFill" />

      <View className={styles.body}>
        <View className={styles.titleRow}>
          <Text className={styles.title}>{recipe.title}</Text>
          <View className={styles.favBtn} onClick={handleFavorite}>
            <Text className={styles.favIcon}>{favorite ? '♥' : '♡'}</Text>
          </View>
        </View>

        <View className={styles.metaRow}>
          <Text className={styles.metaItem}>{recipe.cookingTime} 分钟</Text>
          <Text className={styles.metaDot}>·</Text>
          <Text className={styles.metaItem}>{recipe.difficulty}</Text>
          <Text className={styles.metaDot}>·</Text>
          <Text className={styles.metaItem}>{recipe.nutrition.calories} kcal</Text>
        </View>

        <Text className={styles.desc}>{recipe.description}</Text>

        <View className={styles.section}>
          <SectionHeader title="用料" />
          <View className={styles.tagWrap}>
            {recipe.ingredients.map((i) => (
              <Text key={i} className={styles.ingredientTag}>{i}</Text>
            ))}
          </View>
        </View>

        <View className={styles.section}>
          <SectionHeader title="营养成分" />
          <View className={styles.nutrition}>
            {nutritionItems.map((n) => {
              const pct = Math.min(100, Math.round((n.value / n.ref) * 100));
              return (
                <View key={n.label} className={styles.nutritionRow}>
                  <Text className={styles.nutritionLabel}>{n.label}</Text>
                  <View className={styles.bar}>
                    <View className={styles.barFill} style={{ width: `${pct}%` }} />
                  </View>
                  <Text className={styles.nutritionValue}>{n.value}{n.unit}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {recipe.suitableGroups.length > 0 && (
          <View className={styles.section}>
            <SectionHeader title="适宜人群" />
            <View className={styles.tagWrap}>
              {recipe.suitableGroups.map((g) => (
                <Text key={g} className={styles.suitTag} onClick={() => goGroup(g)}>
                  {groupTitle(g)}
                </Text>
              ))}
            </View>
          </View>
        )}

        {recipe.avoidGroups.length > 0 && (
          <View className={styles.section}>
            <SectionHeader title="需注意人群" />
            <View className={styles.tagWrap}>
              {recipe.avoidGroups.map((g) => (
                <Text key={g} className={styles.avoidTag} onClick={() => goGroup(g)}>
                  {groupTitle(g)}
                </Text>
              ))}
            </View>
          </View>
        )}

        <View className={styles.section}>
          <SectionHeader title="烹饪步骤" />
          <View className={styles.steps}>
            {recipe.steps.map((step, idx) => (
              <View key={step.title} className={styles.step}>
                <View className={styles.stepIndex}>
                  <Text className={styles.stepIndexText}>{idx + 1}</Text>
                </View>
                <View className={styles.stepContent}>
                  <Text className={styles.stepTitle}>{step.title}</Text>
                  <Text className={styles.stepDesc}>{step.description}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View className={styles.tipCard}>
          <Text className={styles.tipLabel}>小贴士</Text>
          <Text className={styles.tipText}>{recipe.tips}</Text>
        </View>
      </View>
    </View>
  );
};

export default Detail;
