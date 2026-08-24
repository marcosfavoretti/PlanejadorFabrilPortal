import {
  AfterViewInit,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import {
  BarcodeFormat,
  BrowserCodeReader,
  BrowserMultiFormatOneDReader,
  BrowserMultiFormatReader,
  IScannerControls,
} from '@zxing/browser';
import {
  ChecksumException,
  DecodeHintType,
  FormatException,
  NotFoundException,
} from '@zxing/library';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import type { BarcodeReaderType } from './barcode-scanner-input.component';

@Component({
  selector: 'app-barcode-scanner-popup',
  standalone: true,
  templateUrl: './barcode-scanner-popup.component.html',
  styleUrl: './barcode-scanner-popup.component.css',
})
export class BarcodeScannerPopupComponent implements AfterViewInit, OnDestroy {
  @ViewChild('barcodeVideo') barcodeVideo?: ElementRef<HTMLVideoElement>;

  loading = true;
  error = '';
  torchAvailable = false;
  torchEnabled = false;
  videoDevices: MediaDeviceInfo[] = [];
  selectedDeviceId = '';
  private controls?: IScannerControls;
  private mediaStream?: MediaStream;
  private reader?: BrowserMultiFormatOneDReader | BrowserMultiFormatReader;
  private readonly readerType: BarcodeReaderType;
  private destroyed = false;
  private hasResult = false;
  private scannerSession = 0;

  constructor(
    private readonly dialogRef: DynamicDialogRef,
    private readonly ngZone: NgZone,
    config: DynamicDialogConfig,
  ) {
    this.readerType = this.parseReaderType(config.data?.readerType);
  }

  ngAfterViewInit(): void {
    requestAnimationFrame(() =>
      requestAnimationFrame(() => void this.startScanner()),
    );
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.stopScanner();
  }

  close(): void {
    this.stopScanner();
    this.dialogRef.close();
  }

  async toggleTorch(): Promise<void> {
    const track = this.mediaStream?.getVideoTracks()[0];
    if (!track) return;

    try {
      const nextValue = !this.torchEnabled;
      await track.applyConstraints({
        advanced: [{ torch: nextValue } as MediaTrackConstraintSet],
      });
      this.torchEnabled = nextValue;
    } catch {
      this.torchAvailable = false;
      this.torchEnabled = false;
    }
  }

  async changeCamera(deviceId: string): Promise<void> {
    if (!deviceId || deviceId === this.selectedDeviceId) return;
    this.selectedDeviceId = deviceId;
    this.stopScanner();
    this.loading = true;
    this.error = '';
    await this.startScanner(deviceId);
  }

  private async startScanner(deviceId?: string): Promise<void> {
    if (!navigator.mediaDevices?.getUserMedia) {
      this.loading = false;
      this.error = 'A câmera não está disponível neste dispositivo.';
      return;
    }

    const session = ++this.scannerSession;

    try {
      const video = this.barcodeVideo?.nativeElement;
      if (!video)
        throw new Error('Não foi possível iniciar a visualização da câmera.');

      await this.loadVideoDevices();
      const selectedDeviceId = deviceId || this.selectedDeviceId || undefined;
      const constraints: MediaStreamConstraints = {
        audio: false,
        video: selectedDeviceId
          ? { deviceId: { exact: selectedDeviceId } }
          : { facingMode: { ideal: 'environment' } },
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      if (this.destroyed || session !== this.scannerSession) {
        this.stopMediaStream(stream);
        return;
      }

      this.mediaStream = stream;
      video.srcObject = stream;
      await video.play();
      await this.waitForVideoDimensions(video);

      this.reader = this.createReader();
      const controls = await this.reader.decodeFromVideoElement(
        video,
        (result, error, callbackControls) => {
          const value = result?.getText().trim();
          if (value && !this.hasResult) {
            this.hasResult = true;
            callbackControls.stop();
            this.ngZone.run(() => this.dialogRef.close(value));
            return;
          }

          if (error && !this.isExpectedDecodeError(error)) {
            this.error = this.getCameraError(error);
          }
        },
      );

      if (this.destroyed || session !== this.scannerSession) {
        controls.stop();
        return;
      }

      this.controls = controls;
      await this.loadVideoDevices();
      const activeDeviceId = this.getActiveDeviceId(video);
      if (activeDeviceId) this.selectedDeviceId = activeDeviceId;
      if (!this.destroyed) {
        this.torchAvailable = this.hasTorch(stream);
        this.loading = false;
      }
    } catch (error) {
      if (!this.destroyed && session === this.scannerSession) {
        this.stopScanner();
        this.loading = false;
        this.error = this.getCameraError(error);
      }
    }
  }

  private stopScanner(): void {
    this.scannerSession++;
    this.controls?.stop();
    this.controls = undefined;
    this.reader = undefined;
    if (this.mediaStream) this.stopMediaStream(this.mediaStream);
    this.mediaStream = undefined;
    const video = this.barcodeVideo?.nativeElement;
    if (video) video.srcObject = null;
    this.torchAvailable = false;
    this.torchEnabled = false;
  }

  private stopMediaStream(stream: MediaStream): void {
    stream.getTracks().forEach((track) => track.stop());
  }

  private async waitForVideoDimensions(video: HTMLVideoElement): Promise<void> {
    const timeoutAt = performance.now() + 8000;

    while (video.videoWidth === 0 || video.videoHeight === 0) {
      if (performance.now() >= timeoutAt) {
        throw new Error(
          'A câmera foi ativada, mas não forneceu uma imagem válida.',
        );
      }

      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    }
  }

  private hasTorch(stream: MediaStream): boolean {
    try {
      const track = stream.getVideoTracks()[0];
      const capabilities = track?.getCapabilities() as
        | (MediaTrackCapabilities & { torch?: boolean })
        | undefined;
      return capabilities?.torch === true;
    } catch {
      return false;
    }
  }

  private isExpectedDecodeError(error: unknown): boolean {
    return (
      error instanceof NotFoundException ||
      error instanceof ChecksumException ||
      error instanceof FormatException
    );
  }

  private async loadVideoDevices(): Promise<void> {
    try {
      this.videoDevices = await BrowserCodeReader.listVideoInputDevices();
    } catch {
      this.videoDevices = [];
    }
  }

  private getActiveDeviceId(video: HTMLVideoElement): string | undefined {
    const stream =
      video.srcObject instanceof MediaStream ? video.srcObject : undefined;
    return stream?.getVideoTracks()[0]?.getSettings().deviceId;
  }

  private createReader():
    | BrowserMultiFormatOneDReader
    | BrowserMultiFormatReader {
    const hints = new Map<DecodeHintType, unknown>();
    const formats = this.getFormats();
    if (formats) hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);
    hints.set(DecodeHintType.TRY_HARDER, true);

    const options = {
      delayBetweenScanAttempts: 120,
      delayBetweenScanSuccess: 500,
    };

    return this.readerType === 'barcode'
      ? new BrowserMultiFormatOneDReader(hints, options)
      : new BrowserMultiFormatReader(hints, options);
  }

  private getCameraError(error: unknown): string {
    if (error instanceof DOMException) {
      if (error.name === 'NotAllowedError')
        return 'Permita o acesso à câmera para fazer a leitura.';
      if (error.name === 'NotFoundError')
        return 'Nenhuma câmera foi encontrada neste dispositivo.';
      if (error.name === 'NotReadableError')
        return 'A câmera está sendo usada por outro aplicativo.';
    }
    return error instanceof Error
      ? error.message
      : 'Não foi possível acessar a câmera.';
  }

  private parseReaderType(value: unknown): BarcodeReaderType {
    return value === 'barcode' || value === 'qrcode' || value === 'datamatrix'
      ? value
      : 'all';
  }

  private getFormats(): BarcodeFormat[] | undefined {
    if (this.readerType === 'qrcode') return [BarcodeFormat.QR_CODE];
    if (this.readerType === 'datamatrix') return [BarcodeFormat.DATA_MATRIX];
    if (this.readerType === 'barcode') {
      return [
        BarcodeFormat.CODE_128,
        BarcodeFormat.CODE_39,
        BarcodeFormat.CODE_93,
        BarcodeFormat.CODABAR,
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.ITF,
        BarcodeFormat.UPC_A,
        BarcodeFormat.UPC_E,
      ];
    }
    return undefined;
  }
}
