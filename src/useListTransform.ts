import { useReducer, useCallback, useEffect, useRef, Reducer } from 'react';
import usePrevious from './usePrevious';

export type TransformerParams<TListItem, TTransformData> = {
  list: TListItem[];
  data: TTransformData;
  previousData: TTransformData;
};

type MapTransformerReturnType<TListItem> = (
  item: TListItem,
  index?: number
) => boolean;

export type Transformer<TListItem, TTransformData> = (
  params: TransformerParams<TListItem, TTransformData>
) => Promise<TListItem[]> | TListItem[];

export type MapTransformer<TListItem, TTransformData> = (
  params: TransformerParams<TListItem, TTransformData>
) => MapTransformerReturnType<TListItem>;

export type AllTransformers<TListItem, TTransformData> =
  | Transformer<TListItem, TTransformData>
  | MapTransformer<TListItem, TTransformData>;

interface UseTransformOptions<TListItem, TTransformData extends object> {
  list: TListItem[];
  transformData?: TTransformData;
  transform?:
    | AllTransformers<TListItem, TTransformData>
    | AllTransformers<TListItem, TTransformData>[];
  throwOnError?: boolean;
  onLoading?: (isLoading: boolean) => void;
  onError?: (error: Error) => void;
  onListUpdate?: (list: TListItem[]) => void;
}

const SET_LIST = 'SET_LIST';
const SET_DATA = 'SET_DATA';
const UPDATE_DATA = 'UPDATE_DATA';
const RESET_DATA = 'RESET_DATA';
const SET_LOADING = 'SET_LOADING';
const SET_ERROR = 'SET_ERROR';

interface TransformState<TTransformData extends object, TListItem> {
  data?: TTransformData;
  list: TListItem[];
  loading: boolean;
  error?: Error;
}

type Action<TTransformData, TListItem> =
  | { type: typeof SET_LIST; payload: TListItem[] }
  | { type: typeof SET_DATA; payload: TTransformData }
  | { type: typeof UPDATE_DATA; payload: Partial<TTransformData> }
  | { type: typeof RESET_DATA; payload: TTransformData | undefined }
  | { type: typeof SET_LOADING; payload: boolean }
  | { type: typeof SET_ERROR; payload: Error };

const transformReducer = <TTransformData extends object, TListItem>(
  state: TransformState<TTransformData, TListItem>,
  action: Action<TTransformData, TListItem>
) => {
  switch (action.type) {
    case SET_LIST: {
      return {
        ...state,
        list: action.payload,
        loading: false,
      };
    }
    case SET_DATA: {
      return {
        ...state,
        data: action.payload,
      };
    }
    case UPDATE_DATA: {
      return {
        ...state,
        data: {
          ...state.data,
          ...action.payload,
        },
      };
    }
    case RESET_DATA: {
      return {
        ...state,
        data: action.payload,
      };
    }
    case SET_LOADING: {
      return {
        ...state,
        loading: action.payload,
        error: undefined,
      };
    }
    case SET_ERROR: {
      return {
        ...state,
        error: action.payload,
        list: null,
        loading: false,
      };
    }
    default:
      return state;
  }
};

function noop() {
  return undefined;
}

function toArray<T>(value: T): any[] {
  if (Array.isArray(value)) {
    return value;
  }
  return [value];
}

function useListTransform<TTransformData extends object, TListItem>(
  options: UseTransformOptions<TListItem, TTransformData>
) {
  type TReducer = Reducer<
    TransformState<TTransformData, TListItem>,
    Action<TTransformData, TListItem>
  >;

  const [state, dispatch] = useReducer<TReducer>(transformReducer, {
    data: options.transformData,
    list: options.list,
    loading: false,
    error: undefined,
  });

  const onLoading = options.onLoading ?? noop;
  const onError = options.onError ?? noop;
  const onListUpdate = options.onListUpdate ?? noop;

  /**
   * The transform list id to denote the current
   * transformation.
   *
   * This is necessary for promise-based
   * transformations as we only want to apply the latest
   * transformations and ignore any past ones that were resolved
   * before the latest one.
   */
  const transformListId = useRef(0);

  const transforms = useRef<AllTransformers<TListItem, TTransformData>[]>(
    toArray(options.transform)
  );

  const isLatestTransform = useCallback(
    (listId: number) => {
      return transformListId.current === listId;
    },
    [transformListId]
  );

  const setTransform = useCallback(
    (data: TTransformData) => {
      dispatch({ type: SET_DATA, payload: data });
    },
    [dispatch]
  );

  const updateTransform = useCallback((data: Partial<TTransformData>) => {
    dispatch({ type: UPDATE_DATA, payload: data });
  }, []);

  const resetTransform = useCallback(
    () => dispatch({ type: RESET_DATA, payload: options.transformData }),
    [options.transformData]
  );

  const setList = useCallback(
    (payload: TListItem[], transId: number) => {
      if (!isLatestTransform(transId)) {
        return undefined;
      }

      onLoading(false);
      onListUpdate(payload);
      dispatch({ type: SET_LIST, payload });
    },
    [onLoading, onListUpdate, isLatestTransform]
  );

  const setLoading = useCallback(
    (payload: boolean) => {
      onLoading(payload);
      dispatch({ type: SET_LOADING, payload });
    },
    [onLoading]
  );

  const setError = useCallback(
    (payload: Error, transId: number) => {
      onError(payload);
      if (!isLatestTransform(transId)) {
        return undefined;
      }
      dispatch({ type: SET_ERROR, payload });
    },
    [onError, isLatestTransform]
  );

  const prevTransformData = usePrevious(state.data);

  const transformList = useCallback(async (): Promise<void> => {
    const currentTransformId = ++transformListId.current;

    setLoading(true);

    if (state.data == null) {
      setList(options.list, currentTransformId);
      return undefined;
    }

    let transformedList = [...options.list];

    for (const transform of transforms.current) {
      if (!isLatestTransform(currentTransformId)) {
        return undefined;
      }

      try {
        const result = transform({
          list: transformedList,
          data: state.data,
          previousData: prevTransformData,
        });

        if (result instanceof Promise) {
          const promiseResult = await result;
          transformedList = promiseResult;
        } else if (typeof result === 'function') {
          transformedList = transformedList.filter(result);
        } else {
          transformedList = result;
        }
      } catch (ex) {
        setError(ex, currentTransformId);
        return undefined;
      }
    }

    setList(transformedList, currentTransformId);
  }, [
    state.data,
    prevTransformData,
    options.list,
    setList,
    setLoading,
    setError,
    isLatestTransform,
  ]);

  useEffect(() => {
    transforms.current = toArray(options.transform);
  });

  useEffect(() => {
    transformList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.data, options.list]);

  if (options.throwOnError === true && state.error != null) {
    throw state.error;
  }

  return {
    transformed: state.list,
    transformData: state.data,
    setData: setTransform,
    updateData: updateTransform,
    resetData: resetTransform,
    loading: state.loading,
    error: state.error,
  };
}

export { useListTransform };
