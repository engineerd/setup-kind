import * as core from '@actions/core';
import * as tc from '@actions/tool-cache';
import * as exec from '@actions/exec';
import * as path from 'path';
import * as artifact from '@actions/artifact';
import * as glob from '@actions/glob';
import process from 'process';

const VersionInput: string = "version";
const ConfigInput: string = "config";
const ImageInput: string = "image";
const NameInput: string = "name";
const WaitInput: string = "wait";
const KubeConfigInput: string = "kubeconfig";
const SkipClusterCreationInput: string = "skipClusterCreation";
const SkipClusterDeletionInput: string = "skipClusterDeletion";
const SkipClusterLogsExportInput: string = "skipClusterLogsExport";
const toolName: string = "kind";

export class KindConfig {
    version: string
    configFile: string;
    image: string;
    name: string;
    waitDuration: string;
    kubeConfigFile: string;
    skipClusterCreation: boolean
    skipClusterDeletion: boolean
    skipClusterLogsExport: boolean
    constructor(version: string, configFile: string, image: string, name: string, waitDuration: string,
        kubeConfigFile: string, skipClusterCreation: string, skipClusterDeletion: string, skipClusterLogsExport: string) {
        this.version = version;
        this.configFile = configFile;
        this.image = image;
        this.name = name;
        this.waitDuration = waitDuration;
        this.kubeConfigFile = kubeConfigFile;
        this.skipClusterCreation = (skipClusterCreation == 'true');
        this.skipClusterDeletion = (skipClusterDeletion == 'true');
        this.skipClusterLogsExport = (skipClusterLogsExport == 'true');
    }

    // returns the arguments to pass to `kind create cluster`
    createCommand(): string[] {
        let args: string[] = ["create", "cluster"];
        if (this.configFile != "") {
            const wd: string = process.env[`GITHUB_WORKSPACE`] || "";
            const absPath: string = path.join(wd, this.configFile);
            args.push("--config", absPath);
        }
        if (this.image != "") {
            args.push("--image", this.image);
        }
        if (this.name != "") {
            args.push("--name", this.name);
        }
        if (this.waitDuration != "") {
            args.push("--wait", this.waitDuration);
        }
        if (this.kubeConfigFile != "") {
            args.push("--kubeconfig", this.kubeConfigFile);
        }
        return args;
    }

    // returns the arguments to pass to `kind delete cluster`
    deleteCommand(): string[] {
        let args: string[] = ["delete", "cluster"];
        if (this.name != "") {
            args.push("--name", this.name);
        }
        if (this.kubeConfigFile != "") {
            args.push("--kubeconfig", this.kubeConfigFile);
        }
        return args;
    }

    // returns the arguments to pass to `kind export logs`
    exportLogsCommand(): string[] {
        let args: string[] = ["export", "logs", this.kindLogsDir()];
        if (this.name != "") {
            args.push("--name", this.name);
        }
        return args;
    }

    kindLogsDir(): string {
        const wd: string = process.env[`HOME`] || "";
        let dir : string = "./.kind";
        if (this.name != "") {
            dir += `/${this.name}`;
        }
        dir += "/logs"
        return path.join(wd, dir);
    }

    async executeKindCommand(command: string[]) {
        console.log("Executing kind with args " + command.join(' ') );
        await exec.exec("kind", command);
    }

    async installKind(): Promise<string> {
        let toolPath: string = tc.find(toolName, this.version); 
        if (toolPath === "") {
            toolPath = await downloadKind(this.version);
        }
        return toolPath;
    }

    async uploadKindLogs() {
        const artifactClient = artifact.create(); 
        let artifactName = 'kind';
        if (this.name != "") {
            artifactName += `-${this.name}`;
        }
        artifactName += '-logs';
        const pattern = this.kindLogsDir() + '/**/*';
        const globber = await glob.create(pattern);
        const files = await globber.glob();
        const rootDirectory = this.kindLogsDir();
        const options = {
            continueOnError: true
        };
        await artifactClient.uploadArtifact(artifactName, files, rootDirectory, options);
    }

    async createCluster() {
        if (this.skipClusterCreation) {
            return;
        }
        await this.executeKindCommand(this.createCommand());
    }

    async deleteCluster() {
        if (this.skipClusterDeletion) {
            return;
        }
        await this.executeKindCommand(this.deleteCommand());
    }

    async exportClusterLogs() {
        if (this.skipClusterLogsExport) {
            return;
        }
        await this.executeKindCommand(this.exportLogsCommand());
        await this.uploadKindLogs();
    }
}

export function getKindConfig(): KindConfig {
    const v: string = core.getInput(VersionInput);
    const c: string = core.getInput(ConfigInput);
    const i: string = core.getInput(ImageInput);
    const n: string = core.getInput(NameInput);
    const w: string = core.getInput(WaitInput);
    const k: string = core.getInput(KubeConfigInput);
    const scc: string = core.getInput(SkipClusterCreationInput);
    const scd: string = core.getInput(SkipClusterDeletionInput);
    const scle: string = core.getInput(SkipClusterLogsExportInput);
    return new KindConfig(v, c, i, n, w, k, scc, scd, scle);
}

// this action should always be run from a Linux worker
export async function downloadKind(version: string): Promise<string> {
    let url: string = `https://github.com/kubernetes-sigs/kind/releases/download/${version}/kind-linux-amd64`;
    console.log("downloading kind from " + url);
    let downloadPath: string | null = null;
    downloadPath = await tc.downloadTool(url);
    await exec.exec("chmod", ["+x", downloadPath]);
    let toolPath: string = await tc.cacheFile(downloadPath, "kind", toolName, version);
    core.debug(`kind is cached under ${toolPath}`);
    return toolPath;
}
