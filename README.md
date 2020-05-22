# @engineerd/setup-kind

Setup [KinD (Kubernetes in Docker)](https://kind.sigs.k8s.io/) with a single GitHub Action!

> This action assumes a Linux environment, and will _not_ work on Windows or MacOS agents.

```
name: "Create cluster using KinD"
on: [pull_request, push]

jobs:
  kind:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@master
    - uses: engineerd/setup-kind@v0.4.0
    - name: Testing
      run: |
        kubectl cluster-info
        kubectl get pods -n kube-system
        echo "current-context:" $(kubectl config current-context)
        echo "environment-kubeconfig:" ${KUBECONFIG}
```

> Note: KUBECONFIG is automatically merged after cluster creation starting with version 0.6 of Kind. See [this document for a detailed migration guide][kind-kubeconfig]

> Note: GitHub Actions workers come pre-configured with `kubectl`.

The following arguments can be configured on the job using the `with` keyword (see example above).
Currently, possible inputs are all the flags for `kind cluster create`, with the additional version, which sets the Kind version to downloadm and `skipClusterCreation`, which when present, skips creating the cluster (the Kind tools is configured in the path).

Optional inputs:

- `version`: version of Kind to use (default `"v0.7.0"`)
- `config`: path (relative to the root of the repository) to a kind config file. If omitted, a default 1-node cluster will be created
- `image`: node Docker image to use for booting the cluster.
- `name`: cluster context name (default `"kind-kind"`)
- `wait`: wait for control plane node to be ready (default `"300s"`)
- `skipClusterCreation`: if `"true"`, the action will not create a cluster, just acquire the tools

Example using optional inputs:

```
name: "Create cluster using KinD"
on: [pull_request, push]

jobs:
  kind:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@master
    - uses: engineerd/setup-kind@v0.4.0
      with:
          version: "v0.7.0"
    - name: Testing
      run: |
        kubectl cluster-info
        kubectl get pods -n kube-system
        echo "current-context:" $(kubectl config current-context)
        echo "environment-kubeconfig:" ${KUBECONFIG}
```

[kind-kubeconfig]: https://github.com/kubernetes-sigs/kind/issues/1060
