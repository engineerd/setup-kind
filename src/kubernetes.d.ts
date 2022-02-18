export interface Cluster {
  kind: string;
  apiVersion: string;
  name?: string;
  nodes?: Node[];
  kubeadmConfigPatches?: string[];
  containerdConfigPatches?: string[];
}

export interface ConfigMap {
  apiVersion: string;
  kind: string;
  metadata: Metadata;
  data: { [key: string]: string };
}

export interface Metadata {
  namespace: string;
  name: string;
}

export interface Node {
  role: string;
  image: string;
  kubeadmConfigPatches?: string[];
}
