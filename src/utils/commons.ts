export const numberEnumToArray = (numberEmum: { [key: string]: string | number }) => {
  return Object.values(numberEmum).filter((value) => typeof value === 'number') as number[]
}
