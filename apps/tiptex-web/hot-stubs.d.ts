declare module '@hotpaxel/hot' {
  export default function init(): Promise<void>;
  export class HotConverter {
    constructor();
    extract_hot_tex(html: string): string;
    escape_latex(text: string): string;
  }
}
