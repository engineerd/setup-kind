export interface ConfigPatch {
  plugins: { [key: string]: PluginConfig };
}

export interface PluginConfig {
  registry: Registry;
}

export interface Registry {
  mirrors: { [key: string]: Mirror };
}

export interface Mirror {
  endpoint: string[];
}
