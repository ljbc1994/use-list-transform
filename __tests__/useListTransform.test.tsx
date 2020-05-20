/* eslint-disable @typescript-eslint/no-unused-vars */
import * as React from 'react'
import { act, render, fireEvent } from '@testing-library/react'
import { useListTransform, Transformer } from '../src/useListTransform'
import {
  makeAsyncTransform,
  bySearchTerm,
  byAge,
  addColor,
} from './transformers'
import { timeout } from './utils'
import { cleanup } from '@testing-library/react-hooks'
import { TestData, TestTransformData } from './types'
import TestErrorBoundary from './TestErrorBoundary'

afterEach(() => {
  cleanup()
})

test('should transform the list using transformers', async () => {
  const testList = [
    { name: 'bob', age: 12 },
    { name: 'jess', age: 42 },
  ]

  const transform = [bySearchTerm, byAge]

  const listUpdateFnMock = jest.fn()

  function Page() {
    const { transformed, setData } = useListTransform({
      list: testList,
      transform,
      onListUpdate: listUpdateFnMock,
    })

    return (
      <ul onClick={() => setData({ searchTerm: 'bob', age: 12 })}>
        {transformed.map((item, i) => (
          <li key={i}>{item.name}</li>
        ))}
      </ul>
    )
  }

  const { container } = render(<Page />)

  act(() => {
    fireEvent.click(container.firstElementChild)
  })

  expect(container.childNodes).toHaveLength(1)
  expect(container.firstChild.textContent).toMatchInlineSnapshot(`"bob"`)
  expect(listUpdateFnMock.mock.calls[1][0]).toMatchObject([testList[0]])
})

test('should mutate the list using a transform', async () => {
  const testList = [
    { name: 'bob', age: 12 },
    { name: 'jess', age: 32 },
  ]

  const transform = [addColor]

  function Page() {
    const { transformed, setData } = useListTransform<
      TestTransformData,
      TestData
    >({
      list: testList,
      transform,
    })

    return (
      <ul onClick={() => setData({ color: 'red' })}>
        {transformed.map((item, i) => (
          <li key={i}>{item.color}</li>
        ))}
      </ul>
    )
  }

  const { container } = render(<Page />)

  act(() => {
    fireEvent.click(container.firstElementChild)
  })

  expect(container.firstChild.childNodes).toHaveLength(2)
  expect(container.firstChild.firstChild.textContent).toMatchInlineSnapshot(
    `"red"`
  )
})

test('should update the list with new transform data', () => {
  const testList = [
    { name: 'bob', age: 12 },
    { name: 'jess', age: 12 },
  ]

  const transform = [bySearchTerm, byAge]

  function Page() {
    const { transformed, updateData } = useListTransform({
      list: testList,
      transform,
      transformData: {
        searchTerm: 'bob',
        age: 12,
      },
    })

    return (
      <ul onClick={() => updateData({ searchTerm: testList[1].name })}>
        {transformed.map((item, i) => (
          <li key={i}>{item.name}</li>
        ))}
      </ul>
    )
  }

  const {
    container: { firstElementChild },
  } = render(<Page />)

  const getList = () => firstElementChild

  expect(getList().childNodes).toHaveLength(1)
  expect(getList().firstChild.textContent).toMatchInlineSnapshot(`"bob"`)

  act(() => {
    fireEvent.click(getList())
  })

  expect(getList().childNodes).toHaveLength(1)
  expect(getList().firstChild.textContent).toMatchInlineSnapshot(`"jess"`)
})

test('should reset the list to initial transform data', () => {
  const testList = [
    { name: 'bob', age: 12 },
    { name: 'jess', age: 42 },
  ]

  const transform = [bySearchTerm]

  function Page() {
    const { transformed, setData, resetData } = useListTransform({
      list: testList,
      transform,
    })

    return (
      <div>
        <ul onClick={() => setData({ searchTerm: testList[0].name })}>
          {transformed.map((item, i) => (
            <li key={i}>{item.name}</li>
          ))}
        </ul>
        <button onClick={() => resetData()}>Reset</button>
      </div>
    )
  }

  const {
    container: { firstElementChild },
  } = render(<Page />)

  const getList = () => firstElementChild.firstElementChild
  const getResetButton = () => firstElementChild.lastElementChild

  act(() => {
    fireEvent.click(getList())
  })

  expect(getList().childNodes).toHaveLength(1)

  act(() => {
    fireEvent.click(getResetButton())
  })

  expect(getList().childNodes).toHaveLength(2)
})

