export function duplicate<T> (arr: Array<T>, amount: number) {
    let newArray: Array<T> = []

    for (let i = 0; i < amount; i++) {
        newArray = newArray.concat(arr)
    }

    return newArray
}
