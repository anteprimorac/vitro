import { VitroApp } from '@vitro/ui'
import experimentsTree from '@vitro-root/experimentsTree.json'

export default function App(props) {
    return <VitroApp {...props} experimentsTree={experimentsTree} />
}
