// Chrome API Mock for testing

interface StorageArea {
  get: jest.Mock;
  set: jest.Mock;
  remove: jest.Mock;
  clear: jest.Mock;
}

const createStorageArea = (): StorageArea => ({
  get: jest.fn((_keys, callback) => {
    if (callback) callback({});
    return Promise.resolve({});
  }),
  set: jest.fn((_items, callback) => {
    if (callback) callback();
    return Promise.resolve();
  }),
  remove: jest.fn((_keys, callback) => {
    if (callback) callback();
    return Promise.resolve();
  }),
  clear: jest.fn((callback) => {
    if (callback) callback();
    return Promise.resolve();
  }),
});

const chromeMock = {
  storage: {
    local: createStorageArea(),
    sync: createStorageArea(),
  },
  runtime: {
    sendMessage: jest.fn((_message, callback) => {
      if (callback) callback({});
      return Promise.resolve({});
    }),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
      hasListener: jest.fn(),
    },
    getURL: jest.fn((path) => `chrome-extension://mock-id/${path}`),
  },
  tabs: {
    query: jest.fn((_queryInfo, callback) => {
      if (callback) callback([]);
      return Promise.resolve([]);
    }),
    sendMessage: jest.fn((_tabId, _message, callback) => {
      if (callback) callback({});
      return Promise.resolve({});
    }),
  },
};

global.chrome = chromeMock as any;

export default chromeMock;
