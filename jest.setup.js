import '@testing-library/jest-dom';

// Polyfill for TextEncoder/TextDecoder in Jest environment
global.TextEncoder = require('util').TextEncoder;
global.TextDecoder = require('util').TextDecoder;
