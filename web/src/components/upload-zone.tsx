import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

interface UploadZoneProps {
  onUpload: (file: File) => void;
  disabled?: boolean;
}

export function UploadZone({ onUpload, disabled }: UploadZoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles[0]) {
        onUpload(acceptedFiles[0]);
      }
    },
    [onUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024, // 50MB
    disabled,
  });

  return (
    <Card
      {...getRootProps()}
      className={cn(
        "border-2 border-dashed cursor-pointer transition-all hover:border-primary/50",
        isDragActive && "border-primary bg-primary/5 scale-105",
        disabled && "opacity-50 cursor-not-allowed hover:border-border"
      )}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <div
          className={cn(
            "mb-4 rounded-full bg-primary/10 p-4 transition-colors",
            isDragActive && "bg-primary/20"
          )}
        >
          <Upload
            className={cn(
              "h-8 w-8 text-primary transition-transform",
              isDragActive && "scale-110"
            )}
          />
        </div>
        {isDragActive ? (
          <p className="text-lg font-medium">Solte o PDF aqui...</p>
        ) : (
          <>
            <p className="mb-2 text-lg font-medium">
              Arraste um PDF aqui, ou clique para selecionar
            </p>
            <p className="text-sm text-muted-foreground">
              Apenas arquivos PDF, máximo 50MB
            </p>
          </>
        )}
      </div>
    </Card>
  );
}
