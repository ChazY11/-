import Taro from '@tarojs/taro';

const CLOUD_ENV_KEY = 'clocktower_cloud_env';

declare const wx: any;

export interface CloudbaseInitResult {
  enabled: boolean;
  provider: 'cloudbase' | 'mock';
  envId?: string;
}

export function getCloudEnvId() {
  try {
    return Taro.getStorageSync(CLOUD_ENV_KEY) || '';
  } catch {
    return '';
  }
}

export function setCloudEnvId(envId: string) {
  try {
    Taro.setStorageSync(CLOUD_ENV_KEY, envId);
  } catch {
    // ignore local persistence failure
  }
}

export function initCloudbase(envId?: string): CloudbaseInitResult {
  const resolvedEnvId = envId || getCloudEnvId();
  if (resolvedEnvId && typeof wx !== 'undefined' && wx?.cloud?.init) {
    wx.cloud.init({
      env: resolvedEnvId,
      traceUser: true,
    });
    return {
      enabled: true,
      provider: 'cloudbase',
      envId: resolvedEnvId,
    };
  }

  return {
    enabled: false,
    provider: 'mock',
  };
}
