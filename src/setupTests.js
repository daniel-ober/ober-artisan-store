import '@testing-library/jest-dom';

import { TextEncoder, TextDecoder } from 'util';

import { ReadableStream } from 'stream/web';

global.TextEncoder = TextEncoder;

global.TextDecoder = TextDecoder;

global.ReadableStream = ReadableStream;