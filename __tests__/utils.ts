export const timeout = (ms: number) => {
  return new Promise((res) => {
    setTimeout(() => {
      res()
    }, ms)
  })
}
