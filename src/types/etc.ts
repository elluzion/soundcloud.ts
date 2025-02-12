import { Readable } from "stream";

export type RequestParams = string | number | boolean;

export type TrackStream =
  | NodeJS.ReadableStream
  | ReadableStream<Uint8Array<ArrayBufferLike>>
  | Readable;

export interface M3uStream {
  stream: TrackStream;
  type: "m4a" | "mp3";
}
