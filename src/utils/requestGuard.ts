export interface RequestTicket {
  isCurrent: () => boolean
}

/**
 * 让“发起请求 → 响应回填”只在仍是最新一次请求时生效，
 * 避免改了食材后，旧的在线查询结果覆盖新状态。
 */
export const createRequestGuard = () => {
  let sequence = 0

  return {
    begin(): RequestTicket {
      const ticket = ++sequence
      return { isCurrent: () => sequence === ticket }
    },
    invalidate: () => { sequence++ },
  }
}
