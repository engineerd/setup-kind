"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
require("mocha");
const chai_1 = require("chai");
const core = __importStar(require("@actions/core"));
const testEnvVars = {
    INPUT_MYINPUT: 'val',
};
describe("checking input parsing", function () {
    beforeEach(() => {
        for (const key in testEnvVars)
            process.env[key] = testEnvVars[key];
    });
    afterEach(() => {
        for (const key in testEnvVars)
            Reflect.deleteProperty(testEnvVars, key);
    });
    it("correctly parse input", () => {
        const myInput = core.getInput('myInput');
        chai_1.assert.equal(myInput, testEnvVars["INPUT_MYINPUT"]);
    });
});