test('should transform the list from dynamic transforms', () => {
  const testList = [
    { name: 'bob', age: 12 },
    { name: 'jess', age: 42 },
  ]

  function Page() {
    const [toggle, setToggle] = React.useState(false)

    const { transformed, updateData } = useListTransform({
      list: testList,
      transform: toggle ? byAge : bySearchTerm,
      transformData: {
        searchTerm: 'bob',
      },
    })

    function onToggle() {
      setToggle(true)
      updateData({ age: 42 })
    }

    return (
      <ul onClick={onToggle}>
        {transformed.map((item, i) => (
          <li key={i}>{item.name}</li>
        ))}
      </ul>
    )
  }

  const { container } = render(<Page />)

  expect(container.firstChild.textContent).toMatchInlineSnapshot(`"bob"`)

  act(() => {
    fireEvent.click(container.firstElementChild)
  })

  expect(container.firstChild.textContent).toMatchInlineSnapshot(`"jess"`)
})

test('should set the transform data by options', () => {
  const testList = [
    { name: 'bob', age: 12 },
    { name: 'jess', age: 42 },
  ]

  const testInitialData = {
    searchTerm: testList[1].name,
  }

  const transform = [bySearchTerm]

  function Page() {
    const { transformed } = useListTransform({
      list: testList,
      transform,
      transformData: testInitialData,
    })

    return (
      <ul>
        {transformed.map((item, i) => (
          <li key={i}>{item.name}</li>
        ))}
      </ul>
    )
  }

  const { container } = render(<Page />)

  act(() => {
    fireEvent.click(container.firstElementChild)
  })

  expect(container.childNodes).toHaveLength(1)
  expect(container.firstChild.textContent).toMatchInlineSnapshot(`"jess"`)
})

test('should transform the list using an async transformer', async () => {
  const testList = [
    { name: 'bob', age: 12 },
    { name: 'jess', age: 42 },
  ]

  const byAsync = makeAsyncTransform(500, ({ list, data }) =>
    list.filter((x) => x.name == data.searchTerm)
  )

  const transform = [byAsync]

  const onLoadingMock = jest.fn()

  function Page() {
    const { transformed, setData, loading } = useListTransform({
      list: testList,
      transform,
      onLoading: onLoadingMock,
    })

    return (
      <div>
        <ul onClick={() => setData({ searchTerm: testList[0].name })}>
          {transformed.map((item, i) => (
            <li key={i}>{item.name}</li>
          ))}
        </ul>
        <p>{loading ? 'loading' : 'not loading'}</p>
      </div>
    )
  }

  const {
    container: { firstElementChild },
  } = render(<Page />)
  const getList = () => firstElementChild.firstElementChild
  const getFirstItem = () => getList().firstChild
  const getLoading = () => firstElementChild.lastElementChild

  act(() => {
    fireEvent.click(getList())
  })

  expect(getLoading().textContent).toMatchInlineSnapshot(`"loading"`)
  expect(onLoadingMock.mock.calls[0][0]).toBe(true)

  await act(() => timeout(750))

  expect(getList().childNodes.length).toBe(1)
  expect(getFirstItem().textContent).toMatchInlineSnapshot(`"bob"`)
  expect(getLoading().textContent).toMatchInlineSnapshot(`"not loading"`)
  expect(onLoadingMock.mock.calls[1][0]).toBe(false)
})

test('should transform the list using an async transformer and ignore previous transform result', async () => {
  const testList = [
    { name: 'bob', age: 12 },
    { name: 'jess', age: 42 },
  ]

  const byAsyncDuration = [1000, 750]

  const byAsync: Transformer<TestData, TestTransformData> = ({
    list,
    data,
  }) => {
    return new Promise((res) => {
      return setTimeout(() => {
        res(list.filter((item) => item.name === data.searchTerm))
      }, byAsyncDuration.pop())
    })
  }

  const transform = [byAsync, bySearchTerm]

  function Page() {
    const { transformed, setData } = useListTransform({
      list: testList,
      transform,
    })

    return (
      <div>
        <ul onClick={() => setData({ searchTerm: testList[0].name })}>
          {transformed.map((item, i) => (
            <li key={i}>{item.name}</li>
          ))}
        </ul>
        <button onClick={() => setData({ searchTerm: `${testList[0].name}@` })}>
          wrong
        </button>
      </div>
    )
  }

  const {
    container: { firstElementChild },
  } = render(<Page />)
  const getList = () => firstElementChild.firstElementChild
  const getWrongButton = () => firstElementChild.lastElementChild

  /**
   * > (A) click: async (x- short req)ms request
   * -> (B) click: async (y- long req)ms request
   * --> (A) resolves but ignored as not current request
   * ---> (B) resolves as latest request and list updates
   */
  act(() => {
    fireEvent.click(getList())
    fireEvent.click(getWrongButton())
  })

  await act(() => timeout(1500))

  expect(getList().childNodes).toHaveLength(0)
})

