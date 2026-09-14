import { afterEach, describe, expect, it } from 'vitest'
import {
  clearPendingPlanTarget,
  consumePendingPlanTarget,
  peekPendingPlanTarget,
  setPendingPlanTarget,
} from '@/utils/recommendHandoff'

describe('plan handoff', () => {
  afterEach(() => clearPendingPlanTarget())

  it('预览目标不会消费，详情页消费后只返回一次', () => {
    const target = { date: '2026-09-16', meal: 'breakfast' as const }
    setPendingPlanTarget(target)

    expect(peekPendingPlanTarget()).toEqual(target)
    expect(peekPendingPlanTarget()).toEqual(target)
    expect(consumePendingPlanTarget()).toEqual(target)
    expect(consumePendingPlanTarget()).toBeUndefined()
  })

  it('可以清除用户主动开始选菜时遗留的目标', () => {
    setPendingPlanTarget({ date: '2026-09-16', meal: 'dinner' })
    clearPendingPlanTarget()

    expect(peekPendingPlanTarget()).toBeUndefined()
  })
})
