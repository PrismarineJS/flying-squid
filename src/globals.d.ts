// make process.platform also accept browser
declare namespace NodeJS {
    interface Process {
        //@ts-ignore
        platform: string
        browser?: boolean
    }

}
interface NodeRequire {
    // webpack bundling
    context: (path: string, deep: boolean, filter: RegExp) => { keys: () => string[]; (id: string): any }
}

interface ObjectConstructor {
    keys<T extends object> (obj: T): Array<StringKeys<T>>
    entries<T extends object> (obj: T): Array<[StringKeys<T>, T[keyof T]]>
    // todo review https://stackoverflow.com/questions/57390305/trying-to-get-fromentries-type-right
    fromEntries<T extends Array<[string, any]>> (obj: T): Record<T[number][0], T[number][1]>
    assign<T extends Record<string, any>, K extends Record<string, any>> (target: T, source: K): asserts target is T & K
}
