import { MapTransformer, Transformer } from '../src/useListTransform'

import { ITestData, ITestTransformData } from './types'

const makeAsyncTransform = (
  ms: number,
  cbTransform: Transformer<ITestData, ITestTransformData>
): Transformer<ITestData, ITestTransformData> => {
  return (transformParams) => {
    return new Promise((res) => {
      setTimeout(() => {
        res(cbTransform(transformParams))
      }, ms)
    })
  }
}

const bySearchTerm: MapTransformer<ITestData, ITestTransformData> = ({
  data,
}) => {
  return (item) => item.name === data.searchTerm
}

const byAge: Transformer<ITestData, ITestTransformData> = ({ list, data }) => {
  return list.filter((item) => item.age === data.age)
}

const addColor: Transformer<ITestData, ITestTransformData> = ({
  list,
  data,
}) => {
  return list.map((item) => ({ ...item, color: data.color }))
}

export { makeAsyncTransform, bySearchTerm, byAge, addColor }
