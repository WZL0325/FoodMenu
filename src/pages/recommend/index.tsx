import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import { useLoad, useDidShow } from '@tarojs/taro';
import { healthProfiles } from '@/data/healthProfiles';
import { recipes } from '@/data/recipes';
import { filterRecipesByHealthGroup } from '@/utils/recipeFilters';
import { consumePendingRecommendGroup } from '@/utils/recommendHandoff';
import type { HealthGroup } from '@/types/recipe';
import RecipeCard from '@/components/RecipeCard';
import SectionHeader from '@/components/SectionHeader';
import styles from './index.module.scss';

const Recommend: React.FC = () => {
  const [group, setGroup] = useState<HealthGroup>(healthProfiles[0].id);

  // 支持直接(非 tab)导航时通过 ?group=xxx 自动选中
  useLoad((options) => {
    const incoming = options?.group as HealthGroup | undefined;
    if (incoming && healthProfiles.some((p) => p.id === incoming)) {
      setGroup(incoming);
    }
  });

  // 详情页点击人群标签 → switchTab 到本页(tabBar 页无法带 URL query),
  // 通过一次性 handoff 模块拿到目标人群。
  useDidShow(() => {
    const pending = consumePendingRecommendGroup();
    if (pending && healthProfiles.some((p) => p.id === pending)) {
      setGroup(pending);
    }
  });

  const profile = useMemo(
    () => healthProfiles.find((p) => p.id === group) ?? healthProfiles[0],
    [group]
  );

  const result = useMemo(
    () => filterRecipesByHealthGroup(recipes, group),
    [group]
  );

  return (
    <View className={styles.page}>
      <ScrollView scrollX className={styles.groupScroll}>
        {healthProfiles.map((p) => {
          const active = p.id === group;
          return (
            <View
              key={p.id}
              className={`${styles.groupTag} ${active ? styles.groupTagActive : ''}`}
              onClick={() => setGroup(p.id)}
            >
              <Text className={styles.groupTagText}>{p.title}</Text>
            </View>
          );
        })}
      </ScrollView>

      <View className={styles.tipCard}>
        <Text className={styles.tipTitle}>{profile.title} · 饮食提醒</Text>
        <Text className={styles.tipDesc}>{profile.description}</Text>
        <View className={styles.tipList}>
          {profile.avoidTips.map((tip) => (
            <View key={tip} className={styles.tipItem}>
              <Text className={styles.tipDot}>·</Text>
              <Text className={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.resultSection}>
        <SectionHeader title={`推荐 ${result.length} 道`} />
        {result.length === 0 ? (
          <View className={styles.empty}>
            <Text className={styles.emptyText}>暂无该人群的推荐菜,先看看其他人群吧</Text>
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

export default Recommend;
