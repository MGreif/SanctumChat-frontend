export type TUser = {
    name: string,
    age: string,
    password: string,
    username: string,
    public_key: string
}

export type TUserRaw = Omit<TUser, "public_key"> & {
    public_key: number[]
}
