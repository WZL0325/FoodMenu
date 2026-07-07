import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actionText?: string;
  onActionClick?: () => void;
}

/**
 * 通用区块标题组件，用于统一首页、推荐页和收藏页的标题层级。
 */
const SectionHeader: React.FC<SectionHeaderProps> = ({ title, subtitle, actionText, onActionClick }) => {
  return (
    <View className={styles.sectionHeader}>
      <View className={styles.titleGroup}>
        <Text className={styles.title}>{title}</Text>
        {subtitle ? <Text className={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {actionText ? (
        <Text className={styles.action} onClick={onActionClick}>
          {actionText}
        </Text>
      ) : null}
    </View>
  );
};

export default SectionHeader;
