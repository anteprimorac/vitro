import { runCommand, printGreen, printRed, fatal } from './support'
import path from 'path'
import { NEXT_APP_PATH, CMD, CONFIG_PATH, VERSION_FILE_PATH } from './constants'
import { CommandModule } from 'yargs'
import { initHandler } from './init'
import { existsSync } from 'fs-extra'
import { VitroConfig } from '@vitro/plugin'
const { version: cliVersion } = require('../package.json')

const command: CommandModule = {
    command: ['dev', '*'],
    describe: 'Starts vitro dev server',
    builder: (argv) => {
        argv.option('port', {
            alias: 'p',
            type: 'string',
            default: '7007',
            required: false,
            description: 'The port for the dev server',
        })
        return argv
    },
    handler: async (argv) => {
        try {
            // if no vitro config is present, ask to run init first
            if (!existsSync(CONFIG_PATH)) {
                fatal(
                    `There is no ./${CONFIG_PATH} file, you probably need to run '${CMD} init' first or change cwd`,
                )
            }
            const vitroConfig = getVitroConfig()
            const packageManager = vitroConfig.packageManager || 'npm'
            // if no vitro app is present, run init
            if (!existsSync(NEXT_APP_PATH)) {
                printGreen(
                    `no ./${NEXT_APP_PATH} found, running init command first`,
                    true,
                )
                // this way you can run vitro even if .vitro is inside .gitignore
                await initHandler({
                    packageManager
                })
            }
            // if vitro version is different, run init
            const vitroAppVersion = getVitroAppVersion()
            if (cliVersion !== vitroAppVersion) {
                printGreen(
                    `vitro app version ('${vitroAppVersion}') is different than the cli version ('${cliVersion}'), running init`,
                    true,
                )
                // this way you can run vitro even if .vitro is inside .gitignore
                await initHandler({
                    packageManager,
                })
            }
            // if no node_modules folder is present inside the app, rerun init
            if (
                packageManager == 'npm' && // TODO remove node_modules check after npm has workspaces
                !existsSync(
                    path.resolve(NEXT_APP_PATH, 'node_modules', 'react'),
                )
            ) {
                printGreen(
                    `${NEXT_APP_PATH}/node_modules is empty, rerunning init`,
                    true,
                )
                await initHandler({
                    packageManager,
                })
            }

            console.log('starting the server')
            await start({
                port: argv.port,
                verbose: Boolean(argv.verbose),
                packageManager,
            })
        } catch (e) {
            printRed(`could not start the dev server, ${e}`, true)
            fatal(`try rerunning the 'vitro init' command`)
        }
    },
} // as CommandModule

function getVitroAppVersion() {
    try {
        return require(path.resolve(NEXT_APP_PATH, VERSION_FILE_PATH))
    } catch {
        fatal(`cannot find vitro app version file`)
    }
}

function getVitroConfig(): VitroConfig {
    try {
        return require(path.resolve(CONFIG_PATH))
    } catch {
        fatal(`cannot require vitro config`)
    }
}

export default command

async function start({ port, verbose, packageManager }) {
    const command =
        packageManager === 'npm'
            ? `npm run dev -- -p ${port}`
            : `yarn next dev -p ${port}`
    return await runCommand({
        command,
        env: {
            ...process.env,
            ...(verbose
                ? {
                      VERBOSE: 'true',
                  }
                : {}),
        },
        cwd: path.resolve('.', NEXT_APP_PATH),
    }).catch((e) => {
        throw new Error(`could not start ${CMD}`)
    })
}
