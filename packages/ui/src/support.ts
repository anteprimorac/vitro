import startCase from 'lodash/startCase'
import { useEffect, useState } from 'react'

export const version = require('../package.json').version

export const TOP_TITLE_H = '60px'

export function formatPathToTitle(path: string) {
    const endPath = path
        .split('/')
        .map((x) => x.trim())
        .filter(Boolean)
        .reverse()[0]
    const withoutExt = endPath.split('.')[0]
    return startCase(withoutExt)
}

export function usePromise(p) {
    const [v, set] = useState(!isPromise(p) ? p : {})
    useEffect(() => {
        if (isPromise(p)) {
            p.then(set)
        } else {
            set(p)
        }
    }, [p])
    return [v]
}

// export function usePolledPromise(fn, time = 1000) {
//     const [v, set] = useState(undefined)
//     useEffect(() => {
//         let id = setInterval(() => {
//             fn().then((x) => {
//                 if (x !== v) {
//                     set(x)
//                 }
//             })
//         }, time)
//         return () => {
//             clearInterval(id)
//         }
//     }, [])
//     return [v]
// }

function isPromise(p) {
    return p && typeof p.then === 'function'
}

/////////// tree utils ///////////////////

export interface ExperimentsTree {
    path?: string
    name?: string
    children?: ExperimentsTree[]
    url?: string
    title?: string
    // meta?: Record<string, any>
}

export function findTreeInPath(
    tree: ExperimentsTree,
    path,
): ExperimentsTree | null {
    // remove leading and trailing slashes
    path = path.replace(/^\/|\/$/g, '')
    if (!tree?.children?.length) {
        return null
    }
    if (tree.path === path) {
        return tree
    }
    for (let child of tree.children) {
        let found = findTreeInPath(child, path)
        if (found) {
            return found
        }
    }
}

export function findSubtreeInPathByUrl(
    tree: ExperimentsTree,
    url,
): {
    current?: ExperimentsTree
    previous?: ExperimentsTree
    next?: ExperimentsTree
} {
    if (!tree?.children?.length) {
        return null
    }
    for (let i = 0; i < tree.children.length; i++) {
        let child = tree.children[i]
        if (child.url === url) {
            return {
                previous: tree.children[i - 1],
                current: tree,
                next: tree.children[i + 1], // TODO if type is directory get the first node in folder
            }
        }
        let found = findSubtreeInPathByUrl(child, url)
        if (found) {
            return found
        }
    }
}
