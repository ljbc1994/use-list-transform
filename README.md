# 🤖 use-list-transform
A tiny, simple React hook that handles performing functions on an array. In other words, you provide the functions for sorting, filtering and manipulating the array and the hook will return the transformed array. Supports promise transforms.

- TypeScript support
- Promise-based transforms
- Tiny API
- Tiny size

## Install

```bash
npm install use-list-transform --save
```

## Usage

```tsx
import useListTransform from "use-list-transform";

const searchTerm = ({ list, data }) => list.filter((item) => item.name.includes(data.searchTerm)); 

const SearchList = ({ list }) => {
    const { transformed, setData } = useListTransform({ 
        list, 
        transform: [searchTerm] 
    });

    return (
        <div>
            <input type="text" onChange={(evt) => setData({ searchTerm: evt.target.value })}/>
            <ul>
                {transformed.map((item, index) => (
                    <li key={index}>{item.name}</li>
                ))}
            </ul>
        </div>
    );
}
```

## API

### Options

- `list`: An array of values to apply transforms on.
- `transformData`: The data given to the transform functions to apply transformations.
- `transform`: An array of transform functions or a single function to apply to the list. The function is given an object containing the `list`, `data` (the transform data) and the `previousData` (previous transform data). The function must return the transformed `list`.
- `throwOnError`: *(Default: false)* If set to true, all transform errors will be thrown and not handled by the hook.
- `onLoading` *`(loading: boolean) => void`*: Triggers prior to applying transformations and after it has completed.
- `onError` *`(error: Error) => void`*: Triggers when an error occurs. 
- `onListUpdate` *`(list: TListItem[]) => void`*: Triggers when the transformed list has been updated. 

### Return values

- `transformed`: The transformed array of values.
- `transformData`: The data given to the transform functions.
- `setData` *`(data: TTransformData) => void`*: Set the transform data.
- `updateData`: *`(data: Partial<TTransformData>) => void`*: Update the existing transform data.
- `resetData`: *`() => void`*: Reset the transform data to the original data passed by the options.
- `loading`: Whether transforms are being applied.
- `error`: Returns an error if an error has occurred during transform.

## Examples

### Multiple transforms

```jsx
import useListTransform from "use-list-transform";

const byAge = ({ data }) => (item) => item.age == data.age;
const byTags = ({ data }) => (item) => item.tags.some((t) => data.tags.include(t));

const SearchList = ({ searchList }) => {
    const tags = ["ricky", "steve", "karl"];

    const { transformed, updateData, transformData } = useListTransform({ 
        list: searchList, 
        transform: [byAge, byTags] 
    });

    function onToggleTag(tag) {
        const tagIndex = transformData.tags.findIndex((t) => t === tag);

        updateData({
            tags: tagIndex === -1 
                ? [...transformData.tags, tag]
                : transformData.tags.slice(tagIndex)
        })
    }

    return (
        <div>
            <div>
                <ul>
                    {tags.map((tag, index) => (
                        <li key={tag} onClick={() => onToggleTag(tag)}>
                            {tag}
                        </li>
                    ))}
                </ul>
            </div>
            <ul>
                {transformed.map((item, index) => <li>{item.name}</li>)}
            </ul>
        </div>
    );
}
```

### Promise-based transform requests (i.e. web workers)

```jsx
// `greenlet` - moves async functions into its own threads
import greenlet from "greenlet";
import useListTransform from "use-list-transform";

const byWebWorker = greenlet(async ({ list, data }) => {
    // expensive operation on another thread..
    return list;
});

const SearchList = ({ searchList }) => {
    const { transformed, setData, loading } = useListTransform({ 
        list: searchList, 
        transform: [byWebWorker] 
    });

    return (
        <div>
            {loading && <p>Transforming...</p>}
            <input type="text" onChange={(evt) => setData({ searchTerm: evt.target.value })}/>
            <ul>
                {transformed.map((item, index) => <li>{item.name}</li>)}
            </ul>
        </div>
    );
}
```

## Contributors

- @ljbc1994