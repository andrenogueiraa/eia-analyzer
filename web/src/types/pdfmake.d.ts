declare module "pdfmake/build/pdfmake" {
  interface TDocumentDefinitions {
    content: unknown[];
    styles?: Record<string, unknown>;
    defaultStyle?: Record<string, unknown>;
    pageSize?: string;
    pageMargins?: [number, number, number, number];
  }

  interface TCreatedPdf {
    download(filename?: string): void;
    open(): void;
    print(): void;
    getBlob(callback: (blob: Blob) => void): void;
    getBase64(callback: (base64: string) => void): void;
  }

  const pdfMake: {
    vfs: Record<string, string>;
    createPdf(documentDefinition: TDocumentDefinitions): TCreatedPdf;
  };

  export default pdfMake;
}

declare module "pdfmake/build/vfs_fonts" {
  const vfs: Record<string, string>;
  export { vfs };
  export default { vfs };
}
