import {
    Box,
    BoxProps,
    Heading,
    Link,
    Stack,
    Divider,
    useDisclosure,
    Collapse,
} from '@chakra-ui/core'
import orderBy from 'lodash/orderBy'
import React, { useEffect } from 'react'
import { ComponentLink } from './NavLink'
import { useStorageState } from 'react-storage-hooks'
import { findTreeInPath, ExperimentsTree } from '../support'

export type SidebarOrdering = { [k: string]: SidebarOrdering } | boolean

const FILES_EXTENSION_REGEX = /\.(tsx?|jsx?)/

export type SideNavProps = {
    tree?: ExperimentsTree
    contentHeight?: string
} & BoxProps

export const NavTree = ({ tree = { children: [] }, ...rest }: SideNavProps) => {
    const { sidebarOrdering = undefined, docsRootPath = 'pages' } = {}

    tree = applySidebarOrdering({ tree, order: sidebarOrdering })
    // console.log(tree)
    tree = findTreeInPath(tree, docsRootPath) || tree
    // console.log(tree)
    if (!tree) {
        console.error(new Error(`sidenav tree is null`))
        tree = { name: '', children: [] }
    }

    return (
        <Stack
            // borderRightWidth='1px'
            // minWidth='240px'
            // overflowY='hidden'
            as='nav'
            aria-label='Main navigation'
            // py='6'
            // px='4'
            // pr='6'
            {...rest}
        >
            <Box>
                {tree.children.map((
                    x, // i map on children to exclude the `pages` or `docsRootPage` first node
                ) => (
                    <NavTreeComponent
                        hideDivider
                        key={x.path || x.title}
                        {...x}
                    />
                ))}
            </Box>
        </Stack>
    )
}

function equalWithoutExtension(a, b) {
    return (
        a.replace(FILES_EXTENSION_REGEX, '') ===
        b.replace(FILES_EXTENSION_REGEX, '')
    )
}

export function applySidebarOrdering({
    order,
    tree,
}: {
    tree: ExperimentsTree
    order: SidebarOrdering
}): ExperimentsTree {
    // TODO order sidebar based on files metadata (last modified time)
    order = order || {}
    if (!tree.children) {
        return tree
    }
    // put the non listed entries last
    tree.children = orderBy(tree.children, (x) => {
        const index = Object.keys(order).findIndex((k) =>
            equalWithoutExtension(k, x.name),
        )
        if (index === -1) {
            return Infinity
        }
        return index
    })
    // put the folders last
    tree.children = orderBy(tree.children, (x, i) => {
        if (x?.children?.length) {
            return Infinity
        }
        return 0
    })
    // remove entries with `false` value
    tree.children = tree.children.filter((x) => {
        const found = Object.keys(order).find((k) =>
            equalWithoutExtension(k, x.name),
        )
        if (found && order[found] === false) {
            return false
        }
        return true
    })
    // recurse
    tree.children.forEach((node) => {
        applySidebarOrdering({
            tree: node,
            order:
                order[node.name] ||
                order[node.name.replace(FILES_EXTENSION_REGEX, '')],
        })
    })
    return tree
}

const NavTreeComponent = ({
    name = '',
    children,
    depth = 1,
    hideDivider = false,
    url = '',
    title = '',
    path,
    ...rest
}: ExperimentsTree & { depth?: number; hideDivider?: boolean }) => {
    const isFolder = !url
    const formattedTitle = title || name
    const subTree =
        children &&
        children.map((x) => {
            return (
                <NavTreeComponent
                    key={x.path || x.title}
                    {...x}
                    depth={depth + 1}
                />
            )
        })
    if (isFolder) {
        return (
            <CollapsableTreeNode
                path={path}
                depth={depth}
                title={formattedTitle}
                subTree={subTree}
            />
        )
    }
    return (
        <Stack spacing='0px'>
            <ComponentLink
                opacity={0.8}
                pl='0.4em'
                my='0.1em'
                href={url}
                isTruncated
            >
                {formattedTitle}
            </ComponentLink>
            {subTree}
        </Stack>
    )
}

function CollapsableTreeNode({ title, path, depth, subTree }) {
    const key = 'sidenav-state-' + path
    const [active, setActive] = useStorageState(
        typeof window === 'undefined' ? null : localStorage,
        key,
        '',
    )
    const { onToggle, isOpen } = useDisclosure(!!active)
    useEffect(() => {
        setActive(isOpen ? 'true' : null)
    }, [isOpen])
    return (
        <Stack spacing='0px'>
            <Box
                display='flex'
                alignItems='center'
                cursor='pointer'
                onClick={onToggle}
                py='0.2em'
                my='0.2em'
            >
                <Box
                    mr='0.4em'
                    size='0.6em'
                    opacity={0.6}
                    display='inline-block'
                    as={isOpen ? CollapseDown : CollapseRight}
                />
                {title}
            </Box>
            <Collapse isOpen={isOpen} pl='20px'>
                {subTree}
            </Collapse>
        </Stack>
    )
}

const CollapseRight = (props) => {
    return (
        <svg
            viewBox='0 0 5 8'
            fill='currentColor'
            xmlns='http://www.w3.org/2000/svg'
            {...props}
        >
            <path
                d='M0 0.724246C0 0.111374 0.681914 -0.223425 1.13107 0.168926L4.66916 3.25957C5.11028 3.6449 5.11028 4.3551 4.66916 4.74043L1.13107 7.83107C0.681913 8.22342 0 7.88863 0 7.27575V0.724246Z'
                fill='currentColor'
            ></path>
        </svg>
    )
}

const CollapseDown = (props) => {
    return (
        <svg
            viewBox='0 0 8 6'
            fill='currentColor'
            xmlns='http://www.w3.org/2000/svg'
            {...props}
        >
            <path
                d='M7.27575 0.5C7.88863 0.5 8.22342 1.18191 7.83107 1.63107L4.74043 5.16916C4.3551 5.61028 3.6449 5.61028 3.25957 5.16916L0.168926 1.63107C-0.223425 1.18191 0.111375 0.5 0.724247 0.5L7.27575 0.5Z'
                fill='currentColor'
            ></path>
        </svg>
    )
}
