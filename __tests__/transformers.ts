import { MapTransformer, Transformer } from '../src/useListTransform';

import { TestData, TestTransformData } from './types';

const makeAsyncTransform = (
  ms: number,
  cbTransform: Transformer<TestData, TestTransformData>
): Transformer<TestData, TestTransformData> => {
  return (transformParams) => {
    return new Promise((res) => {
      setTimeout(() => {
        res(cbTransform(transformParams));
      }, ms);
    });
  };
};

const bySearchTerm: MapTransformer<TestData, TestTransformData> = ({
  data,
}) => {
  return (item) => item.name === data.searchTerm;
};

const byAge: Transformer<TestData, TestTransformData> = ({ list, data }) => {
  return list.filter((item) => item.age === data.age);
};

const addColor: Transformer<TestData, TestTransformData> = ({ list, data }) => {
  return list.map((item) => ({ ...item, color: data.color }));
};

export { makeAsyncTransform, bySearchTerm, byAge, addColor };
