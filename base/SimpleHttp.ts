import * as pako from 'pako';
import { TextCodec } from './TextCodec';

export class SimpleHttp {
    public static instance = new SimpleHttp();

    private constructor() { }

/**
     * 带有超时控制的 JSON POST 请求（不抛出异常）
     * @param url 请求地址
     * @param data 要发送的数据
     * @param headers 自定义请求头
     * @param timeout 超时时间(毫秒)，默认 5000ms
     * @returns 成功返回数据，失败返回 null
     */
    postDataWithTimeout<T = any>(
      url: string,
      data: object,
      headers: Record<string, string> = {},
      timeout: number = 5000
    ): Promise<T | null> {
      return new Promise((resolve) => {
          const xhr = new XMLHttpRequest();
          let isTimeout = false;

          // 设置超时
          const timeoutId = setTimeout(() => {
              isTimeout = true;
              xhr.abort();
              console.error('请求超时');
              resolve(null);
          }, timeout);

          xhr.open('POST', url, true);

          // 设置请求头
          xhr.setRequestHeader('Content-Type', 'application/json');
          for (const [key, value] of Object.entries(headers)) {
              xhr.setRequestHeader(key, value);
          }

          xhr.onload = () => {
              if (isTimeout) return;
              clearTimeout(timeoutId);

              if (xhr.status >= 200 && xhr.status < 300) {
                  try {
                      const response = JSON.parse(xhr.responseText) as T;
                      resolve(response);
                  } catch (e) {
                      console.error('解析响应数据失败:', e);
                      resolve(null);
                  }
              } else {
                  console.error(`HTTP error! status: ${xhr.status}`);
                  resolve(null);
              }
          };

          xhr.onerror = () => {
              if (isTimeout) return;
              clearTimeout(timeoutId);
              console.error('网络请求失败');
              resolve(null);
          };

          xhr.ontimeout = () => {
              clearTimeout(timeoutId);
              console.error('请求超时');
              resolve(null);
          };

          try {
              xhr.send(JSON.stringify(data));
          } catch (e) {
              clearTimeout(timeoutId);
              console.error('发送请求失败:', e);
              resolve(null);
          }
      });
    }
}