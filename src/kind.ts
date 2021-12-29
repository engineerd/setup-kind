import * as core from '@actions/core';
import * as tc from '@actions/tool-cache';
import * as exec from '@actions/exec';
import * as path from 'path';
import process from 'process';

const VersionInput: string = "version";
const ConfigInput: string = "config";
const ImageInput: string = "image";
const NameInput: string = "name";
const WaitInput: string = "wait";
const KubeConfigInput: string = "kubeconfig";
const SkipClusterCreationInput: string = "skipClusterCreation";

const toolName: string = "kind";

export class KindConfig {
    version: string
    configFile: string;
    image: string;
    name: string;
    waitDuration: string;
    kubeConfigFile: string;
    skipClusterCreation: boolean
    constructor(version: string, configFile: string, image: string, name: string, waitDuration: string, kubeConfigFile: string, skipClusterCreation: string) {
        this.version = version;
        this.configFile = configFile;
        this.image = image;
        this.name = name;
        this.waitDuration = waitDuration;
        this.kubeConfigFile = kubeConfigFile;
        this.skipClusterCreation = (skipClusterCreation == 'true');
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
    
    // Returns the arguments to pass to `kind delete cluster`
    deleteCommand(): string[] {
        let args: string[] = ["delete", "cluster"];
        if (this.name != "") {
            args.push("--name", this.name);
        }
        return args;
   }
    
    async executeKindCommand(command: string[]) {
        console.log("Executing kind with args " + command);
        await exec.exec("kind", command);
    }

    async createCluster() {
        if (this.skipClusterCreation)
            return;

        await this.executeKindCommand(this.createCommand());
    }
    
    async deleteCluster() {
        await this.executeKindCommand(this.deleteCommand());
    } 
}

export function getKindConfig(): KindConfig {
    const v: string = core.getInput(VersionInput);
    const c: string = core.getInput(ConfigInput);
    const i: string = core.getInput(ImageInput);
    const n: string = core.getInput(NameInput);
    const w: string = core.getInput(WaitInput);
    const k: string = core.getInput(KubeConfigInput);
    const s: string = core.getInput(SkipClusterCreationInput);

    return new KindConfig(v, c, i, n, w, k, s);
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

export async function getKind(version: string): Promise<string> {
  let toolPath: string = tc.find(toolName, version);

  if (toolPath === "") {
    toolPath = await downloadKind(version);
  }

  return toolPath;
}
