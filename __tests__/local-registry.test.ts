import { ConfigPatch } from '../src/containerd';
import { hasRegistryConfig, parseConfigPatch } from '../src/local-registry';

describe('checking go env simulation', function () {
  it('correctly parse ConfigPatch', () => {
    const configPatch = `[plugins."io.containerd.grpc.v1.cri".registry.mirrors."localhost:5000"]
    endpoint = ["http://kind-registry:5000"]`;

    const json: ConfigPatch = parseConfigPatch(configPatch);

    expect(json).not.toBeNull();
    expect(json.plugins).not.toBeNull();
    expect(json.plugins['io.containerd.grpc.v1.cri']).not.toBeNull();
    expect(json.plugins['io.containerd.grpc.v1.cri'].registry).not.toBeNull();
    expect(json.plugins['io.containerd.grpc.v1.cri'].registry.mirrors).not.toBeNull();
    expect(
      json.plugins['io.containerd.grpc.v1.cri'].registry.mirrors['localhost:5000']
    ).not.toBeNull();
    expect(
      json.plugins['io.containerd.grpc.v1.cri'].registry.mirrors['localhost:5000'].endpoint
    ).not.toBeNull();
    expect(
      json.plugins['io.containerd.grpc.v1.cri'].registry.mirrors['localhost:5000'].endpoint
    ).toContain('http://kind-registry:5000');
  });
  it('misconfigured', () => {
    const configPatch = `[plugins."io.containerd.grpc.v1.cri".registry.mirrors."localhost:5001"]
    endpoint = ["http://kind-registry:5000"]`;
    expect(hasRegistryConfig(configPatch)).toBeFalsy();
  });
  it('right configured', () => {
    const configPatch = `[plugins."io.containerd.grpc.v1.cri".registry.mirrors."localhost:5000"]
    endpoint = ["http://kind-registry:5000"]`;
    expect(hasRegistryConfig(configPatch)).toBeTruthy();
  });
});
