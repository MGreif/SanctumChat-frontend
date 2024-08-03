import { useMemo } from 'react'

const getBool = () => Math.random() > 0.5
const getWidth = () =>
  ['w-44', 'w-64', 'w-36', 'w-96'][Math.floor(Math.random() * 4)]

export const MessageSkeleton = () => {
  const data = useMemo(
    () =>
      Array(15)
        .fill(1)
        .map(() => [getBool(), getWidth()]),
    []
  )
  return (
    <div className="w-full h-full text-center">
      <div className="w-full grid mb-2">
        {data.map(([sender, width]) => (
          <span
            className={`justify-self-${sender ? 'start' : 'end'} px-3 text-white mb-2 p-2 rounded-2xl bg-indigo-100 ${width} h-7`}
          ></span>
        ))}
      </div>
    </div>
  )
}
