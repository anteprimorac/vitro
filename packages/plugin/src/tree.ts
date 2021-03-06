import { startCase } from 'lodash'

export function makeExperimentsTree(files: string[]) {
    const filesParts = files.map((f) => f.split('/')).filter(Boolean)
    const children = arrangeIntoTree(filesParts)
    return removeSingleChildFolders({
        children,
    })
}

export function arrangeIntoTree(paths: string[][]) {
    // Adapted from http://brandonclapp.com/arranging-an-array-of-flat-paths-into-a-json-tree-like-structure/
    var tree = []

    for (var i = 0; i < paths.length; i++) {
        var path = paths[i]
        var currentLevel = tree
        for (var j = 0; j < path.length; j++) {
            var part = path[j]

            var existingPath = findWhere(currentLevel, 'name', part)

            if (existingPath) {
                currentLevel = existingPath.children
            } else {
                const reconstructedPath = path.slice(0, j + 1).join('/')
                // remove url for non leafs
                const isDir = path[j + 1]
                const url = isDir ? '' : pathToURL(reconstructedPath)
                var newPart = {
                    name: part,
                    url,
                    path: reconstructedPath,
                    title: formatPathToTitle(part),
                    children: [],
                }

                currentLevel.push(newPart)
                currentLevel = newPart.children
            }
        }
    }

    return tree

    function findWhere(array, key, value) {
        // Adapted from https://stackoverflow.com/questions/32932994/findwhere-from-underscorejs-to-jquery
        let t = 0 // t is used as a counter
        while (t < array.length && array[t][key] !== value) {
            t++
        } // find the index where the id is the as the aValue

        if (t < array.length) {
            return array[t]
        } else {
            return false
        }
    }
}

function formatPathToTitle(path: string) {
    const endPath = path
        .split('/')
        .map((x) => x.trim())
        .filter(Boolean)
        .reverse()[0]
    const withoutExt = endPath.split('.')[0]
    return startCase(withoutExt)
}

function pathToURL(path: string) {
    // console.log(path)
    path = path.replace(/\.\w+$/, '').replace(/\bindex$/, '')

    return '/experiments/' + (path || '')
}

const DUMMY_NAMES = ['index', 'experiment', 'story']

export function removeSingleChildFolders(tree) {
    tree = tree || {}
    if (!tree?.children || !tree?.children?.length) {
        return tree
    }
    if (tree?.children?.length === 1) {
        if (tree?.children[0].children?.length) {
            return removeSingleChildFolders({
                ...tree,
                children: tree.children[0]?.children || [],
            })
        } else if (
            DUMMY_NAMES.includes(tree.children[0]?.title?.toLowerCase?.())
        ) {
            // leaf with a dummy name
            return removeSingleChildFolders({
                ...tree,
                url: tree.url || tree.children[0]?.url,
                children: [],
            })
        }
    }
    const children = tree.children.map((x) => {
        return removeSingleChildFolders(x)
    })
    return { ...tree, children }
}
