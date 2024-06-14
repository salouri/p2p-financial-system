export const COMMON_TOPIC = Buffer.alloc(32).fill('decentrapay');
export const VALUE_ENCODING = {
  preencode(state, value) {
    if (typeof value === 'string') {
      state.end += Buffer.byteLength(value);
    } else {
      throw new TypeError('Expected value to be a string');
    }
  },
  encode(state, value) {
    if (typeof value === 'string') {
      state.buffer.write(value);
    } else {
      throw new TypeError('Expected value to be a string');
    }
  },
  decode(state) {
    return state.buffer.toString();
  },
};
