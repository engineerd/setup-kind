# @engineerd/setup-kind

Setup [KinD (Kubernetes in Docker)](https://kind.sigs.k8s.io/) with a single GitHub Action!

> This action assumes a Linux environment, and will _not_ work on Windows or MacOS.

```
name: "Create cluster using KinD"
on: [pull_request, push]

jobs:
  kind:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@master
    - uses: engineerd/setup-kind@v0.3.0
        with:
            version: <kind-version>
            <other input>: <other-value>        
    - name: Testing
      run: |
        export KUBECONFIG="$(kind get kubeconfig-path)"
        kubectl cluster-info
        kubectl get pods -n kube-system
```

> Note: environment variables are not persisted, so the first step in your job should be `export KUBECONFIG="$(kind get kubeconfig-path)"`.
> Note: GitHub Actions workers come pre-configured with `kubectl` version 1.15.1.

The following arguments can be configured on the job using the `with` keyword (see example above).
Currently, possible inputs are all the flags for `kind cluster create`, with the additional version, which sets the Kind version to downloadm and `skipClusterCreation`, which when present, skips creating the cluster (the Kind tools is configured in the path).

```
inputs:
  version:
    description: "Version of Kind to use (default v0.5.1)"
    default: "v0.5.1"
  config:
    description: "Path (relative to the root of the repository) to a kind config file"
  image:
    description: "Node Docker image to use for booting the cluster"
  name:
    description: "Cluster context name (default kind)"
    default: "kind"
  wait:
    description: "Wait for control plane node to be ready (default 300s)"
    default: "300s"

  skipClusterCreation:
    description: "If true, the action will not create a cluster, just acquire the tools"
    default: false
```
