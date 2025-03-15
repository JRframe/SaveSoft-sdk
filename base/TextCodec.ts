/**
 * 文本编码/解码工具类
 * 提供跨平台的 TextEncoder 和 TextDecoder 功能
 * 支持 Node.js 和浏览器环境
 */
export class TextCodec {
  /**
   * 支持的编码类型
   */
  static readonly supportedEncodings = [
    'utf-8',
    'utf-16le',
    'utf-16be',
    'ascii',
    'base64',
    'hex',
    'latin1'
  ] as const;

  /**
   * 编码类型
   */
  static readonly Encoding = {
    UTF8: 'utf-8',
    UTF16LE: 'utf-16le',
    UTF16BE: 'utf-16be',
    ASCII: 'ascii',
    BASE64: 'base64',
    HEX: 'hex',
    LATIN1: 'latin1'
  } as const;

  /**
   * 将字符串编码为 Uint8Array
   * @param text 要编码的字符串
   * @param encoding 编码格式 (默认为 'utf-8')
   * @returns 编码后的 Uint8Array
   */
  static encode(
    text: string,
    encoding: typeof TextCodec.supportedEncodings[number] = TextCodec.Encoding.UTF8
  ): Uint8Array {
    // Node.js 环境优先使用 Buffer
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(text, encoding);
    }

    // 浏览器环境使用 TextEncoder (仅支持 UTF-8)
    if (typeof TextEncoder !== 'undefined' && encoding === TextCodec.Encoding.UTF8) {
      return new TextEncoder().encode(text);
    }

    // 兜底方案 - 手动实现 UTF-8 编码
    if (encoding === TextCodec.Encoding.UTF8) {
      return TextCodec.utf8Encode(text);
    }

    throw new Error(`Encoding '${encoding}' is not supported in this environment`);
  }

  /**
   * 将 Uint8Array 或 Buffer 解码为字符串
   * @param data 要解码的数据
   * @param encoding 解码格式 (默认为 'utf-8')
   * @returns 解码后的字符串
   */
  static decode(
    data: Uint8Array | Buffer,
    encoding: typeof TextCodec.supportedEncodings[number] = TextCodec.Encoding.UTF8
  ): string {
    // Node.js 环境优先使用 Buffer
    if (typeof Buffer !== 'undefined' && Buffer.isBuffer(data)) {
      return data.toString();
    }

    // 处理 Uint8Array
    if (data instanceof Uint8Array) {
      // 浏览器环境使用 TextDecoder (支持 UTF-8, UTF-16)
      if (typeof TextDecoder !== 'undefined' && 
          (encoding === TextCodec.Encoding.UTF8 || 
           encoding === TextCodec.Encoding.UTF16LE || 
           encoding === TextCodec.Encoding.UTF16BE)) {
        return new TextDecoder(encoding).decode(data);
      }

      // 兜底方案 - 手动实现 UTF-8 解码
      if (encoding === TextCodec.Encoding.UTF8) {
        return TextCodec.utf8Decode(data);
      }

      // 在浏览器中尝试将 Uint8Array 转为 Buffer (如果 polyfill 可用)
      if (typeof Buffer !== 'undefined') {
        return Buffer.from(data).toString(encoding);
      }
    }

    throw new Error(`Decoding with '${encoding}' is not supported in this environment`);
  }

    /**
   * 将字符串编码到现有的 Uint8Array 中
   * @param text 要编码的字符串
   * @param destination 目标 Uint8Array
   * @param encoding 编码格式 (默认为 'utf-8')
   * @returns 包含写入字节数和读取字符数的对象 { written, read }
   */
    static encodeInto(
      text: string,
      destination: Uint8Array,
      encoding: typeof TextCodec.supportedEncodings[number] = TextCodec.Encoding.UTF8
    ): { read: number; written: number } {
      // 浏览器环境使用 TextEncoder.encodeInto (仅支持 UTF-8)
      if (typeof TextEncoder !== 'undefined' && encoding === TextCodec.Encoding.UTF8) {
        return (new TextEncoder()).encodeInto(text, destination);
      }
  
      // Node.js 或其他编码的兜底实现
      const encoded = TextCodec.encode(text, encoding);
      const bytesToCopy = Math.min(encoded.length, destination.length);
      destination.set(encoded.subarray(0, bytesToCopy));
      
      return {
        read: text.length,
        written: bytesToCopy
      };
    }

  /**
   * 手动实现 UTF-8 编码
   * @param text 要编码的字符串
   * @returns 编码后的 Uint8Array
   * @private
   */
  private static utf8Encode(text: string): Uint8Array {
    const bytes: number[] = [];
    for (let i = 0; i < text.length; i++) {
      let code = text.charCodeAt(i);
      
      if (code <= 0x7f) {
        bytes.push(code);
      } else if (code <= 0x7ff) {
        bytes.push(0xc0 | (code >> 6));
        bytes.push(0x80 | (code & 0x3f));
      } else if (code >= 0xd800 && code <= 0xdbff) {
        // 处理代理对 (surrogate pairs)
        if (i + 1 < text.length) {
          const nextCode = text.charCodeAt(i + 1);
          if (nextCode >= 0xdc00 && nextCode <= 0xdfff) {
            code = 0x10000 + ((code - 0xd800) << 10) + (nextCode - 0xdc00);
            i++;
            
            bytes.push(0xf0 | (code >> 18));
            bytes.push(0x80 | ((code >> 12) & 0x3f));
            bytes.push(0x80 | ((code >> 6) & 0x3f));
            bytes.push(0x80 | (code & 0x3f));
          }
        }
      } else {
        bytes.push(0xe0 | (code >> 12));
        bytes.push(0x80 | ((code >> 6) & 0x3f));
        bytes.push(0x80 | (code & 0x3f));
      }
    }
    return new Uint8Array(bytes);
  }

  /**
   * 手动实现 UTF-8 解码
   * @param bytes 要解码的 Uint8Array
   * @returns 解码后的字符串
   * @private
   */
  private static utf8Decode(bytes: Uint8Array): string {
    let result = '';
    let i = 0;
    
    while (i < bytes.length) {
      const byte1 = bytes[i++];
      
      if (byte1 < 0x80) {
        // 1 字节字符
        result += String.fromCharCode(byte1);
      } else if (byte1 >= 0xc0 && byte1 < 0xe0) {
        // 2 字节字符
        const byte2 = bytes[i++] & 0x3f;
        result += String.fromCharCode(((byte1 & 0x1f) << 6) | byte2);
      } else if (byte1 >= 0xe0 && byte1 < 0xf0) {
        // 3 字节字符
        const byte2 = bytes[i++] & 0x3f;
        const byte3 = bytes[i++] & 0x3f;
        result += String.fromCharCode(((byte1 & 0x0f) << 12) | (byte2 << 6) | byte3);
      } else if (byte1 >= 0xf0) {
        // 4 字节字符 (代理对)
        const byte2 = bytes[i++] & 0x3f;
        const byte3 = bytes[i++] & 0x3f;
        const byte4 = bytes[i++] & 0x3f;
        const codepoint = ((byte1 & 0x07) << 18) | (byte2 << 12) | (byte3 << 6) | byte4;
        
        // 转换为代理对
        result += String.fromCharCode(
          0xd800 + ((codepoint - 0x10000) >> 10),
          0xdc00 + ((codepoint - 0x10000) & 0x3ff)
        );
      }
    }
    
    return result;
  }
}