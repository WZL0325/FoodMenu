import React, { useState } from 'react';
import { View, Text } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { recipes } from '@/data/recipes';
import { getFavoriteRecipeIds } from '@/utils/favorites';
import RecipeCard from '@/components/RecipeCard';
import SectionHeader from '@/components/SectionHeader';
import styles from './index.module.scss';

const Favorites: React.FC = () => {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  // 每次进入页面刷新收藏(用户可能在详情页改了收藏)
  useDidShow(() => {
    setFavoriteIds(getFavoriteRecipeIds());
  });

  const list = recipes.filter((r) => favoriteIds.includes(r.id));

  const goHome = () => {
    Taro.switchTab({ url: '/pages/index/index' });
  };

  return (
    <View className={styles.page}>
      <SectionHeader title="我的收藏" subtitle={list.length > 0 ? `共 ${list.length} 道` : undefined} />
      {list.length === 0 ? (
        <View className={styles.empty}>
          <Text className={styles.emptyText}>还没有收藏的菜谱</Text>
          <View className={styles.emptyBtn} onClick={goHome}>
            <Text className={styles.emptyBtnText}>去选菜</Text>
          </View>
        </View>
      ) : (
        <View className={styles.list}>
          {list.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </View>
      )}
    </View>
  );
};

export default Favorites;