test('should return an error if the latest async transform has failed', async () => {
  const testList = [
    { name: 'bob', age: 12 },
    { name: 'jess', age: 42 },
  ]

  const byAsyncError: Transformer<TestData, TestTransformData> = () => {
    return new Promise((_, rej) => {
      return setTimeout(() => {
        rej(new Error('error'))
      }, 500)
    })
  }

  const transform = [byAsyncError]

  const onErrorMock = jest.fn()

  function Page() {
    const { transformed, error, setData } = useListTransform({
      list: testList,
      transform,
      onError: onErrorMock,
    })

    return (
      <div onClick={() => setData({ searchTerm: testList[0].name })}>
        <ul>
          {transformed?.map((item, index) => (
            <li key={index}>{item.name}</li>
          ))}
        </ul>
        <p>{error && error.message}</p>
      </div>
    )
  }

  const {
    container: { firstElementChild },
  } = render(<Page />)
  const getRoot = () => firstElementChild
  const getList = () => firstElementChild.firstElementChild
  const getError = () => firstElementChild.lastElementChild

  expect(getList().childNodes).toHaveLength(2)

  act(() => {
    fireEvent.click(getRoot())
  })

  await act(() => timeout(750))

  expect(getList().childNodes).toHaveLength(0)
  expect(getError().textContent).toMatchInlineSnapshot(`"error"`)
  expect(onErrorMock.mock.calls[0][0]).toMatchObject(new Error('error'))
})

test('should not return an error if the latest async transform is successful', async () => {
  const testList = [
    { name: 'bob', age: 12 },
    { name: 'jess', age: 42 },
  ]

  const byAsyncMaybeError: Transformer<TestData, TestTransformData> = ({
    list,
    data,
  }) => {
    return new Promise((res, rej) => {
      const isNull = data.searchTerm != null
      setTimeout(() => {
        if (isNull) {
          return rej(new Error('error'))
        }
        return res(list)
      }, 500)
    })
  }

  const transform = [byAsyncMaybeError]

  const onErrorMock = jest.fn()

  function Page() {
    const { transformed, error, setData } = useListTransform({
      list: testList,
      transform,
      onError: onErrorMock,
    })

    const called = React.useRef(true)

    function onSet() {
      setData({ searchTerm: called.current ? testList[0].name : null })
      called.current = false
    }

    return (
      <div onClick={() => onSet()}>
        <ul>
          {transformed?.map((item, index) => (
            <li key={index}>{item.name}</li>
          ))}
        </ul>
        <p>{error && error.message}</p>
      </div>
    )
  }

  const {
    container: { firstElementChild },
  } = render(<Page />)
  const getRoot = () => firstElementChild
  const getList = () => firstElementChild.firstElementChild
  const getError = () => firstElementChild.lastElementChild

  expect(getList().childNodes).toHaveLength(2)

  act(() => {
    fireEvent.click(getRoot())
  })

  await act(() => timeout(50))

  act(() => {
    fireEvent.click(getRoot())
  })

  expect(getError().textContent).toBe('')

  await act(() => timeout(750))

  expect(getList().childNodes).toHaveLength(2)
  expect(getError().textContent).toBe('')

  expect(onErrorMock.mock.calls[0][0]).toMatchObject(new Error('error'))
})

test('should throw an error if an error occurs in a transform', () => {
  const testList = [
    { name: 'bob', age: 12 },
    { name: 'jess', age: 42 },
  ]

  const byThrowError: Transformer<TestData, TestTransformData> = () => {
    throw new Error('error')
  }

  const transform = [byThrowError, byAge]

  const onErrorMock = jest.fn()
  const onErrorCaughtMock = jest.fn()

  function Page() {
    const { transformed, setData } = useListTransform({
      list: testList,
      transform,
      onError: onErrorMock,
      throwOnError: true,
    })

    return (
      <ul onClick={() => setData({ searchTerm: 'bob', age: 12 })}>
        {transformed?.map((item, i) => (
          <li key={i}>{item.name}</li>
        ))}
      </ul>
    )
  }

  const {
    container: { firstElementChild },
  } = render(
    <TestErrorBoundary onError={onErrorCaughtMock}>
      <Page />
    </TestErrorBoundary>
  )

  const getList = () => firstElementChild.firstElementChild

  act(() => {
    fireEvent.click(getList())
  })

  expect(onErrorCaughtMock.mock.calls[0][0]).toMatchObject(new Error('error'))
})
