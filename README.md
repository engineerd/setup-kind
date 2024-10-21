# @engineerd/setup-kind

Setup [KinD (Kubernetes in Docker)](https://kind.sigs.k8s.io/) with a single
GitHub Action!

> This action assumes a Linux environment (amd64 or arm64 architecture), and will _not_ work on Windows or
> MacOS agents.

```yaml
name: "Create cluster using KinD"
on: [pull_request, push]

jobs:
  kind:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@master
      - uses: engineerd/setup-kind@v0.6.0
        with:
          version: "v0.24.0"
      - name: Testing
        run: |
          kubectl cluster-info
          kubectl version
          kubectl get pods -n kube-system
```

This will configure KinD and start a cluster in your local GitHub Action:

```
downloading kind from https://github.com/kubernetes-sigs/kind/releases/download/v0.24.0/kind-linux-amd64
/opt/hostedtoolcache/kind/0.24.0/x64/kind create cluster --name kind --wait 300s
Creating cluster "kind" ...
 ✓ Ensuring node image (kindest/node:v1.31.0) 🖼
 ✓ Preparing nodes 📦 
 ✓ Writing configuration 📜
 ✓ Starting control-plane 🕹️
 • Installing CNI 🔌  ...
 ✓ Installing StorageClass 💾
 • Ready after 17s 💚
```

> Note: GitHub Actions workers come pre-configured with `kubectl`.

The following arguments can be configured on the job using the `with` keyword
(see example above). Currently, possible inputs are all the flags for
`kind cluster create`, with the additional version, which sets the Kind version
to download and `skipClusterCreation`, which when present, skips creating the
cluster (the KinD tool is configured in the path).

Optional inputs:

- `version`: version of Kind to use (default `"v0.24.0"`)
- `config`: path (relative to the root of the repository) to a kind config file.
  If omitted, a default 1-node cluster will be created
- `image`: node Docker image to use for booting the cluster.
- `name`: cluster name (default `"kind"`)
- `wait`: wait for control plane node to be ready (default `"300s"`)
- `kubeconfig`: sets kubeconfig path instead of $KUBECONFIG or $HOME/.kube/config
- `skipClusterCreation`: if `"true"`, the action will not create a cluster, just
  acquire the tools
- `skipClusterDeletion`: if `"true"`, the action will not delete the cluster
- `skipClusterLogsExport`: if `"true"`, the action will not export the cluster logs
- `verbosity`: numeric log verbosity, (info = 0, debug = 3, trace = 2147483647) (default `"0"`)
- `quiet`: silence all stderr output (default `"false"`)


[kind-kubeconfig]: https://github.com/kubernetes-sigs/kind/issues/1060
[gh-actions-path]:
  https://github.blog/changelog/2020-10-01-github-actions-deprecating-set-env-and-add-path-commands/
[path-issue]: https://github.com/engineerd/setup-kind/issues/28
