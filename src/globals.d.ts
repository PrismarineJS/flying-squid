// make process.platform also accept browser
declare namespace NodeJS {
    interface Process {
        platform: string;
        browser?: boolean
    }

}
interface NodeRequire {
    // webpack bundling
    context: (path: string, deep: boolean, filter: RegExp) => { keys: () => string[]; (id: string): any };
}
