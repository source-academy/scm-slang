import { BasicHostPlugin } from './BasicHostPlugin';
import { IHostPlugin } from './types';

export class HostPlugin extends BasicHostPlugin implements IHostPlugin {
  private files = new Map<string, string>();
  private outputCallback?: (message: string) => void;
  private errorCallback?: (error: any) => void;

  async requestFile(fileName: string): Promise<string | undefined> {
    return this.files.get(fileName);
  }

  requestLoadPlugin(pluginName: string): void {
    console.log(`Requested to load plugin: ${pluginName}`);
  }

  sendChunk(chunk: string): void {
    super.sendChunk(chunk);
  }

  onOutput(callback: (message: string) => void): void {
    this.outputCallback = callback;
  }

  onError(callback: (error: any) => void): void {
    this.errorCallback = callback;
  }

  receiveOutput(message: string): void {
    if (this.outputCallback) {
      this.outputCallback(message);
    }
  }

  receiveError(error: any): void {
    if (this.errorCallback) {
      this.errorCallback(error);
    }
  }

  // Add a file to the virtual file system
  addFile(fileName: string, content: string): void {
    this.files.set(fileName, content);
  }
} 