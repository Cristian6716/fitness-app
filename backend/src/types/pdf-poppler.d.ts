declare module 'pdf-poppler' {
  export interface ConvertOptions {
    format?: 'png' | 'jpg' | 'jpeg';
    out_dir?: string;
    out_prefix?: string;
    page?: number | null;
    scale?: number;
    size?: number;
  }

  export function convert(
    file: string,
    options: ConvertOptions
  ): Promise<void>;

  export function info(file: string): Promise<any>;
}
