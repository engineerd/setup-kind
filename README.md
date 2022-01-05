# @engineerd/setup-kind

Setup [KinD (Kubernetes in Docker)](https://kind.sigs.k8s.io/) with a single
GitHub Action!

> Because of a [deprecation in the GitHub Actions environment][gh-actions-path],
> versions lower than v0.5.0 will no longer work properly. See [this
> issue][path-issue] for more details.

> This action assumes a Linux environment, and will _not_ work on Windows or
> MacOS agents.

```yaml
name: "Create cluster using KinD"
on: [pull_request, push]

jobs:
  kind:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@master
      - uses: engineerd/setup-kind@v0.5.0
      - name: Testing
        run: |
          kubectl cluster-info
          kubectl get pods -n kube-system
          echo "current-context:" $(kubectl config current-context)
          echo "environment-kubeconfig:" ${KUBECONFIG}
```

> Note: KUBECONFIG is automatically merged after cluster creation starting with
> version 0.6 of Kind. See [this document for a detailed migration
> guide][kind-kubeconfig]

> Note: GitHub Actions workers come pre-configured with `kubectl`.

The following arguments can be configured on the job using the `with` keyword
(see example above). Currently, possible inputs are all the flags for
`kind cluster create`, with the additional version, which sets the Kind version
to download and `skipClusterCreation`, which when present, skips creating the
cluster (the Kind tools is configured in the path).

Optional inputs:

- `version`: version of Kind to use (default `"v0.11.1"`)
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

Example using optional inputs:

```yaml
name: "Create cluster using KinD"
on: [pull_request, push]

jobs:
  kind:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@master
      - uses: engineerd/setup-kind@v0.5.0
        with:
          version: "v0.11.1"
      - name: Testing
        run: |
          kubectl cluster-info
          kubectl get pods -n kube-system
          echo "current-context:" $(kubectl config current-context)
          echo "environment-kubeconfig:" ${KUBECONFIG}
```

[kind-kubeconfig]: https://github.com/kubernetes-sigs/kind/issues/1060
[gh-actions-path]:
  https://github.blog/changelog/2020-10-01-github-actions-deprecating-set-env-and-add-path-commands/
[path-issue]: https://github.com/engineerd/setup-kind/issues/28
