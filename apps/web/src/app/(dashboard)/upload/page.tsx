'use client';

import { useCallback, useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Title1,
  Title3,
  Text,
  Button,
  makeStyles,
  tokens,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Spinner,
} from '@fluentui/react-components';
import {
  ArrowUpload24Regular,
  DocumentCheckmark24Regular,
  Dismiss24Regular,
} from '@fluentui/react-icons';

const useStyles = makeStyles({
  container: {
    maxWidth: '720px',
  },
  subtitle: {
    display: 'block',
    marginTop: '8px',
    color: tokens.colorNeutralForeground3,
  },
  dropZone: {
    marginTop: '24px',
    border: `2px dashed ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusLarge,
    padding: '48px 32px',
    textAlign: 'center' as const,
    cursor: 'pointer',
    transitionProperty: 'border-color, background-color',
    transitionDuration: '0.2s',
  },
  dropZoneHover: {
    borderTopColor: tokens.colorBrandStroke1,
    borderRightColor: tokens.colorBrandStroke1,
    borderBottomColor: tokens.colorBrandStroke1,
    borderLeftColor: tokens.colorBrandStroke1,
    backgroundColor: tokens.colorNeutralBackground2,
  },
  dropZoneActive: {
    borderTopColor: tokens.colorBrandStroke1,
    borderRightColor: tokens.colorBrandStroke1,
    borderBottomColor: tokens.colorBrandStroke1,
    borderLeftColor: tokens.colorBrandStroke1,
    backgroundColor: tokens.colorBrandBackground2,
  },
  fileInfo: {
    marginTop: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
  },
  actions: {
    marginTop: '24px',
    display: 'flex',
    gap: '12px',
  },
  validationSection: {
    marginTop: '16px',
  },
  validationItem: {
    marginTop: '4px',
    fontSize: tokens.fontSizeBase200,
  },
});

interface UploadResult {
  success: boolean;
  mergedCount: number;
  assessmentId: string;
  newOverallScore: number;
}

export default function UploadPage() {
  const styles = useStyles();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const processFile = useCallback(async (f: File) => {
    setFile(f);
    setParsedData(null);
    setParseError(null);
    setResult(null);
    setUploadError(null);

    try {
      const text = await f.text();
      const json = JSON.parse(text);

      // Basic client-side validation
      if (!json.version || !json.generatedAt || !json.hostname) {
        throw new Error('Missing required fields: version, generatedAt, or hostname.');
      }
      if (!Array.isArray(json.checks) || json.checks.length === 0) {
        throw new Error('The checks array is missing or empty.');
      }
      for (const check of json.checks) {
        if (!check.checkId || !check.categoryId || !check.status || !check.details) {
          throw new Error(
            `Check "${check.checkId ?? 'unknown'}" is missing required fields (checkId, categoryId, status, details).`,
          );
        }
      }

      setParsedData(json);
    } catch (err) {
      if (err instanceof SyntaxError) {
        setParseError('File is not valid JSON.');
      } else {
        setParseError(err instanceof Error ? err.message : 'Unexpected error parsing file.');
      }
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files[0];
      if (f) processFile(f);
    },
    [processFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) processFile(f);
    },
    [processFile],
  );

  const handleUpload = useCallback(async () => {
    if (!parsedData) return;
    setUploading(true);
    setUploadError(null);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsedData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? `Upload failed with status ${res.status}`);
      }
      setResult(data);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Unexpected error.');
    } finally {
      setUploading(false);
    }
  }, [parsedData]);

  const clearFile = useCallback(() => {
    setFile(null);
    setParsedData(null);
    setParseError(null);
    setResult(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  return (
    <div className={styles.container}>
      <Title1 as="h1">Upload PowerShell Results</Title1>
      <Text size={300} className={styles.subtitle}>
        Some checks (Exchange calendar processing and network connectivity) require
        running a PowerShell module on-premises. Follow the steps below to complete
        your assessment.
      </Text>

      <Title3 as="h2" style={{ marginTop: '24px' }}>Upload Results File</Title3>
      <Text size={200} style={{ display: 'block', marginTop: '4px', color: tokens.colorNeutralForeground3 }}>
        Drop the JSON file generated by the PowerShell module. It will be merged
        with your latest assessment automatically.
      </Text>

      {/* Drop zone */}
      <div
        className={`${styles.dropZone} ${dragOver ? styles.dropZoneActive : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <ArrowUpload24Regular style={{ fontSize: '32px' }} />
        <Text
          size={300}
          weight="semibold"
          style={{ display: 'block', marginTop: '12px' }}
        >
          Drag and drop your JSON file here
        </Text>
        <Text size={200} style={{ display: 'block', marginTop: '4px', color: tokens.colorNeutralForeground3 }}>
          or click to browse
        </Text>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />
      </div>

      {/* File info */}
      {file && (
        <div className={styles.fileInfo}>
          <DocumentCheckmark24Regular />
          <div style={{ flex: 1 }}>
            <Text weight="semibold">{file.name}</Text>
            <Text size={200} style={{ display: 'block', color: tokens.colorNeutralForeground3 }}>
              {(file.size / 1024).toFixed(1)} KB
            </Text>
          </div>
          <Button
            appearance="subtle"
            icon={<Dismiss24Regular />}
            size="small"
            onClick={clearFile}
          />
        </div>
      )}

      {/* Parse error */}
      {parseError && (
        <MessageBar intent="error" style={{ marginTop: '16px' }}>
          <MessageBarBody>
            <MessageBarTitle>Validation Failed</MessageBarTitle>
            {parseError}
          </MessageBarBody>
        </MessageBar>
      )}

      {/* Validation summary */}
      {parsedData && (
        <div className={styles.validationSection}>
          <MessageBar intent="success">
            <MessageBarBody>
              <MessageBarTitle>File Valid</MessageBarTitle>
              Version: {parsedData.version} | Host: {parsedData.hostname} |{' '}
              {parsedData.checks.length} checks found
            </MessageBarBody>
          </MessageBar>
        </div>
      )}

      {/* Actions */}
      {parsedData && !result && (
        <div className={styles.actions}>
          <Button
            appearance="primary"
            icon={uploading ? undefined : <ArrowUpload24Regular />}
            disabled={uploading}
            onClick={handleUpload}
          >
            {uploading ? <Spinner size="tiny" label="Uploading..." /> : 'Merge with Latest Assessment'}
          </Button>
        </div>
      )}

      {/* Upload error */}
      {uploadError && (
        <MessageBar intent="error" style={{ marginTop: '16px' }}>
          <MessageBarBody>
            <MessageBarTitle>Upload Failed</MessageBarTitle>
            {uploadError}
          </MessageBarBody>
        </MessageBar>
      )}

      {/* Success — auto-redirect to results page */}
      {result && (
        <AutoRedirect assessmentId={result.assessmentId} router={router} />
      )}
    </div>
  );
}

function AutoRedirect({ assessmentId, router }: { assessmentId: string; router: ReturnType<typeof useRouter> }) {
  useEffect(() => {
    router.push(`/assessment/${assessmentId}`);
  }, [assessmentId, router]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '24px' }}>
      <Spinner size="tiny" />
      <Text size={200}>Merge complete. Redirecting to results...</Text>
    </div>
  );
}
