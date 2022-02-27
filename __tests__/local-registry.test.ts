import { hasRegistryConfig } from '../src/local-registry';

describe('checking registry validation', function () {
  it('disable_tcp_service configuration', () => {
    const configPatch = `[plugins."io.containerd.grpc.v1.cri"]
      disable_tcp_service = true`;
    expect(hasRegistryConfig(configPatch)).toBeFalsy();
  });
  it('empty configuration', () => {
    const configPatch = ``;
    expect(hasRegistryConfig(configPatch)).toBeFalsy();
  });
  it('wrong port', () => {
    const configPatch = `[plugins."io.containerd.grpc.v1.cri".registry.mirrors."localhost:5001"]
    endpoint = ["http://kind-registry:5000"]`;
    expect(hasRegistryConfig(configPatch)).toBeFalsy();
  });
  it('correctly configured', () => {
    const configPatch = `[plugins."io.containerd.grpc.v1.cri".registry.mirrors."localhost:5000"]
    endpoint = ["http://kind-registry:5000"]`;
    expect(hasRegistryConfig(configPatch)).toBeTruthy();
  });
});
