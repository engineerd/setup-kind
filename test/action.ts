import "mocha";
import { assert } from "chai";
import { KindConfig, getKindConfig } from '../src/kind';

const testEnvVars = {
    INPUT_VERSION: 'v0.5.3',
    INPUT_CONFIG: 'some-path',
    INPUT_IMAGE: 'some-docker-image',
    INPUT_NAME: 'some-name',
    INPUT_WAIT: '123s',
    INPUT_SKIPCLUSTERCREATION: 'false',
    GITHUB_WORKSPACE: '/home/runner/repo'
};

describe("checking input parsing", function () {
    beforeEach(() => {
        for (const key in testEnvVars)
            process.env[key] = testEnvVars[key as keyof typeof testEnvVars]
    });

    it("correctly parse input", () => {
        let cfg: KindConfig = getKindConfig();
        assert.equal(cfg.version, testEnvVars.INPUT_VERSION);
        assert.equal(cfg.configFile, testEnvVars.INPUT_CONFIG);
        assert.equal(cfg.image, testEnvVars.INPUT_IMAGE);
        assert.equal(cfg.name, testEnvVars.INPUT_NAME);
        assert.equal(cfg.waitDuration, testEnvVars.INPUT_WAIT);
        assert.equal(cfg.skipClusterCreation, false);
    });

    it("correctly set skipClusterCreation", () => {
        process.env["INPUT_SKIPCLUSTERCREATION"] = "true";
        let cfg: KindConfig = getKindConfig();
        assert.equal(cfg.skipClusterCreation, true);
    });

    it("correctly generates the cluster create command", () => {
        let args: string[] = getKindConfig().getCommand();
        assert.deepEqual(args, ["create", "cluster", "--config", "/home/runner/repo/some-path", "--image", testEnvVars.INPUT_IMAGE, "--name", testEnvVars.INPUT_NAME, "--wait", testEnvVars.INPUT_WAIT]);
    });
});