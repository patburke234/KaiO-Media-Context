export interface RemoteServer {
    UploadMedia(fileName: string, file: Blob, callback: (fileName: string, url: string) => void): Promise<void>;
    DownloadMedia(fileName: string, callback: (file: File) => void): Promise<void>;
    GetMediaDownloadUrl(fileName: string): Promise<string | undefined>;
    GetMediaSize(fileName: string): Promise<number | undefined>;
}

//TODO: This is where you connect to your remote file storage. For example, S3, Azure, or GCP/Firebase Storage
export class YourRemoteServer implements RemoteServer {
    UploadMedia(fileName: string, file: Blob, callback: (fileName: string, url: string) => void): Promise<void> {
        throw new Error("Implement me");
    }
    DownloadMedia(fileName: string, callback: (file: File) => void): Promise<void> {
        throw new Error("Implement me");
    }
    GetMediaDownloadUrl(fileName: string): Promise<string | undefined> {
        throw new Error("Implement me");
    }
    GetMediaSize(fileName: string): Promise<number | undefined> {
        throw new Error("Implement me");
    }

}