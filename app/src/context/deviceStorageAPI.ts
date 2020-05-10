export interface DeviceStorage{
    addNamed(file: Blob, fileName: string): DOMRequest;
    get(fileName: string): DOMRequest;
    enumerate(rootFolder?: string): DOMCursor;
    delete(fileName: string): DOMRequest;
    freeSpace(): DOMRequest;
}

type NavigatorStorageType = "apps" | "music" | "pictures" | "sdcard" | "videos";

export interface NavigatorExtended extends Navigator {
    getDeviceStorage(storageName:NavigatorStorageType): DeviceStorage | undefined;
    getDeviceStorages(storageName?: NavigatorStorageType): DeviceStorage[] | undefined;
}

export interface DOMRequest{
    onsuccess: () => void;
    onerror: () => void;
    result: any;
    error: DOMError;
}

export interface DOMError {
    name: any;
    message: any;
}


export interface DOMCursor extends DOMRequest {
    continue(): void;
    done: boolean;
}